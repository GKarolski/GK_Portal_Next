"use client";

import React from 'react';
import { User, TicketCategory } from '@/types';
import { Menu, LayoutList, LayoutGrid, CalendarDays, DollarSign, Book, Plus, Bug, Zap, Megaphone } from 'lucide-react';
import { Button, Select } from '@/components/legacy/UIComponents';
import MonthSelector from '@/components/MonthSelector';

interface DashboardHeaderProps {
    selectedClientId: string;
    clients: User[];
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    currentMonth: string;
    setCurrentMonth: (month: string) => void;
    sortMode: string;
    setSortMode: (mode: any) => void;
    viewMode: string;
    setViewMode: (mode: any) => void;
    onOpenCreateModal: () => void;
    categoryFilter: string;
    setCategoryFilter: (filter: string) => void;
    isAdmin?: boolean;
    showMenuButton?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    selectedClientId,
    clients,
    isSidebarOpen,
    setIsSidebarOpen,
    currentMonth,
    setCurrentMonth,
    sortMode,
    setSortMode,
    viewMode,
    setViewMode,
    onOpenCreateModal,
    categoryFilter,
    setCategoryFilter,
    isAdmin = true,
    showMenuButton = false
}) => {
    // In a real app, this would come from a global state or hook
    const isStarter = false;

    return (
        <div className="h-[73px] min-h-[73px] shrink-0 border-b border-white/5 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between bg-gk-950/80 backdrop-blur-xl gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3">
                    {(isAdmin || showMenuButton) && (
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-xl"><Menu size={20} /></button>
                    )}
                    <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate">
                        <span className="truncate">
                            {!isAdmin ? (
                                (clients.find(c => c.id === selectedClientId)?.companyName || 'Portal Klienta')
                            ) : (
                                selectedClientId === 'ALL'
                                    ? 'Panel Administracyjny'
                                    : (() => {
                                        const client = clients.find(c => c.organizationId === selectedClientId || c.id === selectedClientId);
                                        return client?.companyName || client?.name || 'Klient';
                                    })()
                            )}
                        </span>
                    </h1>
                </div>

                {['list', 'board', 'calendar'].includes(viewMode) && (
                    <div className="hidden md:flex items-center gap-2">
                        <button onClick={() => setCategoryFilter('ALL')} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${categoryFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-slate-400 hover:text-white'}`}>Wszystkie</button>
                        <button onClick={() => setCategoryFilter(TicketCategory.BUG)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${categoryFilter === TicketCategory.BUG ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-transparent border-white/20 text-slate-400 hover:text-red-400'}`}><Bug size={12} /> Błędy</button>
                        <button onClick={() => setCategoryFilter(TicketCategory.FEATURE)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${categoryFilter === TicketCategory.FEATURE ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 'bg-transparent border-white/20 text-slate-400 hover:text-yellow-400'}`}><Zap size={12} /> Modyfikacje</button>
                        <button onClick={() => setCategoryFilter(TicketCategory.MARKETING)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${categoryFilter === TicketCategory.MARKETING ? 'bg-gk-blue-400/20 text-gk-blue-400 border-gk-blue-400' : 'bg-transparent border-white/20 text-slate-400 hover:text-gk-blue-400'}`}><Megaphone size={12} /> Marketing</button>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                {viewMode !== 'dashboard' && (
                    <>
                        {!['kb', 'calendar'].includes(viewMode) && (
                            <>
                                <MonthSelector currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
                                {!['finance'].includes(viewMode) && (
                                    <div className="relative group w-full md:w-auto">
                                        <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)} options={[{ value: 'DATE', label: 'Data' }, { value: 'PRIORITY', label: 'Priorytet' }, { value: 'STATUS', label: 'Status' }]} className="w-full md:w-40" />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="flex bg-gk-900 rounded-xl p-1 border border-white/10 flex-1 md:flex-none justify-center h-10 items-center">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500'}`} title="Lista"><LayoutList size={16} /></button>
                                <button onClick={() => setViewMode('board')} className={`p-2 rounded-xl transition-all ${viewMode === 'board' ? 'bg-white/10 text-white' : 'text-slate-500'}`} title="Tablica"><LayoutGrid size={16} /></button>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-slate-500'}`} title="Kalendarz"><CalendarDays size={16} /></button>
                                        <button onClick={() => setViewMode('finance')} className={`p-2 rounded-xl transition-all ${viewMode === 'finance' ? 'bg-white/10 text-white' : 'text-slate-500'}`} title="Finanse"><DollarSign size={16} /></button>
                                        {!isStarter && <button onClick={() => setViewMode('kb')} className={`p-2 rounded-xl transition-all ${viewMode === 'kb' ? 'bg-white/10 text-white' : 'text-slate-500'}`} title="Baza Wiedzy"><Book size={16} /></button>}
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <Button onClick={onOpenCreateModal} className="shadow-lg shadow-accent-red/20"><Plus size={18} /></Button>
            </div>
        </div>
    );
};
