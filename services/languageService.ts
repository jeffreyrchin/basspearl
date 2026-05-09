/**
 * languageService.ts
 *
 * NOTE: No external dependencies. Uses crypto.randomUUID() which is available
 * in all modern browsers and in Node ≥ 19 (same as the rest of this codebase).
 *
 * A lightweight, statistical "language model" for generating glitch pipelines.
 *
 * Conceptual model:
 *   - Each preset (macro) is treated as a "sentence" of effect tokens.
 *   - We learn bigram transition probabilities: P(effectB | effectA).
 *   - We learn "starter" probabilities: P(firstEffect) weighted by Pattern category.
 *   - We learn "parameter distributions" per effect type, so generated params
 *     are interpolated from real preset values rather than being fully random.
 *
 * Usage:
 *   const model = buildLanguageModel();
 *   const pipeline = model.generatePipeline({ length: 4 });
 *   // pipeline is EffectConfig[] ready to be loaded into the effect store.
 */

// No external imports needed — crypto.randomUUID() is available globally.
import { MACRO_METADATA } from '../config/macros';
import { EFFECT_METADATA } from '../config/effects';
import { EffectConfig, GlitchEffectType, FrequencyBand, MacroMetadata } from '../types';
import { useEffectStore } from '../store/useEffectStore';

// ---------------------------------------------------------------------------
// Internal model types
// ---------------------------------------------------------------------------

/** Learned parameters for one effect slot observed in presets. */
interface LearnedParamSet {
  /** Parallel arrays of observed values, one entry per training example. */
  values: number[][];
  /** Parallel arrays of observed frequency bands, one entry per training example. */
  bands: FrequencyBand[][];
  /** Parallel arrays of observed min values (reactive floors), one entry per training example. */
  mins: number[][];
}

/** Everything learned about a single effect type. */
interface EffectModel {
  /** How many times this type appears as the very first effect. */
  starterCount: number;
  /** Transition counts: how many times effectType X followed this effect. */
  transitions: Map<GlitchEffectType, number>;
  /** Total number of transitions out of this node. */
  totalTransitions: number;
  /** Observed parameter vectors from all presets. */
  params: LearnedParamSet;
  /** How many samples were seen (for averaging). */
  sampleCount: number;
  /** How many times this effect appears as a terminal (last) effect. */
  terminalCount: number;
}

export interface LanguageModel {
  /** Generate a complete EffectConfig[] pipeline. */
  generatePipeline(options?: GenerateOptions): EffectConfig[];
  /** Generate parameters for a specific effect type in context. */
  sampleParams(type: GlitchEffectType, temperature: number, pipelineContext?: EffectConfig[]): EffectConfig['params'];
  /** List of all Pattern-category effect types seen in presets. */
  knownPatterns: GlitchEffectType[];
}

export interface GenerateOptions {
  /**
   * Force the first effect to be this pattern type.
   * If omitted, the model samples one weighted by how often
   * patterns appear first in presets.
   */
  startPattern?: GlitchEffectType;
  /**
   * Target number of effects in the pipeline (including the starting pattern).
   * The model may produce slightly fewer if it reaches a dead end.
   * Defaults to a random value between 3 and 6 (matching preset lengths).
   */
  length?: number;
  /**
   * 0–1 temperature. Higher = more surprising / random choices.
   * Lower = more faithful to the most common preset patterns.
   * Defaults to 0.5.
   */
  temperature?: number;
}

// ---------------------------------------------------------------------------
// Build the model from macro training data
// ---------------------------------------------------------------------------

/**
 * Scans all MACRO_METADATA presets and builds a statistical transition model.
 * This is O(macros * effects_per_macro) and runs once at module load time.
 */
