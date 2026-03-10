import { AuthProvider } from '../context/AuthContext';
import Navbar from './Navbar';
import HelpContent from './content/HelpContent';
import { Footer } from './Footer';

const HelpPage = () => {
    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col bg-background-dark text-white">
                <Navbar />

                <main className="flex-1 relative grid-bg">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
                        <div className="text-center mb-12 md:mb-16">
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 active-glow">
                                Help
                            </h1>
                        </div>

                        <HelpContent />
                    </div>
                </main>
                <Footer />
            </div>
        </AuthProvider>
    );
};

export default HelpPage;
