// store/useEffectStore.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock analytics
vi.mock('@/services/analytics', () => ({
    analytics: {
        effect: {
            added: vi.fn(),
            removed: vi.fn(),
        }
    }
}));

// Mock performance
vi.stubGlobal('performance', { now: vi.fn(() => 1000) });

// Mock crypto
vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid'
});

// Mock language service
vi.mock('../services/languageService', () => ({
    getLanguageModel: () => ({
        generatePipeline: () => [{ id: 'ai-1', type: 'PATTERN_1', params: [] }]
    })
}));

// Import the store
import { useEffectStore } from './useEffectStore';

const store = () => useEffectStore.getState();

const resetStore = () => {
    useEffectStore.setState({
        effects: [],
        scenes: Array.from({ length: 9 }, () => ({
            effects: [],
            past: [],
            future: [],
            selectedIds: new Set<string>(),
        })),
        activeSceneIndex: 0,
        isEndlessMode: false,
        endlessScenes: [
            { effects: [], past: [], future: [], selectedIds: new Set<string>() },
            { effects: [], past: [], future: [], selectedIds: new Set<string>() }
        ],
        activeEndlessIndex: 0,
        transitionType: 'none',
        activeTransition: null,
    });
};

describe('useEffectStore - Endless Mode', () => {
    beforeEach(resetStore);

    it('initializes with endless mode disabled', () => {
        expect(store().isEndlessMode).toBe(false);
        expect(store().endlessScenes).toHaveLength(2);
    });

    it('switches to endless mode and parks sandbox state', () => {
        // 1. Set up sandbox state
        const testEffects = [{ id: '1', type: 'GRAIN', params: [] }] as any;
        useEffectStore.setState({
            effects: testEffects,
            activeSceneIndex: 0
        });

        // 2. Enter endless mode
        store().setEndlessMode(true);

        // 3. Verify sandbox state is parked in scenes[0]
        expect(store().scenes[0].effects).toEqual(testEffects);
        expect(store().isEndlessMode).toBe(true);
        expect(store().effects).toEqual([]); // Initial endless slot is empty
        expect(store().activeEndlessIndex).toBe(0);
    });

    it('returns to sandbox mode and restores sandbox state', () => {
        const sandboxEffects = [{ id: 'sb', type: 'GRAIN', params: [] }] as any;
        const endlessEffects = [{ id: 'end', type: 'SHAPE', params: [] }] as any;

        // Setup: be in endless mode with some effects
        useEffectStore.setState({
            isEndlessMode: true,
            activeEndlessIndex: 0,
            activeSceneIndex: 0,
            scenes: [
                { effects: sandboxEffects, past: [], future: [], selectedIds: new Set<string>() },
                ...Array.from({ length: 8 }, () => ({
                    effects: [],
                    past: [],
                    future: [],
                    selectedIds: new Set<string>()
                }))
            ],
            effects: endlessEffects,
            endlessScenes: [
                { effects: endlessEffects, past: [], future: [], selectedIds: new Set<string>() },
                { effects: [], past: [], future: [], selectedIds: new Set<string>() }
            ]
        });

        // Exit endless mode
        store().setEndlessMode(false);

        expect(store().isEndlessMode).toBe(false);
        expect(store().effects).toEqual(sandboxEffects);
        expect(store().activeSceneIndex).toBe(0);
    });

    it('prevents switching to invalid indices', () => {
        const initialEffects = [{ id: '1', type: 'GRAIN' }] as any;
        useEffectStore.setState({ effects: initialEffects, activeSceneIndex: 0 });

        // Try to switch to invalid index
        store().switchScene(99, 'sandbox');

        expect(store().activeSceneIndex).toBe(0);
        expect(store().effects).toEqual(initialEffects);

        // Try to switch to invalid endless index
        store().switchScene(5, 'endless');
        expect(store().activeEndlessIndex).toBe(0);
    });

    it('maintains isolation between sandbox and endless banks', () => {
        // 1. Set up Sandbox
        const sbEffects = [{ id: 'sb', type: 'GRAIN' }] as any;
        useEffectStore.setState({ effects: sbEffects, activeSceneIndex: 0 });

        // 2. Enter Endless
        store().setEndlessMode(true);
        const endlessEffects = [{ id: 'end', type: 'SHAPE' }] as any;
        useEffectStore.setState({ effects: endlessEffects });

        // 3. Switch within Endless (ping-pong)
        store().prepareNextEndlessScene();
        store().triggerEndlessStep();

        // 4. Exit to Sandbox
        store().setEndlessMode(false);

        // Sandbox should be untouched
        expect(store().effects).toEqual(sbEffects);
        expect(store().activeSceneIndex).toBe(0);

        // Endless should still have its state parked
        expect(store().endlessScenes[1].effects.length).toBeGreaterThan(0);
    });
});

