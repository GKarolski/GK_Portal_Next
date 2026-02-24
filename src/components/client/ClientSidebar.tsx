"use client";

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { backend } from '@/services/api';
import { X, Users, Inbox, MoreVertical, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientSidebarProps {
    orgName: string;
    orgUsers: User[];
    selectedMemberId: string | null;
    setSelectedMemberId: (id: string | null) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onOpenProfile?: () => void;
    logo?: string;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({
    orgName,
    orgUsers,
    selectedMemberId,
    setSelectedMemberId,
    isSidebarOpen,
    setIsSidebarOpen,
    onOpenProfile,
    logo
}) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showColorPickerId, setShowColorPickerId] = useState<string | null>(null);
    const [localUsers, setLocalUsers] = useState<User[]>(orgUsers);

    useEffect(() => {
        setLocalUsers(orgUsers);
    }, [orgUsers]);

    const handleColorChange = async (userId: string, color: string) => {
        setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, color } : u));
        try {
            await backend.updateUserProfileColor(userId, color);
        } catch (err) {
            console.error("Failed to update user color", err);
        }
        setShowColorPickerId(null);
        setOpenMenuId(null);
    };

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-gk-900 border-r border-white/5 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center h-[73px]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {logo ? (
                            <img src={logo} alt="Logo" className="w-9 h-9 object-cover rounded-full border border-white/10" />
                        ) : (
                            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-accent-red to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-accent-red/20">
                                {orgName[0]}
                            </div>
                        )}
                        <h2 className="text-lg font-bold text-white tracking-wide truncate">{orgName}</h2>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 pt-6 space-y-6">

                    {/* Main Navigation */}
                    <div className="space-y-1">
                        <label className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">
                            Nawigacja
                        </label>
                        <button
                            onClick={() => { setSelectedMemberId(null); setIsSidebarOpen(false); }}
                            className={cn(
                                "w-full text-left px-3 py-3 rounded-2xl text-sm flex items-center gap-3 transition-all",
                                selectedMemberId === null ? "bg-white/10 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Inbox size={18} className={selectedMemberId === null ? 'text-accent-red' : ''} />
                            <span className="font-bold">Wszystkie Zgłoszenia</span>
                        </button>
                    </div>

                    {/* Team Members */}
                    <div className="space-y-1">
                        <label className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block flex justify-between items-center">
                            <span>Twój Zespół</span>
                            <Users size={12} className="opacity-50" />
                        </label>

                        {localUsers.length > 0 ? (
                            localUsers.map(member => (
                                <div key={member.id} className="relative group/member">
                                    <button
                                        onClick={() => { setSelectedMemberId(member.id); setIsSidebarOpen(false); }}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-2xl text-sm flex items-center gap-3 transition-all",
                                            selectedMemberId === member.id ? "bg-white/10 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {/* Color Dot */}
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                            style={{ backgroundColor: member.color || '#3b82f6', boxShadow: `0 0 8px ${member.color || '#3b82f6'}40` }}
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold truncate">{member.name}</div>
                                        </div>

                                        {/* Settings Icon (Visible on hover or if menu open) */}
                                        <div className={cn(
                                            "flex items-center gap-1 transition-opacity",
                                            openMenuId === member.id ? "opacity-100" : "opacity-0 group-hover/member:opacity-100"
                                        )}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === member.id ? null : member.id);
                                                    setShowColorPickerId(null);
                                                }}
                                                className="p-1 px-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        </div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openMenuId === member.id && (
                                        <div className="absolute right-2 top-full mt-1 w-44 bg-gk-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowColorPickerId(member.id); }}
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                            >
                                                <Palette size={14} /> Zmień Kolor
                                            </button>

                                            {showColorPickerId === member.id && (
                                                <div className="px-4 pb-4 flex gap-2 flex-wrap">
                                                    {colors.map(c => (
                                                        <div
                                                            key={c}
                                                            onClick={(e) => { e.stopPropagation(); handleColorChange(member.id, c); }}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform",
                                                                member.color === c ? "ring-2 ring-white scale-110" : ""
                                                            )}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Overlay to close menu */}
                                    {openMenuId === member.id && (
                                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center rounded-2xl bg-white/5 border border-dashed border-white/10">
                                <p className="text-[10px] text-slate-500 italic">Brak innych członków zespołu</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-gk-900 z-10">
                    <button
                        onClick={onOpenProfile}
                        className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all group"
                    >
                        <div className="p-2 rounded-full bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-all border border-transparent group-hover:border-white/10">
                            <Users size={18} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 group-hover:text-white transition-colors">Kontakt</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
