import { create } from 'zustand';
import { EffectConfig, GlitchEffectType, MacroType, TransitionType, PuzzleType } from '../types';
import { createEffectInstance, createMacroInstance, INITIAL_SCENE_COUNT, DEFAULT_TRANSITION_DURATION, DIFFICULTY_TRACKS } from '../constants';
import { analytics } from '@/services/analytics';
import { PUZZLES } from '../config/puzzles';
import { PuzzleService, PuzzleMatchResult } from '../services/puzzleService';
import { getLanguageModel } from '../services/languageService';
import { DEFAULT_TEMPERATURE } from '@/constants';

type SceneBank = 'sandbox' | 'endless';

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
    switchScene: (index: number, targetBank?: 'sandbox' | 'endless') => void;

    // Actions
    setEffects: (effects: EffectConfig[]) => void;

    clearEffects: () => void;

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

    isPuzzlesUnsupportedModalOpen: boolean;
    setIsPuzzlesUnsupportedModalOpen: (open: boolean) => void;

    isPuzzleHelpModalOpen: boolean;
    setIsPuzzleHelpModalOpen: (open: boolean) => void;

    puzzleAudio: { url: string, label: string } | null;
    setPuzzleAudio: (audio: { url: string, label: string } | null) => void;

    currentPuzzle: PuzzleType | null;
    setCurrentPuzzle: (puzzle: PuzzleType | null) => void;

    isGameMode: boolean;
    isPreviewingPuzzle: boolean;
    toggleIsPreviewingPuzzle: () => void;
    targetPuzzleEffects: EffectConfig[];
    puzzleMatchResult: PuzzleMatchResult | null;
    preGameEffects: EffectConfig[];
    preGamePast: EffectConfig[][];
    preGameFuture: EffectConfig[][];
    checkPuzzle: () => void;
    setPuzzleMatchResult: (result: PuzzleMatchResult | null) => void;

    activeDropdownId: string | null;
    setActiveDropdownId: (id: string | null) => void;

    isUiHidden: boolean;
    setIsUiHidden: (hidden: boolean) => void;

    isLandingOpen: boolean;
    setIsLandingOpen: (open: boolean) => void;

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
    updateEffect: (effectId: string, updates: Partial<EffectConfig>) => void;
    updateMultipleParameters: (effectId: string, updates: { paramIndex: number, update: Partial<EffectConfig['params'][0]> }[]) => void;

    addEffectFromSidebar: (type: GlitchEffectType) => void;
    toggleAspectLocked: (effectId: string) => void;
    addScene: () => void;

    // Transitions
    transitionType: TransitionType;
    setTransitionType: (type: TransitionType) => void;
    transitionDuration: number;
    setTransitionDuration: (duration: number) => void;
    activeTransition: { startTime: number, fromIndex: number } | null;
    setActiveTransition: (transition: { startTime: number, fromIndex: number } | null) => void;

    // Endless Mode
    isEndlessMode: boolean;
    endlessScenes: SceneSlot[];
    activeEndlessIndex: number;
    setEndlessMode: (active: boolean) => void;
    triggerEndlessStep: () => void;
    prepareNextEndlessScene: () => void;
    endlessInterval: number;
    setEndlessInterval: (interval: number) => void;
}

