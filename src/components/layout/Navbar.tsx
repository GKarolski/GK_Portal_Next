import React from 'react';
import { LogOut } from 'lucide-react';
import { User, UserRole } from '@/types';

interface NavbarProps {
    user: User;
    onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
    return (
        <nav className="h-16 border-b border-white/5 bg-gk-950/80 backdrop-blur-md flex-none w-full z-40 flex items-center justify-between px-4 lg:px-12">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-tr from-gk-800 to-black border border-white/10 flex items-center justify-center text-accent-red font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    GK
                </div>
                <span className="font-bold text-lg tracking-tight text-white">
                    GK_<span className="text-accent-red">Digital</span>
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-white tracking-wide">{user.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {user.role === UserRole.ADMIN ? 'Administrator' : 'Klient'}
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="text-slate-500 hover:text-accent-red transition-colors p-2"
                    title="Wyloguj"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
};
