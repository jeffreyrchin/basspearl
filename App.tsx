import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AboutPage from './components/AboutPage';
import HelpPage from './components/HelpPage';
import AudioReactiveView from './components/AudioReactiveView';
import AuthModal from './components/AuthModal';
import LegalConsentModal from './components/LegalConsentModal';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AudioReactiveView />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
      <LegalConsentModal />
      <AuthModal />
    </AuthProvider>
  );
};

export default App;
