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
});
