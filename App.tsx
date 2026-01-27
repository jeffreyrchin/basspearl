
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppView, GlitchState } from './types';
import { INITIAL_EFFECTS } from './constants';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import EditorView from './components/EditorView';
import GalleryPage from './components/GalleryPage';
import AboutPage from './components/AboutPage';
import HelpPage from './components/HelpPage';
import LegalConsentModal from './components/LegalConsentModal';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Main SPA Route - Landing and Editor */}
        <Route path="/" element={<MainApp />} />

        {/* Routed Pages */}
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </AuthProvider>
  );
};

// Main SPA component for Landing/Editor flow
const MainApp: React.FC = () => {
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

  return (
    <>
      {view === AppView.LANDING ? (
        <LandingPage
          onFileUpload={handleFileUpload}
          onNavigate={navigateTo}
          onOpenLegal={handleOpenLegal}
          hasAcceptedTerms={hasAcceptedTerms}
        />
      ) : (
        <EditorView
          state={state}
          onUpdateState={updateState}
          onNavigate={navigateTo}
          onOpenLegal={handleOpenLegal}
        />
      )}
      <LegalConsentModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        onConfirm={handleLegalConfirm}
        isForced={forceLegal}
      />
    </>
  );
};

export default App;