export function buildLanguageModel(): LanguageModel {
  const effectModels = new Map<GlitchEffectType, EffectModel>();

  // Helper: get or create an EffectModel entry
  function getModel(type: GlitchEffectType): EffectModel {
    if (!effectModels.has(type)) {
      effectModels.set(type, {
        starterCount: 0,
        transitions: new Map(),
        totalTransitions: 0,
        params: { values: [], bands: [], mins: [] },
        sampleCount: 0,
        terminalCount: 0,
      });
    }
    return effectModels.get(type)!;
  }

  // Iterate over every macro preset as a "training sentence"
  const macros = Object.values(MACRO_METADATA) as MacroMetadata[];
  for (const macro of macros) {
    const effects = macro.effects;
    if (!effects || effects.length === 0) continue;

    for (let i = 0; i < effects.length; i++) {
      const current = effects[i];
      const model = getModel(current.type);

      // Track starters
      if (i === 0) model.starterCount += 1;

      // Track terminals
      if (i === effects.length - 1) model.terminalCount += 1;

      // Accumulate observed parameter values (in order, normalised to 0-100 range)
      const meta = EFFECT_METADATA[current.type];
      if (meta && current.params) {
        // Build a vector aligned to the canonical param order from EFFECT_METADATA
        const paramVector = meta.params.map((metaParam) => {
          const found = current.params?.find((p) => p.param === metaParam.name);
          return found?.value ?? metaParam.defaultValue;
        });
        const bandVector = meta.params.map((metaParam) => {
          const found = current.params?.find((p) => p.param === metaParam.name);
          return found?.frequencyBand ?? metaParam.defaultBand;
        });
        const minVector = meta.params.map((metaParam) => {
          const found = current.params?.find((p) => p.param === metaParam.name);
          return found?.min ?? metaParam.defaultMin ?? 0;
        });
        model.params.values.push(paramVector);
        model.params.bands.push(bandVector);
        model.params.mins.push(minVector);
        model.sampleCount += 1;
      }

      // Track bigram transitions
      if (i < effects.length - 1) {
        const next = effects[i + 1];
        const count = model.transitions.get(next.type) ?? 0;
        model.transitions.set(next.type, count + 1);
        model.totalTransitions += 1;
      }
    }
  }

  // Derive the set of all Pattern-category effect types seen in presets
  const knownPatterns: GlitchEffectType[] = [];
  for (const [type] of effectModels) {
    const meta = EFFECT_METADATA[type];
    if (meta?.category === 'Pattern') {
      knownPatterns.push(type);
    }
  }

  // ---------------------------------------------------------------------------
  // Sampling utilities
  // ---------------------------------------------------------------------------

  /**
   * Weighted random sample from a distribution.
   * Applies temperature scaling: low temperature makes top choices more likely.
   */
  function weightedSample<T>(
    items: T[],
    weights: number[],
    temperature: number,
  ): T {
    // Apply temperature: w^(1/T) sharpens (low T) or flattens (high T) the distribution
    const scaled = weights.map((w) => Math.pow(w + 1e-8, 1 / Math.max(temperature, 0.01)));
    const total = scaled.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= scaled[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /**
   * Sample the starter effect. Only Pattern-category types are eligible.
   * Weighted by how often each pattern appears as the first effect in presets.
   * If a startPattern is forced, returns it directly after validation.
   */
  function sampleStarter(
    startPattern: GlitchEffectType | undefined,
    temperature: number,
  ): GlitchEffectType {
    if (startPattern) {
      const meta = EFFECT_METADATA[startPattern];
      if (meta?.category !== 'Pattern') {
        console.warn(
          `[languageService] "${startPattern}" is not a Pattern effect. ` +
          `It will be used anyway, but this breaks the Pattern-first rule.`,
        );
      }
      return startPattern;
    }

    // Filter to only patterns that have been seen as starters
    const patternTypes = knownPatterns.filter(
      (t) => (effectModels.get(t)?.starterCount ?? 0) > 0,
    );

    // Fall back to all known patterns if none was ever a starter
    const candidates = patternTypes.length > 0 ? patternTypes : knownPatterns;
    const weights = candidates.map((t) => effectModels.get(t)?.starterCount ?? 1);
    return weightedSample(candidates, weights, temperature);
  }

  /**
   * Sample the next effect given the current one.
   * Returns null if there are no learned transitions (terminal node).
   */
  function sampleNext(
    current: GlitchEffectType,
    alreadyUsed: Set<GlitchEffectType>,
    temperature: number,
  ): GlitchEffectType | null {
    const model = effectModels.get(current);
    if (!model || model.totalTransitions === 0) return null;

    // Build candidate list, down-weighting already-used types to avoid exact copies
    const candidates: GlitchEffectType[] = [];
    const weights: number[] = [];

    for (const [nextType, count] of model.transitions) {
      candidates.push(nextType);
      // Penalise reuse so the pipeline stays diverse
      const penalty = alreadyUsed.has(nextType) ? 0.2 : 1.0;
      weights.push(count * penalty);
    }

    if (candidates.length === 0) return null;
    return weightedSample(candidates, weights, temperature);
  }

  // ---------------------------------------------------------------------------
  // Pipeline-Context Constraints
  // ---------------------------------------------------------------------------

  /**
   * "Amorphous" pattern types — soft, fluid textures with no hard edges.
   * EDGE_MASK (Outline) after these tends to create noisy/overloaded results
   * if Sensitivity is too high or Thickness too low.
   */
  const AMORPHOUS_PATTERNS = new Set<GlitchEffectType>([
    'ORGANIC_NOISE', // Plasma
    'CELLULAR_NOISE', // Cells
  ]);

  /**
   * Resolve absolute per-param constraints based on the pipeline built so far.
   * Returns { paramName -> { max?, min? } } overrides applied in Phase 1.
   */
  function resolveConstraints(
    type: GlitchEffectType,
    pipelineContext: EffectConfig[]
  ): Record<string, { max?: number; min?: number }> {
    const constraints: Record<string, { max?: number; min?: number }> = {};

    // Rule 2: DEEP_FRY (Color Burn) — if pipeline contains any pattern with Blend <= 50,
    // cap Heat at 30 to prevent black screens.
    if (type === 'DEEP_FRY') {
      const hasLowBlend = pipelineContext.some(e => {
        const blendParam = e.params.find(p => p.param === 'Blend');
        return blendParam !== undefined && blendParam.value <= 50;
      });
      if (hasLowBlend) {
        constraints['Heat'] = { max: 30 };
      }
    }

    return constraints;
  }

  /**
   * Apply cross-parameter relative constraints after all values are computed (Phase 2).
   * Mutates paramValues in-place.
   *
   * Rule 1: EDGE_MASK after amorphous patterns: Thickness >= Sensitivity - 3
   * Rule 3: Sole Pattern in pipeline: Blend = 100%
   */
  function applyRelativeConstraints(
    type: GlitchEffectType,
    pipelineContext: EffectConfig[],
    paramValues: number[],
    meta: import('../types').EffectMetadata,
  ): void {
    // Rule 1: EDGE_MASK — enforce thickness to be >= Sensitivity - 3 when amorphous patterns are present.
    if (type === 'EDGE_MASK') {
      const thickIdx = meta.params.findIndex(p => p.name === 'Thickness');
      const sensIdx = meta.params.findIndex(p => p.name === 'Sensitivity');

      if (thickIdx !== -1 && sensIdx !== -1) {
        // Relative Constraint: If pipeline contains amorphous patterns,
        // we need higher thickness to keep the outline defined.
        const hasAmorphous = pipelineContext.some(e => AMORPHOUS_PATTERNS.has(e.type as GlitchEffectType));
        if (hasAmorphous) {
          // Round to 1dp to match the rounding applied to all stored param values,
          // preventing floating-point drift (e.g. 4.7 - 3 = 1.7000000000000002).
          const minThickness = Math.round((paramValues[sensIdx] - 3) * 10) / 10;
          paramValues[thickIdx] = Math.max(paramValues[thickIdx], minThickness);
        }
      }
    }

    // Rule 3: If this is the only Pattern in the pipeline, force Blend = 100%
    // so the canvas is always fully covered.
    if (meta.category === 'Pattern') {
      const hasOtherPattern = pipelineContext.some(
        e => EFFECT_METADATA[e.type as GlitchEffectType]?.category === 'Pattern'
      );
      if (!hasOtherPattern) {
        const blendIdx = meta.params.findIndex(p => p.name === 'Blend');
        if (blendIdx !== -1) paramValues[blendIdx] = 100;
      }
    }
  }

  /**
   * Generate parameter values for a given effect type.
   *
   * Uses a two-phase constraint system:
   *   Phase 1 — independent per-param values (interpolation + jitter + absolute caps)
   *   Phase 2 — cross-param relative constraints (applied after all values are known)
   *
   * @param pipelineContext - Effects generated so far; used for cross-effect constraint resolution.
   */
  function sampleParams(
    type: GlitchEffectType,
    temperature: number,
    pipelineContext: EffectConfig[] = [],
  ): EffectConfig['params'] {
    const meta = EFFECT_METADATA[type];
    if (!meta) return [];

    const model = effectModels.get(type);
    const observations = model?.params.values ?? [];
    const bandObservations = model?.params.bands ?? [];

    let baseVector: number[];
    let baseBands: FrequencyBand[];
    let baseMins: number[];

    if (observations.length === 0) {
      // No training data: use defaults
      baseVector = meta.params.map((p) => p.defaultValue);
      baseBands = meta.params.map((p) => p.defaultBand);
      baseMins = meta.params.map((p) => p.defaultMin ?? 0);
    } else if (observations.length === 1) {
      baseVector = [...observations[0]];
      baseBands = [...bandObservations[0]];
      baseMins = [...(model?.params.mins[0] ?? meta.params.map(p => p.defaultMin ?? 0))];
    } else {
      // Pick two random observed vectors and interpolate
      const idxA = Math.floor(Math.random() * observations.length);
      let idxB = Math.floor(Math.random() * (observations.length - 1));
      if (idxB >= idxA) idxB += 1;

      const vecA = observations[idxA];
      const vecB = observations[idxB];
      const minA = model?.params.mins[idxA] ?? meta.params.map(p => p.defaultMin ?? 0);
      const minB = model?.params.mins[idxB] ?? meta.params.map(p => p.defaultMin ?? 0);

      baseBands = [...bandObservations[idxA]];
      const t = Math.random();
      baseVector = vecA.map((a, i) => a + t * ((vecB[i] ?? a) - a));
      baseMins = minA.map((a, i) => a + t * ((minB[i] ?? a) - a));
    }

    const activeConstraints = resolveConstraints(type, pipelineContext);
    const jitterScale = temperature * 10;

    // PHASE 1: Compute all parameter values and mins independently
    const paramValues: number[] = [];
    const paramMins: number[] = [];

    meta.params.forEach((metaParam, i) => {
      const base = baseVector[i] ?? metaParam.defaultValue;
      const baseMin = baseMins[i] ?? metaParam.defaultMin ?? 0;

      // Structural parameters (Scale, Pan) should not have jitter to avoid visual misalignment/gaps
      const isStructural =
        metaParam.name.includes('Scale X') ||
        metaParam.name.includes('Scale Y') ||
        (metaParam.name.includes('Pan X') && type !== 'SPIRAL_GRADIENT' && type !== 'RADIAL_GRADIENT') ||
        (metaParam.name.includes('Pan Y') && type !== 'SPIRAL_GRADIENT' && type !== 'RADIAL_GRADIENT');

      const jitter = isStructural ? 0 : (Math.random() - 0.5) * 2 * jitterScale;

      // Compute value
      const floor = metaParam.defaultMin ?? 0;
      let value = Math.max(floor, Math.min(100, base + jitter));

      // Compute min (reactive floor)
      let minValue = Math.max(floor, Math.min(100, baseMin + jitter));

      // Safety: Hard cap for 'Speed' parameters to avoid strobing
      if (metaParam.name.includes('Speed')) {
        value = Math.min(value, 20);
        minValue = Math.min(minValue, 20);
      }
      // Safety: Hard cap for LUMINANCE_MASK threshold to avoid black screens
      if (type === 'LUMINANCE_MASK' && metaParam.name === 'Threshold') {
        value = Math.min(value, 20);
        minValue = Math.min(minValue, 20);
      }
      // Safety: Hard min for INFINITE_ZOOM plane count to avoid strobing and black screens
      if (type === 'INFINITE_ZOOM' && metaParam.name === 'Plane Count') {
        value = Math.max(value, 3);
        minValue = Math.max(minValue, 3);
      }

      const constraint = activeConstraints[metaParam.name];
      if (constraint?.max !== undefined) {
        value = Math.min(value, constraint.max);
        minValue = Math.min(minValue, constraint.max);
      }
      if (constraint?.min !== undefined) {
        value = Math.max(value, constraint.min);
        minValue = Math.max(minValue, constraint.min);
      }

      // Ensure value >= min
      value = Math.max(value, minValue);

      paramValues.push(value);
      paramMins.push(minValue);
    });

    // PHASE 2: Apply cross-param relative constraints
    applyRelativeConstraints(type, pipelineContext, paramValues, meta);

    return meta.params.map((metaParam, i) => ({
      param: metaParam.name,
      value: Math.round(paramValues[i] * 10) / 10,
      min: Math.round(paramMins[i] * 10) / 10,
      frequencyBand: baseBands[i] ?? (metaParam.defaultBand as FrequencyBand),
    }));
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function generatePipeline(options: GenerateOptions = {}): EffectConfig[] {
    const temperature = options.temperature ?? 0.5;
    const targetLength =
      options.length ?? Math.floor(Math.random() * 4) + 3; // 3–6 effects

    const pipeline: EffectConfig[] = [];
    const usedTypes = new Set<GlitchEffectType>();

    // Step 1: always start with a Pattern
    const starterType = sampleStarter(options.startPattern, temperature);
    const starterMeta = EFFECT_METADATA[starterType];
    pipeline.push({
      id: crypto.randomUUID(),
      type: starterType,
      params: sampleParams(starterType, temperature),
      muted: false,
      soloed: false,
      seed: Math.floor(Math.random() * 10000),
      aspectLocked: starterMeta?.defaultAspectLocked,
    });
    usedTypes.add(starterType);

    // Step 2: auto-complete the rest using the bigram transition model
    while (pipeline.length < targetLength) {
      const lastType = pipeline[pipeline.length - 1].type;
      const nextType = sampleNext(lastType, usedTypes, temperature);

      if (nextType === null) {
        // Dead end in the transition graph — stop early
        break;
      }

      const nextMeta = EFFECT_METADATA[nextType];
      pipeline.push({
        id: crypto.randomUUID(),
        type: nextType,
        params: sampleParams(nextType, temperature, pipeline), // pass context for cross-effect constraints
        muted: false,
        soloed: false,
        seed: Math.floor(Math.random() * 10000),
        aspectLocked: nextMeta?.defaultAspectLocked,
      });
      usedTypes.add(nextType);
    }

    return pipeline;
  }

  return { generatePipeline, sampleParams, knownPatterns };
}

// ---------------------------------------------------------------------------
// Convenience: generate and load directly into the effect store
// ---------------------------------------------------------------------------

/**
 * Generates a pipeline and loads it straight into the active scene.
 * Wraps useEffectStore.setEffects() so callers don't need to import both.
 *
 * Usage (inside a React component or event handler):
 *   import { generateAndLoad } from '@/services/languageService';
 *   import { useEffectStore } from '@/store/useEffectStore';
 *
 *   const setEffects = useEffectStore(s => s.setEffects);
 *   generateAndLoad(setEffects, { temperature: 0.7 });
 */
export function generateAndLoad(
  setEffects: (effects: import('../types').EffectConfig[]) => void,
  options?: GenerateOptions,
): void {
  const model = getLanguageModel();
  const pipeline = model.generatePipeline(options);
  useEffectStore.getState().clearSelection();
  setEffects(pipeline);
}

// ---------------------------------------------------------------------------
// Module-level singleton — build once, reuse everywhere
// ---------------------------------------------------------------------------

let _model: LanguageModel | null = null;

/** Returns the shared singleton model, building it on first call. */
export function getLanguageModel(): LanguageModel {
  if (!_model) _model = buildLanguageModel();
  return _model;
}
