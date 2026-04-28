import { create } from 'zustand';
import { EffectConfig, GlitchEffectType, MacroType, TransitionType } from '../types';
import { INITIAL_REACTIVE_EFFECTS, createEffectInstance, createMacroInstance, INITIAL_SCENE_COUNT, DEFAULT_TRANSITION_DURATION } from '../constants';
import { analytics } from '@/services/analytics';
import { PUZZLES } from '../config/puzzles';
import { PuzzleService, PuzzleMatchResult } from '../services/puzzleService';

interface SceneSlot {
    effects: EffectConfig[];
    past: EffectConfig[][];
    future: EffectConfig[][];
    selectedIds: Set<string>;
}

const emptySlot = (): SceneSlot => ({
    effects: [],
    past: [],
    future: [],
    selectedIds: new Set<string>(),
});

const initialSlots = (): SceneSlot[] => {
    return Array.from({ length: INITIAL_SCENE_COUNT }, emptySlot);
};

interface EffectState {
    effects: EffectConfig[];
    selectedIds: Set<string>;

    // History
    past: EffectConfig[][];
    future: EffectConfig[][];

    // Scene Hotbar
    scenes: SceneSlot[];
    activeSceneIndex: number;
    isSceneHotbarOpen: boolean;
    setIsSceneHotbarOpen: (open: boolean) => void;
    switchScene: (index: number) => void;

    // Actions
    setEffects: (effects: EffectConfig[]) => void;

    // Selection
    toggleSelected: (id: string, multi?: boolean) => void;
    selectRange: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;

    isInSelectMode: boolean;
    setIsInSelectMode: (active: boolean) => void;

    focusStack: ('pipeline' | 'inspector' | 'library')[];
    pushFocus: (zone: 'pipeline' | 'inspector' | 'library') => void;
    removeFocus: (zone: 'pipeline' | 'inspector' | 'library') => void;

    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;

    isPuzzlesModalOpen: boolean;
    setIsPuzzlesModalOpen: (open: boolean) => void;

    currentPuzzle: number | null;
    setCurrentPuzzle: (puzzle: number | null) => void;

    isGameMode: boolean;
    isPreviewingPuzzle: boolean;
    toggleIsPreviewingPuzzle: () => void;
    targetPuzzleEffects: EffectConfig[];
    puzzleMatchResult: PuzzleMatchResult | null;
    checkPuzzle: () => void;
    setPuzzleMatchResult: (result: PuzzleMatchResult | null) => void;

    activeDropdownId: string | null;
    setActiveDropdownId: (id: string | null) => void;

    isUiHidden: boolean;
    setIsUiHidden: (hidden: boolean) => void;

    isMobile: boolean;
    setIsMobile: (isMobile: boolean) => void;

    undo: () => void;
    redo: () => void;
    commitHistory: () => void;

    toggleMute: (id: string) => void;
    toggleSolo: (id: string) => void;
    addEffect: (type: GlitchEffectType) => void;
    addMacro: (macroType: MacroType) => void;
    removeEffect: (id: string) => void;
    batchDuplicate: () => void;
    batchRemove: () => void;
    batchMeld: () => void;
    batchUnmeld: () => void;
    updateParameter: (effectId: string, paramIndex: number, update: Partial<EffectConfig['params'][0]>) => void;
    updateMultipleParameters: (effectId: string, updates: { paramIndex: number, update: Partial<EffectConfig['params'][0]> }[]) => void;

    addEffectFromSidebar: (type: GlitchEffectType) => void;
    setEffectAssetUrl: (effectId: string, assetUrl: string | undefined, assetName?: string) => void;
    addScene: () => void;

    // Transitions
    transitionType: TransitionType;
    setTransitionType: (type: TransitionType) => void;
    transitionDuration: number;
    setTransitionDuration: (duration: number) => void;
    activeTransition: { startTime: number, fromIndex: number } | null;
    setActiveTransition: (transition: { startTime: number, fromIndex: number } | null) => void;
}