describe('useEffectStore - Scene Transitions', () => {
    beforeEach(resetStore);

    it('sets activeTransition when manually switching scenes with transition enabled', () => {
        const now = 5000;
        vi.mocked(performance.now).mockReturnValue(now);

        useEffectStore.setState({
            isEndlessMode: false,
            transitionType: 'crossfade',
            activeSceneIndex: 0
        });

        store().switchScene(1, 'sandbox');

        expect(store().activeTransition).toEqual({
            startTime: now,
            fromIndex: 0
        });
        expect(store().activeSceneIndex).toBe(1);
    });

    it('manages two-phase Endless transitions (Prepare then Trigger)', () => {
        const now = 10000;
        vi.mocked(performance.now).mockReturnValue(now);

        useEffectStore.setState({
            isEndlessMode: true,
            activeEndlessIndex: 0,
            endlessScenes: [
                { effects: [], past: [], future: [], selectedIds: new Set<string>() },
                { effects: [], past: [], future: [], selectedIds: new Set<string>() }
            ],
            transitionType: 'crossfade'
        });

        // 1. Prepare: Generates effects in the background slot (1) but DOES NOT switch
        store().prepareNextEndlessScene();
        expect(store().activeEndlessIndex).toBe(0); // Still on slot 0
        expect(store().endlessScenes[1].effects.length).toBeGreaterThan(0); // Slot 1 is ready
        expect(store().activeTransition).toBeNull(); // No transition yet

        // 2. Trigger: Performs the actual switch using the pre-prepared slot
        store().triggerEndlessStep();
        expect(store().activeEndlessIndex).toBe(1);
        expect(store().effects).toEqual(store().endlessScenes[1].effects);

        // 3. Metadata and History check
        expect(store().activeTransition).toEqual({
            startTime: now,
            fromIndex: 0
        });
        expect(store().past).toEqual([]);
        expect(store().future).toEqual([]);
    });

    it('reliably handles multiple consecutive automatic transitions (AI Stress Test)', () => {
        useEffectStore.setState({
            isEndlessMode: true,
            activeEndlessIndex: 0,
            transitionType: 'crossfade'
        });

        for (let i = 0; i < 5; i++) {
            const currentIndex = store().activeEndlessIndex;
            const nextIndex = (currentIndex + 1) % 2;

            store().prepareNextEndlessScene();
            store().triggerEndlessStep();

            expect(store().activeEndlessIndex).toBe(nextIndex);
            expect(store().activeTransition?.fromIndex).toBe(currentIndex);
        }
    });

    it('gracefully handles bank switching while an automatic transition is active', () => {
        useEffectStore.setState({
            isEndlessMode: true,
            activeEndlessIndex: 0,
            transitionType: 'crossfade'
        });

        store().prepareNextEndlessScene();
        store().triggerEndlessStep(); // index moves to 1

        store().setEndlessMode(false);

        expect(store().isEndlessMode).toBe(false);
        expect(store().activeTransition?.fromIndex).toBe(1);
    });
});

