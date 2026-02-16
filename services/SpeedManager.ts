
/**
 * SpeedManager
 * 
 * Handles the deterministic pre-calculation of variable speed effects.
 * 
 * PROBLEM: "Rewriting History"
 * When speed varies based on audio reactivity (e.g., particles speed up on beat),
 * simple "time * speed" math breaks because it causes teleportation/jerkiness.
 * When you do "Position = Time * Speed", you assume speed has been constant for the 
 * entire duration of time. If speed jumps (e.g., on a drum hit), the formula effectively
 * rewrites the past, causing "teleportation" or extreme jitter. In shaders, where 'Time'
 * is often a large number, even tiny speed changes result in massive positional jumps.
 * 
 * SOLUTION: Numerical Integration
 * We treat the reactivity value as "Instantaneous Velocity" and calculate its 
 * Integral (cumulative sum) over time. Instead of looking at the past, we only
 * look at the present: "New Position = Old Position + (Current Speed * Delta Time)".
 * 
 * This creates a "Phase" or "Distance Traveled" value that is:
 * 1. Perfectly smooth (no teleportation when speed changes)
 * 2. Fully deterministic and scrubbable (tied to specific audio timestamps)
 * 3. Physically correct (variable acceleration)
 */

export interface IntegratedReactivityMap {
    bass: Float32Array;
    mid: Float32Array;
    treble: Float32Array;
    energy: Float32Array;
}

export const computeIntegratedReactivity = (
    reactivityMap: {
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
        energy: Float32Array;
    }
): IntegratedReactivityMap => {
    const length = reactivityMap.bass.length;

    // Create output arrays
    const integrated = {
        bass: new Float32Array(length),
        mid: new Float32Array(length),
        treble: new Float32Array(length),
        energy: new Float32Array(length)
    };

    // Running sums
    let sumBass = 0;
    let sumMid = 0;
    let sumTreble = 0;
    let sumEnergy = 0;

    // Compute integrals
    // We assume a standard scaling factor so values don't get astronomical too fast
    // 0.01 per frame provides a reasonable baseline "speed unit"
    const TIME_STEP = 0.01;

    for (let i = 0; i < length; i++) {
        sumBass += reactivityMap.bass[i] * TIME_STEP;
        sumMid += reactivityMap.mid[i] * TIME_STEP;
        sumTreble += reactivityMap.treble[i] * TIME_STEP;
        sumEnergy += reactivityMap.energy[i] * TIME_STEP;

        integrated.bass[i] = sumBass;
        integrated.mid[i] = sumMid;
        integrated.treble[i] = sumTreble;
        integrated.energy[i] = sumEnergy;
    }

    return integrated;
};
