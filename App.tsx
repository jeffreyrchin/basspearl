import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useEffectStore } from './store/useEffectStore';
import { useAuthStore } from './store/useAuthStore';
import { useLegalStore } from './store/useLegalStore';
import { useProStore } from './store/useProStore';
import { AnimatePresence } from 'framer-motion';
import AboutPage from './components/AboutPage';
import HelpPage from './components/HelpPage';
import AudioReactiveView from './components/AudioReactiveView';
import AuthModal from './components/AuthModal';
import LegalConsentModal from './components/LegalConsentModal';
import ProModal from './components/ProModal';
import LandingModal from './components/LandingModal';
import PuzzleTestPage from './components/content/PuzzleTestPage';

const App = () => {
  const setIsMobile = useEffectStore((s) => s.setIsMobile);
  const isAuthOpen = useAuthStore((s) => s.isAuthOpen);
  const isLegalOpen = useLegalStore((s) => s.isLegalOpen);
  const isProModalOpen = useProStore((s) => s.isProModalOpen);
  const isLandingOpen = useEffectStore((s) => s.isLandingOpen);
  const location = useLocation();
  const isMainPage = location.pathname === '/';

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
      <AnimatePresence>
        {isMainPage && isLandingOpen && <LandingModal />}
      </AnimatePresence>
      <AnimatePresence>
        {isLegalOpen && <LegalConsentModal />}
      </AnimatePresence>
      <AnimatePresence>
        {isAuthOpen && <AuthModal />}
      </AnimatePresence>
      <AnimatePresence>
        {isProModalOpen && <ProModal />}
      </AnimatePresence>
    </AuthProvider>
  );
};

export default App;
