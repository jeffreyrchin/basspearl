
import React, { useState, useEffect } from 'react';
import { AppView, GlitchState, EffectConfig } from './types';
import { INITIAL_EFFECTS } from './constants';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import EditorView from './components/EditorView';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [state, setState] = useState<GlitchState>({
    originalImage: null,
    processedImage: null,
    history: [],
    historyIndex: -1,
    effects: INITIAL_EFFECTS,
    currentEffectIndex: 0
  });

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const initialHistoryItem = { image: result, effects: INITIAL_EFFECTS };
      setState(prev => ({
        ...prev,
        originalImage: result,
        processedImage: result,
        history: [initialHistoryItem],
        historyIndex: 0,
        effects: INITIAL_EFFECTS
      }));
      setView(AppView.EDITOR);
    };
    reader.readAsDataURL(file);
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
        return <LandingPage onFileUpload={handleFileUpload} onNavigate={navigateTo} />;
      case AppView.EDITOR:
        return (
          <EditorView
            state={state}
            onUpdateState={updateState}
            onNavigate={navigateTo}
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
        return <LandingPage onFileUpload={handleFileUpload} onNavigate={navigateTo} />;
    }
  };

  return (
    <AuthProvider>
      {renderView()}
    </AuthProvider>
  );
};

export default App;
