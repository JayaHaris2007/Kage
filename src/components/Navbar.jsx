import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, ListTodo, BarChart2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import AppLogo from '../assets/App logo.png';

const Navbar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/habits', icon: CheckSquare, label: 'Habits' },
        { path: '/todos', icon: ListTodo, label: 'Tasks' },
        { path: '/analytics', icon: BarChart2, label: 'Analytics' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:bottom-0 md:w-20 md:h-screen bg-surface border-t md:border-t-0 md:border-r border-white/5 z-50 transition-all duration-300">
            <div className="flex md:flex-col items-center justify-around md:justify-start h-full p-2 md:py-8 md:space-y-8">

                {/* Logo (Desktop only) */}
                <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-full mb-8 overflow-hidden">
                    <img src={AppLogo} alt="Kage Logo" className="w-full h-full object-contain" />
                </div>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'text-textMuted hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />

                            {/* Tooltip (Desktop) */}
                            <span className="absolute left-14 bg-surface px-3 py-1.5 rounded border border-white/10 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block whitespace-nowrap pointer-events-none tracking-wide">
                                {item.label}
                            </span>

                            {/* Active Indicator (Mobile) */}
                            {isActive && (
                                <span className="absolute -bottom-2 w-1 h-1 bg-white rounded-full md:hidden" />
                            )}
                        </Link>
                    );
                })}

                {/* Logout (Desktop) */}
                <button
                    onClick={logout}
                    className="hidden md:flex mt-auto items-center justify-center w-12 h-12 rounded-xl text-textMuted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Logout"
                >
                    <LogOut size={22} strokeWidth={1.5} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
