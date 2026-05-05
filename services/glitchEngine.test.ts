import { describe, it, expect, vi } from 'vitest';

// 1. Mock the Engine's heavy dependencies using Class-based mocks
vi.mock('./EffectPipeline', () => ({
  EffectPipeline: class {
    resize = vi.fn();
    setInputTexture = vi.fn();
    resetStack = vi.fn();
    applyPass = vi.fn();
    applyIterativeBlur = vi.fn();
    applyGlow = vi.fn();
    applyTransition = vi.fn();
    renderToScreen = vi.fn();
    enterSubStack = vi.fn();
    mergeSubStack = vi.fn();
    dispose = vi.fn();
  }
}));

vi.mock('./ShaderManager', () => ({
  ShaderManager: class {
    createProgram = vi.fn();
    useProgram = vi.fn();
    getProgram = vi.fn(() => ({}));
    getUniformLocation = vi.fn(() => ({}));
  },
  BASE_VERTEX_SHADER: '',
  PASS_THROUGH_FRAGMENT_SHADER: '',
}));

vi.mock('./TextureManager', () => ({
  TextureManager: class {
    createTexture = vi.fn(() => ({}));
    destroyTexture = vi.fn();
    createFramebuffer = vi.fn(() => ({}));
    destroyFramebuffer = vi.fn();
    createTextureFromImage = vi.fn(() => ({}));
  }
}));

// 2. Setup global mocks for the bare minimum DOM needed
const mockGL = new Proxy({
  canvas: { width: 100, height: 100 },
}, {
  get: (target, prop) => {
    if (prop in target) return (target as any)[prop];
    return vi.fn(() => ({}));
  }
});

vi.stubGlobal('document', {
  createElement: vi.fn(() => ({
    getContext: vi.fn(() => mockGL),
    width: 100,
    height: 100,
    style: {}
  })),
});

