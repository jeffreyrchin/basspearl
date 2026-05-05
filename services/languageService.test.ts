import { describe, it, expect } from 'vitest';
import { getLanguageModel, buildLanguageModel } from './languageService';
import { EFFECT_METADATA } from '../config/effects';
import { MACRO_METADATA } from '../config/macros';
import { GlitchEffectType, MacroMetadata } from '../types';

describe('LanguageService', () => {
  it('builds the model without crashing', () => {
    const model = buildLanguageModel();
    expect(model).toBeDefined();
    expect(model.knownPatterns.length).toBeGreaterThan(0);
  });

  describe('generatePipeline', () => {
    const model = getLanguageModel();

    it('generates a pipeline with the requested length', () => {
      const pipeline = model.generatePipeline({ length: 4 });
      expect(pipeline).toHaveLength(4);
    });

    it('always starts with a Pattern effect', () => {
      // Run multiple times to catch statistical leaks
      for (let i = 0; i < 20; i++) {
        const pipeline = model.generatePipeline();
        const firstEffect = pipeline[0];
        const meta = EFFECT_METADATA[firstEffect.type as GlitchEffectType];
        expect(meta.category).toBe('Pattern');
      }
    });

    it('enforces a specific startPattern if provided', () => {
      const startPattern: GlitchEffectType = 'ORGANIC_NOISE';
      const pipeline = model.generatePipeline({ startPattern });
      expect(pipeline[0].type).toBe(startPattern);
    });

    it('generates valid EffectConfig objects', () => {
      const pipeline = model.generatePipeline({ length: 5 });

      pipeline.forEach(effect => {
        expect(effect.id).toBeDefined();
        expect(typeof effect.id).toBe('string');
        expect(EFFECT_METADATA[effect.type as GlitchEffectType]).toBeDefined(); // Type check
        expect(effect.muted).toBe(false);
        expect(effect.soloed).toBe(false);
        expect(typeof effect.seed).toBe('number');
      });
    });

    it('generates parameters matching EFFECT_METADATA and safety bounds', () => {
      const pipeline = model.generatePipeline({ length: 3 });

      pipeline.forEach(effect => {
        const meta = EFFECT_METADATA[effect.type as GlitchEffectType];
        expect(effect.params).toHaveLength(meta.params.length);

        effect.params.forEach((p, i) => {
          const metaParam = meta.params[i];
          expect(p.param).toBe(metaParam.name);
          expect(typeof p.value).toBe('number');

          // Safety Bounds: Glitchbrain sliders are 0-100
          expect(p.value).toBeGreaterThanOrEqual(metaParam.defaultMin ?? 0);
          expect(p.value).toBeLessThanOrEqual(100);

          // Precision: Max 1 decimal place for UI cleanliness
          const decimals = (p.value.toString().split('.')[1] || '').length;
          expect(decimals).toBeLessThanOrEqual(1);

          // Frequency Band: Must be a valid key
          expect(['OFF', 'SUB', 'BASS', 'MID', 'TREBLE']).toContain(p.frequencyBand);
        });
      });
    });

    it('generates unique IDs within a pipeline', () => {
      const pipeline = model.generatePipeline({ length: 10 });
      const ids = pipeline.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Statistical Consistency & Vocabulary', () => {
    const model = getLanguageModel();

    it('only uses patterns found in presets for the starting slot', () => {
      const pipeline = model.generatePipeline();
      const firstType = pipeline[0].type;
      expect(model.knownPatterns).toContain(firstType);
    });

    it('never generates an effect type that does not exist in the training data', () => {
      const vocabulary = new Set<string>();
      for (let i = 0; i < 50; i++) {
        model.generatePipeline().forEach(e => vocabulary.add(e.type));
      }

      // Collect every effect used in any macro
      const macroEffects = new Set<string>();
      Object.values(MACRO_METADATA).forEach((macro: MacroMetadata) => {
        macro.effects.forEach(e => macroEffects.add(e.type));
      });

      vocabulary.forEach(type => {
        expect(macroEffects.has(type)).toBe(true);
      });
    });

    it('only generates transitions (A -> B) that exist in at least one preset', () => {
      // 1. Map out all valid transitions from the presets
      const validTransitions = new Set<string>();
      Object.values(MACRO_METADATA).forEach((macro: MacroMetadata) => {
        for (let i = 0; i < macro.effects.length - 1; i++) {
          validTransitions.add(`${macro.effects[i].type}->${macro.effects[i + 1].type}`);
        }
      });

      // 2. Generate pipelines and check every jump
      for (let i = 0; i < 20; i++) {
        const pipeline = model.generatePipeline({ length: 6 });
        for (let j = 0; j < pipeline.length - 1; j++) {
          const transition = `${pipeline[j].type}->${pipeline[j + 1].type}`;
          expect(validTransitions.has(transition)).toBe(true);
        }
      }
    });

    it('only generates (Effect, Param, Band) combinations that exist in the presets (including defaults)', () => {
      const validBands = new Set<string>();

      Object.values(MACRO_METADATA).forEach((macro: MacroMetadata) => {
        macro.effects.forEach(effect => {
          const meta = EFFECT_METADATA[effect.type];
          if (!meta) return;

          // Check every parameter the effect is CAPABLE of having
          meta.params.forEach(metaParam => {
            const explicitParam = effect.params?.find(p => p.param === metaParam.name);
            // If explicit in macro, use that band. Otherwise, use the engine's default band.
            const band = explicitParam?.frequencyBand ?? metaParam.defaultBand ?? 'OFF';
            validBands.add(`${effect.type}:${metaParam.name}:${band}`);
          });
        });
      });

      for (let i = 0; i < 20; i++) {
        const pipeline = model.generatePipeline();
        pipeline.forEach(effect => {
          effect.params.forEach(p => {
            const combo = `${effect.type}:${p.param}:${p.frequencyBand}`;
            expect(validBands.has(combo), `AI generated unknown combo: ${combo}`).toBe(true);
          });
        });
      }
    });

    it('never applies jitter to structural parameters (Scale, Pan)', () => {
      for (let i = 0; i < 20; i++) {
        const pipeline = model.generatePipeline({ temperature: 1.0 });
        pipeline.forEach(effect => {
          effect.params.forEach(p => {
            if (p.param.includes('Scale') || p.param.includes('Pan')) {
              // With zero jitter, an interpolated value between integers (or same integers)
              // should always have a clean decimal (at most 1 from interpolation, never random noise).
              // Since our rounding logic is Math.round(v * 10) / 10, jitter usually creates
              // many different decimals. Zero jitter keeps it on the clean manifold.
              const isClean = (p.value * 10) % 1 === 0;
              expect(isClean).toBe(true);
            }
          });
        });
      }
    });

    it('enforces a hard safety cap of 20 on all Speed parameters', () => {
      for (let i = 0; i < 20; i++) {
        const pipeline = model.generatePipeline({ temperature: 1.0 });
        pipeline.forEach(effect => {
          effect.params.forEach(p => {
            if (p.param.includes('Speed')) {
              expect(p.value).toBeLessThanOrEqual(20);
            }
          });
        });
      }
    });

    it('enforces a hard safety cap of 20 on LUMINANCE_MASK Threshold parameter', () => {
      for (let i = 0; i < 20; i++) {
        const pipeline = model.generatePipeline({ temperature: 1.0 });
        pipeline.forEach(effect => {
          effect.params.forEach(p => {
            if (effect.type === "LUMINANCE_MASK" && p.param === "Threshold") {
              expect(p.value).toBeLessThanOrEqual(20);
            }
          });
        });
      }
    });

    it('enforces a hard safety min of 3 on INFINITE_ZOOM Plane Count parameter', () => {
      for (let i = 0; i < 20; i++) {
        const pipeline = model.generatePipeline({ temperature: 1.0 });
        pipeline.forEach(effect => {
          effect.params.forEach(p => {
            if (effect.type === "INFINITE_ZOOM" && p.param === "Plane Count") {
              expect(p.value).toBeGreaterThanOrEqual(3);
            }
          });
        });
      }
    });
  });
});
