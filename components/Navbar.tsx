import { Link, useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';

const Navbar = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    const navLinks = [
        { to: '/about', label: 'About', icon: "info" },
        { to: '/help', label: 'Help', icon: "help" }
    ];

    return (
        <>
            <header className="flex items-center justify-between px-4 md:px-8 py-4 z-navbar bg-transparent w-full">
                {/* Left: Logo */}
                <Link to="/" className="flex items-center gap-2 group pointer-events-auto">
                    <h1 className="text-xl font-bold tracking-normal uppercase bg-gradient-to-r from-indigo-300 to-indigo-200 bg-clip-text text-transparent">
                        muxels
                    </h1>
                    <p className="hidden sm:block text-white/60 font-medium text-xs tracking-widest uppercase relative top-[0.5px] leading-[1.1em]">Visualize Your Sound</p>
                </Link>

                {/* Right: Navigation Links and User Menu */}
                <div className="flex items-center gap-3 md:gap-6 pointer-events-auto">
                    {/* Navigation Links */}
                    <nav className="flex items-center gap-2">
                        {navLinks.map(link => {
                            const isLinkActive = isActive(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`relative px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 ${isLinkActive ? 'text-primary bg-primary/10' : 'text-white/60 hover:text-white hover:bg-white/20'}`}
                                    title={link.label}>
                                    <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <UserMenu />
                </div>
            </header>
        </>
    );
};

export default Navbar;
