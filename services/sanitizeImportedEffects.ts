import { EffectConfig, FrequencyBand, GlitchEffectType } from '../types';
import { EFFECT_METADATA } from '../constants';

const VALID_BANDS: FrequencyBand[] = ['OFF', 'SUB', 'BASS', 'MID', 'TREBLE'];

export const sanitizeImportedEffects = (rawItems: any[]): EffectConfig[] => {
    if (!Array.isArray(rawItems)) return [];

    const sanitized: EffectConfig[] = [];

    for (const item of rawItems) {
        // 1. Validate basic structure
        if (!item || typeof item !== 'object') continue;
        if (!item.type || typeof item.type !== 'string') continue;

        // 2. Validate against known effects
        const metadata = EFFECT_METADATA[item.type as GlitchEffectType];
        if (!metadata) {
            console.warn(`Skipping unknown effect type: ${item.type}`);
            continue;
        }

        // 3. Create a lookup for imported params
        const importedParamsLookup = new Map<string, any>();
        if (Array.isArray(item.params)) {
            for (const p of item.params) {
                if (p && typeof p.param === 'string') {
                    importedParamsLookup.set(p.param, p);
                }
            }
        }

        // 4. Reconstruct params using current metadata as the source of truth
        const sanitizedParams = metadata.params.map((metaParam) => {
            const importedParam = importedParamsLookup.get(metaParam.name);

            // Helper to safely parse and clamp numbers between 0 and 100
            const safeNum = (val: any, fallback: number) => {
                if (typeof val === 'number' && !isNaN(val)) {
                    return Math.max(0, Math.min(100, val));
                }
                return fallback;
            };

            // Helper to validate frequency band
            const safeBand = (val: any, fallback: FrequencyBand): FrequencyBand => {
                if (typeof val === 'string' && VALID_BANDS.includes(val as FrequencyBand)) {
                    return val as FrequencyBand;
                }
                return fallback;
            };

            return {
                param: metaParam.name,
                value: safeNum(importedParam?.value, metaParam.defaultValue),
                min: safeNum(importedParam?.min, metaParam.defaultMin ?? 0),
                frequencyBand: safeBand(importedParam?.frequencyBand, metaParam.defaultBand ?? 'OFF'),
            };
        });

        // 5. Assemble the final safe object
        sanitized.push({
            id: crypto.randomUUID(),
            type: item.type as GlitchEffectType,
            params: sanitizedParams,
            muted: typeof item.muted === 'boolean' ? item.muted : false,
            soloed: typeof item.soloed === 'boolean' ? item.soloed : false,
            melded: typeof item.melded === 'boolean' ? item.melded : false,
            seed: typeof item.seed === 'number' && !isNaN(item.seed) ? item.seed : Math.floor(Math.random() * 10000)
        });
    }

    // Last effect should never be melded
    if (sanitized.length > 0) {
        sanitized[sanitized.length - 1].melded = false;
    }

    return sanitized;
};

export const loadMuxelsFile = async (file: File): Promise<EffectConfig[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const json = JSON.parse(content);

                if (Array.isArray(json)) {
                    const sanitized = sanitizeImportedEffects(json);
                    if (sanitized.length > 0) {
                        resolve(sanitized);
                    } else {
                        reject(new Error("No valid effects found in this .muxels file."));
                    }
                } else {
                    reject(new Error("Invalid .muxels file format. Expected an array of effects."));
                }
            } catch (err) {
                console.error("Failed to read .muxels file:", err);
                reject(new Error("Failed to read .muxels file."));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read .muxels file."));
        reader.readAsText(file);
    });
};