describe('GlitchEngine: Teleportation Bug Test', () => {
  it('should calculate different phases for different speeds over the same time period', async () => {
    // 3. Dynamic import
    const { GlitchEngine } = await import('./glitchEngine');
    const engine = new GlitchEngine();

    const effectId = 'test-speed-ignored';
    const effectSpeed1 = {
      id: effectId,
      type: 'SPECTRAL_MAP',
      params: [
        { param: 'Rainbow Density', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Color Shift', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Speed', value: 1.0, frequencyBand: 'OFF' }, // 1x Speed
      ],
      muted: false,
    } as any;

    const effectSpeed2 = {
      ...effectSpeed1,
      id: 'test-speed-ignored-2', // Unique ID so the engine treats this as a fresh start
      params: [
        ...effectSpeed1.params.slice(0, 2),
        { param: 'Speed', value: 2.0, frequencyBand: 'OFF' }, // 2x Speed
      ]
    };

    const dummyTarget = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn(), fillRect: vi.fn() })
    };

    const renderOptions = { currentTime: 10 };

    // SCENARIO 1: Run at 1.0x Speed for 10 seconds
    await engine.renderToCanvas(dummyTarget as any, [effectSpeed1], renderOptions);
    const phaseAtSpeed1 = (engine as any).uIntegratedBuffer[2];

    // Reset engine state between scenarios to be safe
    (engine as any).uIntegratedBuffer.fill(0);

    // SCENARIO 2: Run at 2.0x Speed for 10 seconds
    await engine.renderToCanvas(dummyTarget as any, [effectSpeed2], renderOptions);
    const phaseAtSpeed2 = (engine as any).uIntegratedBuffer[2];

    console.log(`\n[MANUAL SPEED TEST]`);
    console.log(`After 10s at 1.0x Speed -> Phase: ${phaseAtSpeed1}`);
    console.log(`After 10s at 2.0x Speed -> Phase: ${phaseAtSpeed2}`);

    // If the speed slider works, 2x speed should result in double the phase.
    expect(phaseAtSpeed1).toBe(10.0);
    expect(phaseAtSpeed2).toBe(20.0);
  });

  it('should NOT jump phase when dragging the slider in reactive mode (teleportation test)', async () => {
    const { GlitchEngine } = await import('./glitchEngine');
    const engine = new GlitchEngine();

    const effectId = 'test-reactive-teleport-sequential';
    const effect = {
      id: effectId,
      type: 'SPECTRAL_MAP',
      params: [
        { param: 'Rainbow Density', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Color Shift', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Speed', value: 1.0, min: 0.0, frequencyBand: 'BASS' },
      ],
      muted: false,
    } as any;

    const dummyTarget = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn(), fillRect: vi.fn() })
    };

    // FRAME 1: t=9s, bass=90 accumulated
    await engine.renderToCanvas(dummyTarget as any, [effect], {
      currentTime: 9,
      integratedReactivity: { sub: 0, bass: 90, mid: 0, treble: 0 }
    });
    const phaseFrame1 = (engine as any).uIntegratedBuffer[2]; // = 1.0 * 90 = 90

    // FRAME 2: t=10s, bass=100 accumulated. Normal one-frame progression.
    await engine.renderToCanvas(dummyTarget as any, [effect], {
      currentTime: 10,
      integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    const phaseFrame2 = (engine as any).uIntegratedBuffer[2]; // = 1.0 * 100 = 100
    const normalDelta = phaseFrame2 - phaseFrame1; // = 10 (one frame's worth)

    // USER DRAGS SLIDER to Speed = 2.0 at this exact moment.
    const effectDragged = {
      ...effect,
      params: [
        ...effect.params.slice(0, 2),
        { ...effect.params[2], value: 2.0 }
      ]
    };

    // FRAME 3: Same t=10s, same bass=100, but slider is now at 2.0.
    // In a BROKEN engine: phase = 2.0 * 100 = 200. Jump = 200 - 100 = 100 (teleport!)
    // In a FIXED engine:  phase = 100 (offset absorbs the change). Jump = 0.
    await engine.renderToCanvas(dummyTarget as any, [effectDragged], {
      currentTime: 10,
      integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    const phaseFrame3 = (engine as any).uIntegratedBuffer[2];
    const teleportDelta = phaseFrame3 - phaseFrame2;

    console.log(`\n[REACTIVE TELEPORT TEST - SEQUENTIAL]`);
    console.log(`Frame 1 (t=9, bass=90,  speed=1.0) -> Phase: ${phaseFrame1}`);
    console.log(`Frame 2 (t=10, bass=100, speed=1.0) -> Phase: ${phaseFrame2} | Normal delta: ${normalDelta}`);
    console.log(`Frame 3 (t=10, bass=100, speed=2.0) -> Phase: ${phaseFrame3} | Jump delta: ${teleportDelta}`);

    // The jump at the moment of a slider change should be zero.
    // The current engine teleports: jump = 100 (FAILS).
    expect(teleportDelta).toBe(0);
  });

  it('should preserve visual phase across engine instances (getState/seedState roundtrip)', async () => {
    const { GlitchEngine } = await import('./glitchEngine');
    const engineA = new GlitchEngine();
    const engineB = new GlitchEngine();

    const effectId = 'persistence-test';
    const effectSpeed1 = {
      id: effectId,
      type: 'SPECTRAL_MAP',
      params: [
        { param: 'Rainbow Density', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Color Shift', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Speed', value: 1.0, min: 0.0, frequencyBand: 'BASS' },
      ],
    } as any;

    const effectSpeed2 = {
      ...effectSpeed1,
      params: [
        ...effectSpeed1.params.slice(0, 2),
        { ...effectSpeed1.params[2], value: 2.0 }
      ]
    };

    const dummyTarget = {
      width: 0, height: 0,
      getContext: () => ({ drawImage: vi.fn(), fillRect: vi.fn() })
    };

    // 1. ENGINE A: Simulate a drag to create an offset
    // Frame 1: Speed 1.0 at t=10
    await engineA.renderToCanvas(dummyTarget as any, [effectSpeed1], {
      currentTime: 10, integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    const phaseA1 = (engineA as any).uIntegratedBuffer[2]; // 1.0 * 100 = 100

    // Frame 2: Move slider to 2.0 at same t=10
    await engineA.renderToCanvas(dummyTarget as any, [effectSpeed2], {
      currentTime: 10, integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    const phaseA2 = (engineA as any).uIntegratedBuffer[2]; 
    
    // VERIFY: phaseA2 should be 100 (pinned), NOT 200.
    expect(phaseA2).toBe(100);

    // 2. EXPORT: Copy state from Engine A to Engine B
    const state = engineA.getState();
    engineB.seedState(state);

    // 3. ENGINE B: Render at t=10 with Speed 2.0
    await engineB.renderToCanvas(dummyTarget as any, [effectSpeed2], {
      currentTime: 10, integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    const phaseB = (engineB as any).uIntegratedBuffer[2];

    console.log(`\n[STATE PERSISTENCE TEST]`);
    console.log(`Engine A (Pinned Phase at t=10): ${phaseA2}`);
    console.log(`Engine B (Seeded Phase at t=10): ${phaseB}`);

    // Assertion: Engine B should show the EXACT same phase as Engine A
    // If seeding works, phaseB should be 100.
    // If seeding fails, phaseB would be 200 (raw speed * time).
    expect(phaseB).toBe(phaseA2);
  });

  it('should maintain WYSIWYG even after sanitizing imported effects (E2E Persistence)', async () => {
    const { GlitchEngine } = await import('./glitchEngine');
    const { sanitizeImportedEffects } = await import('./sanitizeImportedEffects');
    const engineA = new GlitchEngine();
    const engineB = new GlitchEngine();

    const effectId = 'e2e-persistence-id';
    const effect = {
      id: effectId,
      type: 'SPECTRAL_MAP',
      params: [
        { param: 'Rainbow Density', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Color Shift', value: 0.0, frequencyBand: 'OFF' },
        { param: 'Speed', value: 1.0, min: 0.0, frequencyBand: 'BASS' },
      ],
    } as any;

    const dummyTarget = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn(), fillRect: vi.fn() }) };

    // 1. ENGINE A: Create an offset
    await engineA.renderToCanvas(dummyTarget as any, [effect], {
      currentTime: 10, integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    // Change speed to 2.0 at same t=10
    const effectChanged = { ...effect, params: [...effect.params.slice(0, 2), { ...effect.params[2], value: 2.0 }] };
    await engineA.renderToCanvas(dummyTarget as any, [effectChanged], {
      currentTime: 10, integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    const phaseA = (engineA as any).uIntegratedBuffer[2]; // Should be 100 (pinned)

    // 2. SIMULATE EXPORT -> IMPORT
    const exportedState = engineA.getState();
    const exportedEffects = [effectChanged];

    // SANITIZE (this is where the ID used to break)
    const importedEffects = sanitizeImportedEffects(exportedEffects);
    engineB.seedState(exportedState);

    // 3. ENGINE B: Render with sanitized effects
    await engineB.renderToCanvas(dummyTarget as any, importedEffects, {
      currentTime: 10, integratedReactivity: { sub: 0, bass: 100, mid: 0, treble: 0 }
    });
    const phaseB = (engineB as any).uIntegratedBuffer[2];

    console.log(`\n[E2E PERSISTENCE TEST]`);
    console.log(`Engine A (Original): ${phaseA}`);
    console.log(`Engine B (Imported): ${phaseB}`);

    expect(phaseB).toBe(phaseA);
    expect(importedEffects[0].id).toBe(effectId); // Verify ID preservation
  });
});
