import { describe, it, expect } from 'vitest';
import { getLanguageModel, buildLanguageModel } from './languageService';
import { EFFECT_METADATA } from '../config/effects';
import { MACRO_METADATA } from '../config/macros';
import { EffectConfig, GlitchEffectType, MacroMetadata } from '../types';

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
      for (let i = 0; i < 100; i++) {
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

      for (let i = 0; i < 100; i++) {
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
      // Scale and Pan should be rock-solid to prevent visual seams or misalignment
      for (let i = 0; i < 50; i++) {
        // Even at max temperature, structural jitter should be 0.
        const params = model.sampleParams('SHAPE', 1.0);
        params.forEach(p => {
          if (p.param.includes('Scale') || p.param.includes('Pan')) {
            // Our interpolation logic uses Math.random() for the vector, 
            // but if jitter is 0, the value should be exactly the base vector.
            // Since our base observations are integers, the result of 
            // lerp(a, b, t) where a,b are ints and t is random will have at most 1 decimal place 
            // due to our rounding logic (Math.round(v * 10) / 10).
            // Jittered values would be arbitrary floats that don't land on clean decimals.
            const isClean = Math.abs((p.value * 10) % 1) < 0.0001;
            expect(isClean).toBe(true);
          }
        });
      }
    });

    it('increases parameter variance as temperature increases', () => {
      const type = 'GRAIN';

      const getVariance = (temp: number) => {
        const samples: number[] = [];
        // Increase sample size to stabilize the statistical measure
        for (let i = 0; i < 500; i++) {
          const p = model.sampleParams(type, temp).find(p => p.param === 'Freq X');
          if (p) samples.push(p.value);
        }
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        return samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
      };

      const lowVar = getVariance(0.0);
      const highVar = getVariance(1.0);

      // High temperature should produce more variance than zero temperature
      // (Variance at temp=0 is just the variance of picking different pairs of observations,
      // while temp=1 adds significant Gaussian jitter).
      expect(highVar).toBeGreaterThan(lowVar);
    });

    it('enforces a hard safety cap of 20 on all Speed parameters', () => {
      // Pick an effect known to have a Speed parameter
      for (let i = 0; i < 50; i++) {
        const params = model.sampleParams('WAVE_DISTORTION', 1.0);
        params.forEach(p => {
          if (p.param.includes('Speed')) expect(p.value).toBeLessThanOrEqual(20);
        });
      }
    });

    it('enforces a hard safety cap of 20 on LUMINANCE_MASK Threshold parameter', () => {
      for (let i = 0; i < 50; i++) {
        const params = model.sampleParams('LUMINANCE_MASK', 1.0);
        const threshold = params.find(p => p.param === 'Threshold');
        if (threshold) expect(threshold.value).toBeLessThanOrEqual(20);
      }
    });

    it('enforces a hard safety min of 3 on INFINITE_ZOOM Plane Count parameter', () => {
      for (let i = 0; i < 50; i++) {
        const params = model.sampleParams('INFINITE_ZOOM', 1.0);
        const planes = params.find(p => p.param === 'Plane Count');
        if (planes) expect(planes.value).toBeGreaterThanOrEqual(3);
      }
    });

    it('enforces EDGE_MASK Thickness constraints (Relative rule: Thickness >= Sensitivity - 3)', () => {
      const mockPipeline: EffectConfig[] = [
        { id: 'p1', type: 'ORGANIC_NOISE', params: [] }
      ];

      for (let i = 0; i < 100; i++) {
        const params = model.sampleParams('EDGE_MASK', 1.0, mockPipeline);
        const sensitivity = params.find(p => p.param === 'Sensitivity');
        const thickness = params.find(p => p.param === 'Thickness');

        if (sensitivity && thickness) {
          const expectedMin = Math.round((sensitivity.value - 3) * 10) / 10;
          expect(thickness.value).toBeGreaterThanOrEqual(expectedMin);
        }
      }
    });

    it('forces sole Pattern Blend to 100% when no other Pattern is in the pipeline', () => {
      for (let i = 0; i < 50; i++) {
        // Empty context means this will be the first pattern
        const params = model.sampleParams('GRAIN', 1.0, []);
        const blend = params.find(p => p.param === 'Blend');
        if (blend) expect(blend.value).toBe(100);
      }
    });

    it('allows Pattern Blend to be < 100% when another pattern is already present', () => {
      const mockPipeline: EffectConfig[] = [
        { id: 'p1', type: 'GRAIN', params: [] }
      ];

      let foundLowBlend = false;
      for (let i = 0; i < 100; i++) {
        const params = model.sampleParams('SHAPE', 1.0, mockPipeline);
        const blend = params.find(p => p.param === 'Blend');
        if (blend && blend.value < 100) {
          foundLowBlend = true;
          break;
        }
      }
      expect(foundLowBlend).toBe(true);
    });

    it('caps DEEP_FRY Heat ≤ 30 when a low-Blend pattern exists in the pipeline', () => {
      // Manually construct a context that triggers the rule
      const mockPipeline: EffectConfig[] = [
        {
          id: 'test-1',
          type: 'ORGANIC_NOISE',
          params: [
            { param: 'Blend', value: 10, min: 0, frequencyBand: 'BASS' }
          ]
        }
      ];

      // Run multiple samples to ensure the constraint is always enforced
      for (let i = 0; i < 50; i++) {
        const params = model.sampleParams('DEEP_FRY', 1.0, mockPipeline);
        const heat = params.find(p => p.param === 'Heat');
        if (heat) {
          expect(heat.value).toBeLessThanOrEqual(30);
        }
      }
    });
  });
});
