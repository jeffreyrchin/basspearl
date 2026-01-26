
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
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return !!localStorage.getItem('glitch_consent_v1');
  });

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      const initialHistoryItem = {
        effects: INITIAL_EFFECTS
      };

      setState(prev => ({
        ...prev,
        originalImage: result,
        previewImage: null,
        processedImage: result,
        processedImagePreview: null,
        history: [initialHistoryItem],
        historyIndex: 0,
        effects: INITIAL_EFFECTS
      }));
      setView(AppView.EDITOR);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (file: File) => {
    if (!hasAcceptedTerms) {
      setPostConsentCallback(() => () => processFile(file));
      setForceLegal(true);
      setLegalModalOpen(true);
      return;
    }
    processFile(file);
  };

  const handleLegalConfirm = () => {
    localStorage.setItem('glitch_consent_v1', 'true');
    setHasAcceptedTerms(true);
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
        return (
          <LandingPage
            onFileUpload={handleFileUpload}
            onNavigate={navigateTo}
            onOpenLegal={handleOpenLegal}
            hasAcceptedTerms={hasAcceptedTerms}
          />
        );
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
        return (
          <div className="h-screen bg-background-dark flex items-center justify-center flex-col gap-4">
            <h1 className="text-4xl font-bold uppercase tracking-widest text-primary active-glow">Gallery Mode</h1>
            <p className="text-white/40 uppercase tracking-widest text-xs">Community art showcase coming soon</p>
            <button onClick={() => setView(AppView.LANDING)} className="mt-8 px-6 py-2 border border-white/10 hover:bg-white/5 rounded-lg uppercase text-xs font-bold tracking-widest">Back to Lab</button>
          </div>
        );
      default:
        return (
          <LandingPage
            onFileUpload={handleFileUpload}
            onNavigate={navigateTo}
            onOpenLegal={handleOpenLegal}
            hasAcceptedTerms={hasAcceptedTerms}
          />
        );
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
