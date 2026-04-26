import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useEffectStore } from './store/useEffectStore';
import AboutPage from './components/AboutPage';
import HelpPage from './components/HelpPage';
import AudioReactiveView from './components/AudioReactiveView';
import AuthModal from './components/AuthModal';
import LegalConsentModal from './components/LegalConsentModal';
import PuzzleTestPage from './components/content/PuzzleTestPage';

const App = () => {
  const setIsMobile = useEffectStore((s) => s.setIsMobile);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AudioReactiveView />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/puzzle-service-test" element={<PuzzleTestPage />} />
      </Routes>
      <LegalConsentModal />
      <AuthModal />
    </AuthProvider>
  );
};

export default App;