export const useEffectStore = create<EffectState>((set, get) => ({
    isInSelectMode: false,
    effects: INITIAL_REACTIVE_EFFECTS,
    selectedIds: new Set<string>(),
    past: [],
    future: [],

    // Scene Hotbar
    scenes: initialSlots(),
    activeSceneIndex: 0,
    isSceneHotbarOpen: false,
    setIsSceneHotbarOpen: (isSceneHotbarOpen) => set({ isSceneHotbarOpen }),

    addScene: () => {
        set((state) => ({
            scenes: [...state.scenes, emptySlot()]
        }));
    },

    switchScene: (index: number) => {
        const { activeSceneIndex, scenes, effects, past, future, transitionType, transitionDuration } = get();
        if (index === activeSceneIndex) return;
        if (index < 0 || index >= scenes.length) return;

        // If a transition is enabled, record the start time and the scene we are leaving
        if (transitionType !== 'none') {
            set({
                activeTransition: {
                    startTime: performance.now(),
                    fromIndex: activeSceneIndex
                }
            });
        }

        // Park the current live state back into its slot
        const updatedScenes = [...scenes];
        updatedScenes[activeSceneIndex] = {
            effects: JSON.parse(JSON.stringify(effects)),
            past: JSON.parse(JSON.stringify(past)),
            future: JSON.parse(JSON.stringify(future)),
            selectedIds: new Set<string>(), // Clear selection on park
        };

        // Load the target slot
        const target = updatedScenes[index];
        set({
            scenes: updatedScenes,
            activeSceneIndex: index,
            effects: JSON.parse(JSON.stringify(target.effects)),
            past: JSON.parse(JSON.stringify(target.past)),
            future: JSON.parse(JSON.stringify(target.future)),
            selectedIds: new Set<string>(), // Always clear selection on switch
        });
    },

    focusStack: ['pipeline'],
    pushFocus: (zone) => set(s => ({
        focusStack: [...s.focusStack.filter(z => z !== zone), zone] as ('pipeline' | 'inspector' | 'library')[]
    })),
    removeFocus: (zone) => set(s => {
        const filtered = s.focusStack.filter(z => z !== zone);
        return {
            focusStack: (filtered.length > 0 ? filtered : ['pipeline']) as ('pipeline' | 'inspector' | 'library')[]
        };
    }),
    isSidebarOpen: false,
    setIsSidebarOpen: (open) => set(s => ({
        isSidebarOpen: open,
        focusStack: open ? [...s.focusStack.filter(z => z !== 'pipeline'), 'pipeline'] as ('pipeline' | 'inspector' | 'library')[] : s.focusStack
    })),

    isPuzzlesModalOpen: false,
    setIsPuzzlesModalOpen: (isPuzzlesModalOpen) => set({ isPuzzlesModalOpen }),

    isGameMode: false,
    isPreviewingPuzzle: false,
    toggleIsPreviewingPuzzle: () => set(state => ({
        isPreviewingPuzzle: !state.isPreviewingPuzzle
    })),
    targetPuzzleEffects: [],
    puzzleMatchResult: null,

    checkPuzzle: () => {
        const { effects, targetPuzzleEffects } = get();
        const result = PuzzleService.evaluate(effects, targetPuzzleEffects);
        set({ puzzleMatchResult: result });
    },

    setPuzzleMatchResult: (puzzleMatchResult) => set({ puzzleMatchResult }),

    currentPuzzle: null,
    setCurrentPuzzle: (currentPuzzle) => {
        // If exiting game mode
        if (currentPuzzle === null) {
            set({
                currentPuzzle: null,
                isGameMode: false,
                targetPuzzleEffects: [],
                isPreviewingPuzzle: false
            });
            return;
        }

        const puzzle = PUZZLES[currentPuzzle];
        const targetPuzzleEffects = puzzle ? createMacroInstance(puzzle.macro) : [];

        set({
            currentPuzzle,
            isGameMode: true,
            targetPuzzleEffects,
            isPreviewingPuzzle: true
        });
    },

    activeDropdownId: null,
    setActiveDropdownId: (activeDropdownId) => set({ activeDropdownId }),

    isUiHidden: false,
    setIsUiHidden: (isUiHidden) => set({ isUiHidden }),

    isMobile: false,
    setIsMobile: (isMobile) => set({ isMobile }),

    setEffects: (effects) => {
        get().commitHistory();
        set({ effects })
    },

    setIsInSelectMode: (isInSelectMode) => set({ isInSelectMode: isInSelectMode }),

    toggleSelected: (id, multi) => {
        const { selectedIds } = get();
        const next = new Set(multi ? selectedIds : []);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        set({ selectedIds: next });
    },

    selectRange: (id) => {
        const { effects, selectedIds } = get();
        const ids = effects.map(e => e.id);
        const lastSelected = [...selectedIds].pop();
        if (!lastSelected) {
            set({ selectedIds: new Set([id]) });
            return;
        }
        const from = ids.indexOf(lastSelected);
        const to = ids.indexOf(id);
        if (from === -1 || to === -1) return;
        const lo = Math.min(from, to);
        const hi = Math.max(from, to);
        const next = new Set(selectedIds);
        for (let i = lo; i <= hi; i++) next.add(ids[i]);
        set({ selectedIds: next });
    },

    selectAll: () => {
        const { effects } = get();
        set({ selectedIds: new Set(effects.map(e => e.id)) });
    },

    clearSelection: () => set({ selectedIds: new Set<string>(), activeDropdownId: null }),

    // Push current effects onto the past stack. Call this BEFORE making changes.
    commitHistory: () => {
        const { effects, past } = get();
        const last = past[past.length - 1];
        // Skip if nothing has changed since the last commit
        if (last && JSON.stringify(last) === JSON.stringify(effects)) return;
        set({
            past: [...past.slice(-100), JSON.parse(JSON.stringify(effects))], // limit undo history to the last 100 snapshots
            future: [],
        });
    },

    undo: () => {
        const { past, effects, future, selectedIds } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({
            effects: previous,
            selectedIds: new Set(previous.filter(e => selectedIds.has(e.id)).map(e => e.id)),
            past: past.slice(0, -1),
            future: [JSON.parse(JSON.stringify(effects)), ...future],
        });
    },

    redo: () => {
        const { past, effects, future, selectedIds } = get();
        if (future.length === 0) return;
        const [next, ...rest] = future;
        set({
            effects: next,
            selectedIds: new Set(next.filter(e => selectedIds.has(e.id)).map(e => e.id)),
            past: [...past, JSON.parse(JSON.stringify(effects))],
            future: rest,
        });
    },

    toggleMute: (id) => {
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            const idx = next.findIndex(e => e.id === id);
            if (idx === -1) return {};
            next[idx] = { ...next[idx], muted: !next[idx].muted, soloed: false };
            return { effects: next };
        });
    },

    toggleSolo: (id) => {
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            const idx = next.findIndex(e => e.id === id);
            if (idx === -1) return {};
            next[idx] = { ...next[idx], soloed: !next[idx].soloed, muted: false };
            return { effects: next };
        });
    },

    addEffect: (type) => {
        get().commitHistory();
        analytics.effect.added(type);
        const newEffect = createEffectInstance(type);
        const { isMobile } = get();
        set((state) => ({
            effects: [...state.effects, newEffect],
            isSidebarOpen: isMobile ? state.isSidebarOpen : true,
        }));
        if (!isMobile) get().pushFocus('pipeline');
    },

    addEffectFromSidebar: (type) => {
        get().commitHistory();
        analytics.effect.added(type);
        const newEffect = createEffectInstance(type);
        set((state) => ({
            effects: [...state.effects, newEffect],
            selectedIds: new Set([newEffect.id]),
        }));
    },

    addMacro: (macroType) => {
        const newEffects = createMacroInstance(macroType);
        if (newEffects.length === 0) return;

        get().commitHistory();
        analytics.effect.added(`MACRO_${macroType}` as any);
        const { isMobile } = get();
        set((state) => ({
            effects: newEffects,
            isSidebarOpen: isMobile ? state.isSidebarOpen : true,
        }));
        if (!isMobile) get().pushFocus('pipeline');
    },

    removeEffect: (id) => {
        get().commitHistory();
        set((state) => {
            const effectToRemove = state.effects.find(e => e.id === id);
            if (effectToRemove) analytics.effect.removed(effectToRemove.type);

            const next = state.effects.reduce((acc: EffectConfig[], current, index) => {
                // If this effect is the one being removed, skip it
                if (current.id === id) return acc;

                const nextEffect = state.effects[index + 1];
                const nextIsBeingDeleted = nextEffect && nextEffect.id === id;

                if (current.melded && nextIsBeingDeleted) {
                    acc.push({ ...current, melded: false });
                } else {
                    acc.push(current);
                }

                return acc;
            }, []);

            return {
                effects: next,
                selectedIds: new Set<string>()
            };
        });
    },

    batchDuplicate: () => {
        const { selectedIds } = get();
        if (selectedIds.size === 0) return;
        get().commitHistory();
        set((state) => {
            // Collect selected effects in their pipeline order
            const selected = state.effects.filter(e => selectedIds.has(e.id));

            // Clone each effect
            const clones: EffectConfig[] = selected.map(src => ({
                ...JSON.parse(JSON.stringify(src)),
                id: crypto.randomUUID()
            }));

            // Break meld link of the last clone
            if (clones.length > 0) {
                clones[clones.length - 1].melded = false;
            }

            const newSelectedIds = new Set(clones.map(c => c.id));
            return {
                effects: [...state.effects, ...clones],
                selectedIds: newSelectedIds,
            };
        });
    },

    batchRemove: () => {
        const { selectedIds } = get();
        if (selectedIds.size === 0) return;
        get().commitHistory();
        set((state) => {
            selectedIds.forEach(id => {
                const e = state.effects.find(e => e.id === id);
                if (e) analytics.effect.removed(e.type);
            });

            // Map and filter in one go: pass along effects we keep, but break meld links
            // if the immediately following effect is being deleted.
            const next = state.effects.reduce((acc: typeof state.effects, current, index) => {
                // If this effect is selected for deletion, skip it
                if (selectedIds.has(current.id)) return acc;

                const nextEffect = state.effects[index + 1];
                const nextIsBeingDeleted = nextEffect && selectedIds.has(nextEffect.id);

                if (current.melded && nextIsBeingDeleted) {
                    acc.push({ ...current, melded: false });
                } else {
                    acc.push(current);
                }

                return acc;
            }, []);

            return { effects: next, selectedIds: new Set<string>() };
        });
    },

    batchMeld: () => {
        const { effects, selectedIds } = get();
        if (selectedIds.size < 2) return;
        // Collect the indices of all selected effects in order
        const indices = effects
            .map((e, i) => selectedIds.has(e.id) ? i : -1)
            .filter(i => i !== -1);
        // They must be contiguous
        const isContiguous = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
        if (!isContiguous) return;
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            // Meld all selected except the last one
            for (let i = 0; i < indices.length - 1; i++) {
                next[indices[i]] = { ...next[indices[i]], melded: true };
            }
            return { effects: next, selectedIds: new Set(indices.map(i => next[i].id)) };
        });
    },

    batchUnmeld: () => {
        const { effects, selectedIds } = get();
        if (selectedIds.size < 2) return;
        // Collect the indices of all selected effects in order
        const indices = effects
            .map((e, i) => selectedIds.has(e.id) ? i : -1)
            .filter(i => i !== -1);
        // They must be contiguous
        const isContiguous = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
        if (!isContiguous) return;
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            // Unmeld all selected effects
            for (let i = 0; i < indices.length; i++) {
                next[indices[i]] = { ...next[indices[i]], melded: false };
            }

            // Unmeld previous effect if melded
            const firstIdx = indices[0];
            if (firstIdx - 1 >= 0 && next[firstIdx - 1].melded) {
                next[firstIdx - 1] = { ...next[firstIdx - 1], melded: false };
            }

            return { effects: next, selectedIds: new Set(indices.map(i => next[i].id)) };
        });
    },

    // Simple, dumb setter. Callers are responsible for calling commitHistory()
    // before a batch of changes begins (e.g. on slider pointerdown).
    updateParameter: (effectId, paramIndex, update) => {
        set((state) => ({
            effects: state.effects.map((e) => {
                if (e.id !== effectId) return e;
                const newParams = [...e.params];
                newParams[paramIndex] = { ...newParams[paramIndex], ...update };
                return { ...e, params: newParams };
            }),
        }));
    },

    updateMultipleParameters: (effectId, updates) => {
        set((state) => ({
            effects: state.effects.map((e) => {
                if (e.id !== effectId) return e;
                const newParams = [...e.params];
                updates.forEach(({ paramIndex, update }) => {
                    newParams[paramIndex] = { ...newParams[paramIndex], ...update };
                });
                return { ...e, params: newParams };
            }),
        }));
    },

    setEffectAssetUrl: (effectId, assetUrl, assetName) => {
        set((state) => ({
            effects: state.effects.map(e => e.id === effectId ? { ...e, assetUrl, assetName } : e)
        }));
    },

    // Transitions
    transitionType: 'none',
    setTransitionType: (transitionType) => set({ transitionType }),
    transitionDuration: DEFAULT_TRANSITION_DURATION,
    setTransitionDuration: (transitionDuration) => set({ transitionDuration }),
    activeTransition: null,
    setActiveTransition: (activeTransition) => set({ activeTransition }),
}));
