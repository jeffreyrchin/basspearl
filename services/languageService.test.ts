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
          const floor = metaParam.defaultMin ?? 0;
          expect(p.value).toBeGreaterThanOrEqual(floor);
          expect(p.value).toBeLessThanOrEqual(100);
          expect(p.min).toBeGreaterThanOrEqual(floor);
          expect(p.min).toBeLessThanOrEqual(100);

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

    it('increases compositional entropy as temperature increases (starter effects)', () => {
      const getStarterDistribution = (temp: number) => {
        const counts: Record<string, number> = {};
        for (let i = 0; i < 500; i++) {
          const pipeline = model.generatePipeline({ length: 1, temperature: temp });
          const type = pipeline[0].type;
          counts[type] = (counts[type] || 0) + 1;
        }
        return counts;
      };

      const lowTempDist = getStarterDistribution(0.01);
      const highTempDist = getStarterDistribution(1.0);

      // At low temp, the distribution should be "peaked" (the top choice is very frequent)
      const lowTempMaxFreq = Math.max(...Object.values(lowTempDist));
      // At high temp, the distribution should be "flatter" (the top choice is less frequent)
      const highTempMaxFreq = Math.max(...Object.values(highTempDist));

      expect(lowTempMaxFreq).toBeGreaterThan(highTempMaxFreq);
    });

    it('increases compositional entropy as temperature increases (transitions)', () => {
      // Pick a common "parent" effect that we know has many transitions in macros (like ORGANIC_NOISE)
      const parentType = 'ORGANIC_NOISE';

      const getTransitionDistribution = (temp: number) => {
        const counts: Record<string, number> = {};
        for (let i = 0; i < 500; i++) {
          // Force the first effect to be our parent type and check what follows it
          const pipeline = model.generatePipeline({
            startPattern: parentType,
            length: 2,
            temperature: temp
          });
          if (pipeline.length > 1) {
            const nextType = pipeline[1].type;
            counts[nextType] = (counts[nextType] || 0) + 1;
          }
        }
        return counts;
      };

      const lowTempDist = getTransitionDistribution(0.01);
      const highTempDist = getTransitionDistribution(1.0);

      const lowTempMaxFreq = Math.max(...Object.values(lowTempDist));
      const highTempMaxFreq = Math.max(...Object.values(highTempDist));

      // Low temperature should be much more deterministic (peaked on the most common transition)
      expect(lowTempMaxFreq).toBeGreaterThan(highTempMaxFreq);
    });

    it('enforces a hard safety cap of 20 on LUMINANCE_MASK Threshold parameter (value and min)', () => {
      for (let i = 0; i < 50; i++) {
        const params = model.sampleParams('LUMINANCE_MASK', 1.0);
        const threshold = params.find(p => p.param === 'Threshold');
        if (threshold) {
          expect(threshold.value).toBeLessThanOrEqual(20);
          expect(threshold.min).toBeLessThanOrEqual(20);
        }
      }
    });

    it('enforces a hard safety min of 3 on INFINITE_ZOOM Plane Count parameter (value and min)', () => {
      for (let i = 0; i < 50; i++) {
        const params = model.sampleParams('INFINITE_ZOOM', 1.0);
        const planes = params.find(p => p.param === 'Plane Count');
        if (planes) {
          expect(planes.value).toBeGreaterThanOrEqual(3);
          expect(planes.min).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it('enforces EDGE_MASK Thickness constraints (Relative rule: Thickness >= Sensitivity - 3 for value and min)', () => {
      const mockPipeline: EffectConfig[] = [
        { id: 'p1', type: 'ORGANIC_NOISE', params: [] }
      ];

      for (let i = 0; i < 100; i++) {
        const params = model.sampleParams('EDGE_MASK', 1.0, mockPipeline);
        const sensitivity = params.find(p => p.param === 'Sensitivity');
        const thickness = params.find(p => p.param === 'Thickness');

        if (sensitivity && thickness) {
          // Rule: Thickness must be >= Sensitivity - 3 at both endpoints
          const loudFloor = Math.round((sensitivity.value - 3) * 10) / 10;
          expect(thickness.value).toBeGreaterThanOrEqual(loudFloor);

          const quietFloor = Math.round((sensitivity.min - 3) * 10) / 10;
          expect(thickness.min).toBeGreaterThanOrEqual(quietFloor);
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
        const params = model.sampleParams('ORGANIC_NOISE', 1.0, mockPipeline);
        const blend = params.find(p => p.param === 'Blend');
        if (blend && blend.value < 100) {
          foundLowBlend = true;
          break;
        }
      }
      expect(foundLowBlend).toBe(true);
    });

    it('caps DEEP_FRY Heat ≤ 30 (value and min) when a low-Blend pattern exists in the pipeline', () => {
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
          expect(heat.min).toBeLessThanOrEqual(30);
        }
      }
    });

    it('enforces GRID constraint (Horizontal and Vertical cannot both be less than 2)', () => {
      for (let i = 0; i < 100; i++) {
        const params = model.sampleParams('GRID', 1.0);
        const h = params.find(p => p.param === 'Horizontal');
        const v = params.find(p => p.param === 'Vertical');

        if (h && v) {
          // At least one must be >= 2
          expect(Math.max(h.value, v.value)).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('enforces TUNNEL_WARP constraint (Speed <= max(5, 5 * Scale))', () => {
      for (let i = 0; i < 100; i++) {
        const params = model.sampleParams('TUNNEL_WARP', 1.0);
        const speed = params.find(p => p.param === 'Speed');
        const scale = params.find(p => p.param === 'Scale');

        if (speed && scale) {
          const expectedMax = Math.max(5, scale.value * 5);
          expect(speed.value).toBeLessThanOrEqual(expectedMax);

          const expectedMaxMin = Math.max(5, scale.min * 5);
          expect(speed.min).toBeLessThanOrEqual(expectedMaxMin);
        }
      }
    });

    it('samples non-zero min values (reactive floors) learned from macro presets', () => {
      // We know TERRAIN Extrusion has mins like 3 and 7 in presets.
      // We sample multiple times to verify that the generated min can be > 0.
      let foundNonZeroMin = false;

      for (let i = 0; i < 100; i++) {
        const params = model.sampleParams('TERRAIN', 0.5);
        const extrusion = params.find(p => p.param === 'Extrusion');
        if (extrusion && extrusion.min > 0) {
          foundNonZeroMin = true;
          break;
        }
      }

      expect(foundNonZeroMin).toBe(true);
    });
  });
});
