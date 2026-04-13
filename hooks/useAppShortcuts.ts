import { useEffect, useRef } from 'react';
import { useEffectStore } from '@/store/useEffectStore';

interface UseAppShortcutsProps {
    onTogglePlay: () => void;
    onScrub: (delta: number) => void;
    onReleaseScrubber: () => void;
}

export const useAppShortcuts = ({ onTogglePlay, onScrub, onReleaseScrubber }: UseAppShortcutsProps) => {
    // Connect directly to store
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const removeFocus = useEffectStore(s => s.removeFocus);
    const undo = useEffectStore(s => s.undo);
    const redo = useEffectStore(s => s.redo);
    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);
    const isUiHidden = useEffectStore(s => s.isUiHidden);
    const setIsUiHidden = useEffectStore(s => s.setIsUiHidden);
    const switchScene = useEffectStore(s => s.switchScene);
    const isSceneHotbarOpen = useEffectStore(s => s.isSceneHotbarOpen);
    const setIsSceneHotbarOpen = useEffectStore(s => s.setIsSceneHotbarOpen);

    // Derived state
    const isInspectorOpen = focusStack.includes('inspector');
    const isLibraryOpen = focusStack.includes('library');

    // These capture the latest state in the closure but we use a ref wrapper to ensure events get latest refs
    const propsRef = useRef({ onTogglePlay, onScrub, onReleaseScrubber, isSidebarOpen, isInspectorOpen, isLibraryOpen, setIsSidebarOpen, pushFocus, removeFocus, undo, redo, setActiveDropdownId, isUiHidden, setIsUiHidden, switchScene, isSceneHotbarOpen });

    useEffect(() => {
        propsRef.current = { onTogglePlay, onScrub, onReleaseScrubber, isSidebarOpen, isInspectorOpen, isLibraryOpen, setIsSidebarOpen, pushFocus, removeFocus, undo, redo, setActiveDropdownId, isUiHidden, setIsUiHidden, switchScene, isSceneHotbarOpen };
    }, [onTogglePlay, onScrub, onReleaseScrubber, isSidebarOpen, isInspectorOpen, isLibraryOpen, setIsSidebarOpen, pushFocus, removeFocus, undo, redo, setActiveDropdownId, isUiHidden, setIsUiHidden, switchScene, isSceneHotbarOpen]);

    // Update global interaction logic on every render via ref
    const handleGlobalPtrDownLogicRef = useRef<(e: PointerEvent) => void>(() => { });
    const handleGlobalFocusInLogicRef = useRef<(e: FocusEvent) => void>(() => { });
    const handleGlobalKbdDownLogicRef = useRef<(e: KeyboardEvent) => void>(() => { });

    useEffect(() => {
        handleGlobalPtrDownLogicRef.current = (e: PointerEvent) => {
            const { setActiveDropdownId, pushFocus } = propsRef.current;
            const target = e.target as HTMLElement;
            if (target.closest?.('[data-dropdown-ignore]')) return;

            setActiveDropdownId(null);

            // Find the parent section to manage logical focus
            const container = target.closest?.('[data-section]') as HTMLElement;
            const section = container?.dataset.section;

            // Update focus based on section
            if (section === 'window') {
                const windowType = container?.dataset.window as 'inspector' | 'library' | undefined;
                if (windowType) pushFocus(windowType);
            } else if (section === 'pipeline' || section === 'viewport') {
                pushFocus('pipeline');
            }
        };

        handleGlobalFocusInLogicRef.current = (e: FocusEvent) => {
            const { pushFocus } = propsRef.current;
            const target = e.target as HTMLElement;
            const container = target.closest?.('[data-section]') as HTMLElement;
            const section = container?.dataset.section;

            if (section === 'window') {
                const windowType = container?.dataset.window as 'inspector' | 'library' | undefined;
                if (windowType) pushFocus(windowType);
            } else if (section === 'pipeline' || section === 'viewport') {
                pushFocus('pipeline');
            }
        };

        handleGlobalKbdDownLogicRef.current = (e: KeyboardEvent) => {
            const { undo, redo, setIsSidebarOpen, isSidebarOpen, isInspectorOpen, pushFocus, removeFocus, isLibraryOpen, onTogglePlay, onScrub, isUiHidden, setIsUiHidden, switchScene, isSceneHotbarOpen } = propsRef.current;
            const target = e.target as HTMLElement;
            const isTyping = (target.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button', 'submit'].includes((target as HTMLInputElement).type)) ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            const isModalOpen = document.querySelector('[data-section="modal"]');

            if (isTyping || isModalOpen) return;

            const key = e.key.toLowerCase();

            // Toggle UI Visibility - H
            if (key === 'h') {
                e.preventDefault();
                setIsUiHidden(!isUiHidden);
                return;
            }

            // Show UI - Esc or Tab
            if (isUiHidden && (key === 'escape' || key === 'tab')) {
                e.preventDefault();
                setIsUiHidden(false);
                return;
            }

            // Global Undo/Redo - Cmd/Ctrl + (Shift) + Z/Y
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && key === 'z') {
                if (e.shiftKey) redo();
                else undo();
                e.preventDefault();
            } else if (isMod && key === 'y') {
                redo();
                e.preventDefault();
            }

            // Toggle Sidebar - P
            if (key === 'p') {
                setIsSidebarOpen(!isSidebarOpen);
            }

            // Toggle Inspector - I
            else if (key === 'i') {
                if (isInspectorOpen) removeFocus('inspector');
                else pushFocus('inspector');
            }

            // Toggle Library - Y
            else if (key === 'y' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                if (isLibraryOpen) removeFocus('library');
                else pushFocus('library');
            }

            // Toggle Scene Hotbar - K
            else if (key === 'k' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                setIsSceneHotbarOpen(!isSceneHotbarOpen);
            }

            // Scene Hotbar - digits 1-8 (only when no modifier keys held)
            if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && isSceneHotbarOpen) {
                const digit = parseInt(e.key, 10);
                if (digit >= 1 && digit <= 8) {
                    e.preventDefault();
                    switchScene(digit - 1);
                    return;
                }
            }

            // Handle Space for Play/Pause
            if (e.code === 'Space' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault(); // Prevent page scroll down
                if (target.tagName === 'BUTTON') target.blur(); // If a button is focused, blurring it prevents it from being natively clicked again.
                onTogglePlay();
                return;
            }

            // Handle Seeking
            const isForward = e.key === 'ArrowRight' || e.key.toLowerCase() === 'l';
            const isBackward = e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j';

            if (isForward || isBackward) {
                // If it's a shifted arrow, we handle it as a 10s jump
                e.preventDefault();
                const delta = (e.shiftKey || e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'l') ? 10 : 5;
                onScrub(isForward ? delta : -delta);
            }
        };
    });

    // Global Interaction Handlers (Stable Listeners)
    useEffect(() => {
        const handleUp = () => propsRef.current.onReleaseScrubber();
        const handleDown = (e: PointerEvent) => handleGlobalPtrDownLogicRef.current(e);
        const handleFocus = (e: FocusEvent) => handleGlobalFocusInLogicRef.current(e);
        const handleKeyDown = (e: KeyboardEvent) => handleGlobalKbdDownLogicRef.current(e);

        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
        document.addEventListener('pointerdown', handleDown, { capture: true });
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
            document.removeEventListener('pointerdown', handleDown, { capture: true });
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
};