export const useEffectStore = create<EffectState>((set, get) => ({
    isInSelectMode: false,
    effects: [],
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

    // Endless Mode
    isEndlessMode: true,
    endlessScenes: [emptySlot(), emptySlot()],
    activeEndlessIndex: 0,
    endlessInterval: 5,
    setEndlessInterval: (endlessInterval) => set({ endlessInterval }),

    setEndlessMode: (active: boolean) => {
        const { isEndlessMode, activeSceneIndex, activeEndlessIndex, switchScene } = get();
        if (active === isEndlessMode) return;

        if (active) {
            // Entering Endless Mode: Switch from sandbox bank to endless bank
            // Also close UI panels
            set({ isSidebarOpen: false, isSceneHotbarOpen: false });
            switchScene(activeEndlessIndex, 'endless');
        } else {
            // Exiting Endless Mode: Switch from endless bank to sandbox bank
            switchScene(activeSceneIndex, 'sandbox');
        }
    },

    prepareNextEndlessScene: () => {
        const { activeEndlessIndex, endlessScenes } = get();
        const nextIndex = (activeEndlessIndex + 1) % 2;

        // Use the language model to generate effects for the next slot
        const model = getLanguageModel();
        const newEffects = model.generatePipeline({ temperature: DEFAULT_TEMPERATURE });

        // Update the next target slot in the background before switching
        const updatedEndless = [...endlessScenes];
        updatedEndless[nextIndex] = {
            ...updatedEndless[nextIndex],
            effects: newEffects,
            past: [],
            future: []
        };

        set({ endlessScenes: updatedEndless });
    },

    triggerEndlessStep: () => {
        const { isEndlessMode, activeEndlessIndex, switchScene } = get();
        if (!isEndlessMode) return;

        const nextIndex = (activeEndlessIndex + 1) % 2;

        // Transition to the already prepared slot
        switchScene(nextIndex, 'endless');
    },

    switchScene: (index: number, targetBank: 'sandbox' | 'endless' = 'sandbox') => {
        const {
            activeSceneIndex, activeEndlessIndex, isEndlessMode,
            scenes, endlessScenes, effects, past, future,
            transitionType
        } = get();

        const currentBank: SceneBank = isEndlessMode ? 'endless' : 'sandbox';
        const currentIndex = isEndlessMode ? activeEndlessIndex : activeSceneIndex;

        // Prevent redundant switches within the same bank
        if (index === currentIndex && targetBank === currentBank) return;

        // Prevent switching to an invalid index
        if (index < 0 || index >= (targetBank === 'sandbox' ? scenes.length : endlessScenes.length)) return;

        // 1. Park the current live state into its respective bank
        if (currentBank === 'sandbox') {
            const updatedScenes = [...scenes];
            updatedScenes[activeSceneIndex] = {
                effects: JSON.parse(JSON.stringify(effects)),
                past: JSON.parse(JSON.stringify(past)),
                future: JSON.parse(JSON.stringify(future)),
                selectedIds: new Set<string>(),
            };
            set({ scenes: updatedScenes });
        } else {
            const updatedEndless = [...endlessScenes];
            updatedEndless[activeEndlessIndex] = {
                effects: JSON.parse(JSON.stringify(effects)),
                past: [],
                future: [],
                selectedIds: new Set<string>(),
            };
            set({ endlessScenes: updatedEndless });
        }

        // 2. Set up the transition
        // If a transition is enabled, record the start time and the scene we are leaving
        if (transitionType !== 'none') {
            set({
                activeTransition: {
                    startTime: performance.now(),
                    fromIndex: currentIndex
                }
            });
        }

        // 3. Load from the target bank
        const targetSlot = targetBank === 'sandbox' ? scenes[index] : endlessScenes[index];
        if (!targetSlot) return;

        set({
            isEndlessMode: targetBank === 'endless',
            activeSceneIndex: targetBank === 'sandbox' ? index : activeSceneIndex,
            activeEndlessIndex: targetBank === 'endless' ? index : activeEndlessIndex,
            effects: JSON.parse(JSON.stringify(targetSlot.effects)),
            past: targetBank === 'sandbox' ? JSON.parse(JSON.stringify(targetSlot.past)) : [],
            future: targetBank === 'sandbox' ? JSON.parse(JSON.stringify(targetSlot.future)) : [],
            selectedIds: new Set<string>(),
            activeDropdownId: get().activeDropdownId === 'scene-transition' ? get().activeDropdownId : null,
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

    isPuzzlesUnsupportedModalOpen: false,
    setIsPuzzlesUnsupportedModalOpen: (isPuzzlesUnsupportedModalOpen) => set({ isPuzzlesUnsupportedModalOpen }),

    isPuzzleHelpModalOpen: false,
    setIsPuzzleHelpModalOpen: (isPuzzleHelpModalOpen) => set({ isPuzzleHelpModalOpen }),

    isGameMode: false,
    isPreviewingPuzzle: false,
    toggleIsPreviewingPuzzle: () => set(state => ({
        isPreviewingPuzzle: !state.isPreviewingPuzzle
    })),
    targetPuzzleEffects: [],
    puzzleMatchResult: null,
    preGameEffects: [],
    preGamePast: [],
    preGameFuture: [],

    checkPuzzle: () => {
        const { effects, targetPuzzleEffects } = get();
        const result = PuzzleService.evaluate(effects, targetPuzzleEffects);
        set({ puzzleMatchResult: result });
    },

    setPuzzleMatchResult: (puzzleMatchResult) => set({ puzzleMatchResult }),

    puzzleAudio: null,
    setPuzzleAudio: (audio) => set({ puzzleAudio: audio }),

    currentPuzzle: null,
    setCurrentPuzzle: (currentPuzzle) => {
        // If exiting game mode
        if (currentPuzzle === null) {
            set(state => ({
                currentPuzzle: null,
                isGameMode: false,
                targetPuzzleEffects: [],
                isPreviewingPuzzle: false,
                effects: state.preGameEffects, // Restore session
                past: state.preGamePast,       // Restore undo history
                future: state.preGameFuture,   // Restore redo history
                puzzleAudio: null,
                selectedIds: new Set<string>(),
                activeDropdownId: null,
            }));
            return;
        }

        const puzzle = PUZZLES[currentPuzzle];

        const prevPuzzleAudio = get().puzzleAudio;
        const newPuzzleAudio = puzzle ? DIFFICULTY_TRACKS[puzzle.difficulty] : null;

        if (prevPuzzleAudio?.url !== newPuzzleAudio?.url) {
            set({ puzzleAudio: newPuzzleAudio });
        }

        const targetPuzzleEffects = puzzle ? createMacroInstance(puzzle.macro) : [];

        set(state => ({
            currentPuzzle,
            isGameMode: true,
            targetPuzzleEffects,
            preGameEffects: state.isGameMode ? state.preGameEffects : state.effects, // Backup current session
            preGamePast: state.isGameMode ? state.preGamePast : state.past,          // Backup undo history
            preGameFuture: state.isGameMode ? state.preGameFuture : state.future,    // Backup redo history
            effects: [], // Clear effects for puzzle
            past: [],    // Fresh undo history for puzzle
            future: [],  // Fresh redo history for puzzle
            isPreviewingPuzzle: true,
            selectedIds: new Set<string>(),
            activeDropdownId: null,
        }));
    },

    activeDropdownId: null,
    setActiveDropdownId: (activeDropdownId) => set({ activeDropdownId }),

    isUiHidden: false,
    setIsUiHidden: (isUiHidden) => set({ isUiHidden }),

    isLandingOpen: true,
    setIsLandingOpen: (isLandingOpen) => set({ isLandingOpen }),

    isMobile: false,
    setIsMobile: (isMobile) => set({ isMobile }),

    setEffects: (effects) => {
        get().commitHistory();
        set({ effects })
    },

    clearEffects: () => {
        const { clearSelection, setEffects } = get();
        clearSelection();
        setEffects([]);
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
            activeDropdownId: null,
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
            activeDropdownId: null,
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
            selectedIds: new Set<string>(),
            activeDropdownId: null,
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
                selectedIds: new Set<string>(),
                activeDropdownId: null,
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

            return {
                effects: next,
                selectedIds: new Set<string>(),
                activeDropdownId: null,
            };
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

    updateEffect: (effectId, updates) => {
        set((state) => ({
            effects: state.effects.map(e => e.id === effectId ? { ...e, ...updates } : e)
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

    toggleAspectLocked: (effectId) => {
        set((state) => ({
            effects: state.effects.map(e => e.id === effectId ? { ...e, aspectLocked: !e.aspectLocked } : e)
        }));
    },

    // Transitions
    transitionType: 'crossfade',
    setTransitionType: (transitionType) => set({ transitionType }),
    transitionDuration: DEFAULT_TRANSITION_DURATION,
    setTransitionDuration: (transitionDuration) => set({ transitionDuration }),
    activeTransition: null,
    setActiveTransition: (activeTransition) => set({ activeTransition }),
}));

// For debugging
if (typeof window !== 'undefined') {
    (window as any).store = useEffectStore;
}
