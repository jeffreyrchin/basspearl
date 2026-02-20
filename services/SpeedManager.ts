
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
    sub: Float32Array;
    bass: Float32Array;
    mid: Float32Array;
    treble: Float32Array;
}

export const computeIntegratedReactivity = (
    reactivityMap: {
        sub: Float32Array;
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
    }
): IntegratedReactivityMap => {
    const length = reactivityMap.bass.length;

    // Create output arrays
    const integrated = {
        sub: new Float32Array(length),
        bass: new Float32Array(length),
        mid: new Float32Array(length),
        treble: new Float32Array(length)
    };

    // Running sums
    let sumSub = 0;
    let sumBass = 0;
    let sumMid = 0;
    let sumTreble = 0;

    // Compute integrals
    const TIME_STEP = 1 / 60;

    for (let i = 0; i < length; i++) {
        sumSub += reactivityMap.sub[i] * TIME_STEP;
        sumBass += reactivityMap.bass[i] * TIME_STEP;
        sumMid += reactivityMap.mid[i] * TIME_STEP;
        sumTreble += reactivityMap.treble[i] * TIME_STEP;

        integrated.sub[i] = sumSub;
        integrated.bass[i] = sumBass;
        integrated.mid[i] = sumMid;
        integrated.treble[i] = sumTreble;
    }

    return integrated;
};
