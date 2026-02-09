
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AppView, GlitchState } from './types';
import { INITIAL_EFFECTS } from './constants';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import EditorView from './components/EditorView';
import GalleryPage from './components/GalleryPage';
import AboutPage from './components/AboutPage';
import HelpPage from './components/HelpPage';
import LegalConsentModal from './components/LegalConsentModal';
import { generateAudioArt, getAudioMetadata } from './services/audioArtGenerator';
import AudioReactiveView from './components/AudioReactiveView';

const App: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [forceLegal, setForceLegal] = useState(false);
  const [postConsentCallback, setPostConsentCallback] = useState<(() => void) | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return !!localStorage.getItem('glitch_consent_02042026');
  });

  const handleLegalConfirm = () => {
    localStorage.setItem('glitch_consent_02042026', 'true');
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

  return (
    <AuthProvider>
      <Routes>
        {/* Main SPA Route - Landing and Editor */}
        <Route path="/" element={
          <MainApp
            hasAcceptedTerms={hasAcceptedTerms}
            setHasAcceptedTerms={setHasAcceptedTerms}
            onOpenLegal={handleOpenLegal}
          />
        } />
        <Route path="/animate" element={
          <AudioReactiveView
            onOpenLegal={handleOpenLegal}
          />
        } />

        {/* Routed Pages */}
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
      <LegalConsentModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        onConfirm={handleLegalConfirm}
        isForced={forceLegal}
      />
    </AuthProvider>
  );
};

// Main SPA component for Landing/Editor flow
const MainApp: React.FC<{
  hasAcceptedTerms: boolean,
  setHasAcceptedTerms: React.Dispatch<React.SetStateAction<boolean>>,
  onOpenLegal: (force: boolean | unknown, callback?: () => void) => void
}> = ({ hasAcceptedTerms, setHasAcceptedTerms, onOpenLegal: handleOpenLegal }) => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [state, setState] = useState<GlitchState>({
    originalImage: null,
    previewImage: null,
    processedImage: null,
    history: [],
    historyIndex: -1,
    effects: INITIAL_EFFECTS,
    currentEffectIndex: -1,
    crop: { aspectRatio: null, aspectLabel: null, scale: 1.0, x: 0, y: 0 }
  });

  const processFile = async (file: File) => {
    // Detect file type
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isAudio) {
      alert('Please upload an image or audio file.');
      return;
    }

    const initialHistoryItem = {
      effects: INITIAL_EFFECTS
    };

    if (isImage) {
      // Process image as before
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;

        setState(prev => ({
          ...prev,
          originalImage: result,
          previewImage: null,
          processedImage: result,
          processedImagePreview: null,
          history: [initialHistoryItem],
          historyIndex: 0,
          effects: INITIAL_EFFECTS,
          crop: { aspectRatio: null, aspectLabel: null, scale: 1.0, x: 0, y: 0 },
          audioMetadata: null
        }));
        setView(AppView.EDITOR);
      };
      reader.readAsDataURL(file);
    } else if (isAudio) {
      // Process audio file
      try {
        setView(AppView.PROCESSING); // Show loading state

        // Generate art from audio
        const { imageData, suggestedEffects } = await generateAudioArt(file, {
          width: 1280,
          height: 1280,
          colorScheme: 'cyberpunk'
        });

        // Get audio metadata
        const metadata = await getAudioMetadata(file);

        setState(prev => ({
          ...prev,
          originalImage: imageData,
          previewImage: null,
          processedImage: imageData,
          processedImagePreview: null,
          history: [initialHistoryItem],
          historyIndex: 0,
          effects: suggestedEffects,
          crop: { aspectRatio: null, aspectLabel: null, scale: 1.0, x: 0, y: 0 },
          audioMetadata: metadata
        }));
        setView(AppView.EDITOR);
      } catch (error) {
        console.error('Audio processing error:', error);
        alert('Unable to process audio file. Please try a different file.');
        setView(AppView.LANDING);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    // Implicit consent flow
    if (!hasAcceptedTerms) {
      localStorage.setItem('glitch_consent_02042026', 'true');
      setHasAcceptedTerms(true);
    }
    processFile(file);
  };


  const updateState = (newState: Partial<GlitchState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const navigate = useNavigate();

  const navigateTo = (newView: AppView) => {
    if (newView === AppView.AUDIO_REACTIVE) {
      navigate('/animate');
      return;
    }

    if (view === AppView.EDITOR && newView !== AppView.EDITOR) {
      if (!window.confirm("Changes you made may not be saved. Are you sure you want to leave?")) {
        return;
      }
    }
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
      ) : view === AppView.PROCESSING ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark text-white">
          <div className="text-center">
            <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="material-symbols-outlined text-primary text-[48px]">graphic_eq</span>
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-wider mb-3">Generating Art from Audio</h2>
            <p className="text-white/60 text-sm uppercase tracking-widest">This may take a few seconds...</p>
          </div>
        </div>
      ) : (
        <EditorView
          state={state}
          onUpdateState={updateState}
          onNavigate={navigateTo}
          onOpenLegal={handleOpenLegal}
        />
      )}
    </>
  );
};

export default App;
