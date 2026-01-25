
import React, { useState, useEffect } from 'react';
import { AppView, GlitchState, EffectConfig } from './types';
import { INITIAL_EFFECTS } from './constants';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import EditorView from './components/EditorView';
import LegalConsentModal from './components/LegalConsentModal';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [state, setState] = useState<GlitchState>({
    originalImage: null,
    previewImage: null,
    processedImage: null,
    history: [],
    historyIndex: -1,
    effects: INITIAL_EFFECTS,
    currentEffectIndex: 0
  });

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [forceLegal, setForceLegal] = useState(false);
  const [postConsentCallback, setPostConsentCallback] = useState<(() => void) | null>(null);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      // WEB WORKER STRATEGY (THE TRUTH):
      // We load the FULL resolution image and store it.
      // No resizing. No proxies.
      // The EditorView will handle async processing via Web Worker.

      const initialHistoryItem = {
        effects: INITIAL_EFFECTS
      };

      setState(prev => ({
        ...prev,
        originalImage: result,      // Source of Truth (Full Res)
        previewImage: null,         // Deprecated - we use source
        processedImage: result,     // Start with original
        processedImagePreview: null,// Deprecated
        history: [initialHistoryItem],
        historyIndex: 0,
        effects: INITIAL_EFFECTS
      }));
      setView(AppView.EDITOR);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (file: File) => {
    // Legacy fallback: if file comes through but consent missing (should be caught by click handler now)
    const hasConsent = localStorage.getItem('glitch_consent_v1');
    if (!hasConsent) {
      setPostConsentCallback(() => () => processFile(file));
      setForceLegal(true);
      setLegalModalOpen(true);
      return;
    }
    processFile(file);
  };

  const handleLegalConfirm = () => {
    localStorage.setItem('glitch_consent_v1', 'true');
    setLegalModalOpen(false);
    setForceLegal(false);

    if (postConsentCallback) {
      postConsentCallback();
      setPostConsentCallback(null);
    }
  };

  const handleOpenLegal = (force: boolean | unknown = false, callback?: () => void) => {
    const isForced = force === true;
    setForceLegal(isForced);
    if (callback) {
      setPostConsentCallback(() => callback);
    }
    setLegalModalOpen(true);
  };

  const updateState = (newState: Partial<GlitchState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const navigateTo = (newView: AppView) => {
    setView(newView);
  };

  // Rendering based on current view
  const renderView = () => {
    switch (view) {
      case AppView.LANDING:
        return <LandingPage onFileUpload={handleFileUpload} onNavigate={navigateTo} onOpenLegal={handleOpenLegal} />;
      case AppView.EDITOR:
        return (
          <EditorView
            state={state}
            onUpdateState={updateState}
            onNavigate={navigateTo}
            onOpenLegal={handleOpenLegal}
          />
        );
      case AppView.GALLERY:
        // Simplified Gallery - for demo, we go back to Landing or just show a back button
        return (
          <div className="h-screen bg-background-dark flex items-center justify-center flex-col gap-4">
            <h1 className="text-4xl font-bold uppercase tracking-widest text-primary active-glow">Gallery Mode</h1>
            <p className="text-white/40 uppercase tracking-widest text-xs">Community art showcase coming soon</p>
            <button onClick={() => setView(AppView.LANDING)} className="mt-8 px-6 py-2 border border-white/10 hover:bg-white/5 rounded-lg uppercase text-xs font-bold tracking-widest">Back to Lab</button>
          </div>
        );
      default:
        return <LandingPage onFileUpload={handleFileUpload} onNavigate={navigateTo} onOpenLegal={handleOpenLegal} />;
    }
  };

  return (
    <AuthProvider>
      {renderView()}
      <LegalConsentModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        onConfirm={handleLegalConfirm}
        isForced={forceLegal}
      />
    </AuthProvider>
  );
};

export default App;
