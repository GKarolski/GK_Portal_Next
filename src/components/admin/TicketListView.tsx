"use client";

import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, Folder, User } from '@/types';
import { backend } from '@/services/api';
import { Button, Select } from '@/components/legacy/UIComponents';
import { KnowledgeBase } from '@/components/KnowledgeBase';
import { CalendarView } from '@/components/CalendarView';
import {
    Bug, Zap, Megaphone, CalendarDays, Wallet, TrendingUp, PieChart,
    DollarSign, Copy, AlertCircle
} from 'lucide-react';

interface TicketListViewProps {
    viewMode: string;
    selectedClientId: string;
    clients: User[];
    activeFolderId: string | null;
    setActiveFolderId: (id: string | null) => void;
    folders: Folder[];
    setIsFolderManagerOpen: (isOpen: boolean) => void;
    setEditingFolder: (folder: Folder | null) => void;
    categoryFilter: string;
    setCategoryFilter: (filter: string) => void;
    filteredTickets: Ticket[];
    ticketsForFinance?: Ticket[];
    user: User;
    currentMonth: string;
    onTicketsUpdated: (tickets: Ticket[]) => void;
    onOpenTicketDetail: (ticket: Ticket) => void;
    onStatusUpdate: (ticketId: string, status: TicketStatus) => void;
    onOpenInvoiceGenerator: () => void;
    isAdmin?: boolean;
}

const statusTranslations: Record<TicketStatus, string> = {
    [TicketStatus.REVIEW]: "Weryfikacja",
    [TicketStatus.PENDING]: "Do zrobienia",
    [TicketStatus.IN_PROGRESS]: "W trakcie",
    [TicketStatus.DONE]: "Zakończone"
};

const renderSafeCategory = (category: string) => {
    let icon = AlertCircle;
    let color = "text-slate-500";
    let label = category || "Inne";

    if (category === TicketCategory.BUG) { icon = Bug; color = "text-red-400"; label = "Błąd"; }
    else if (category === TicketCategory.MARKETING) { icon = Megaphone; color = "text-gk-blue-400"; label = "Marketing"; }
    else if (category === TicketCategory.FEATURE) { icon = Zap; color = "text-yellow-400"; label = "Modyfikacja"; }

    const IconComp = icon;
    return (
        <span className={`flex items-center gap-1.5 ${color} text-xs font-medium bg-white/5 px-2 py-1 rounded border border-white/5`}>
            <IconComp size={12} /> {label}
        </span>
    );
};

const renderSafeIconOnly = (category: string) => {
    if (category === TicketCategory.BUG) return <Bug size={14} className="text-red-400" />;
    if (category === TicketCategory.MARKETING) return <Megaphone size={14} className="text-gk-blue-400" />;
    if (category === TicketCategory.FEATURE) return <Zap size={14} className="text-yellow-400" />;
    return <AlertCircle size={14} className="text-slate-600" />;
};

const renderSafePriority = (priority: string) => {
    const config = {
        [TicketPriority.LOW]: { color: "text-slate-400 border-slate-400/20", label: "Niski" },
        [TicketPriority.NORMAL]: { color: "text-gk-blue-400 border-gk-blue-400/20", label: "Normalny" },
        [TicketPriority.HIGH]: { color: "text-yellow-400 border-yellow-400/20", label: "Wysoki" },
        [TicketPriority.URGENT]: { color: "text-red-500 border-red-500/20", label: "PILNE" },
    };
    const { color, label } = (priority && config[priority as TicketPriority]) ? config[priority as TicketPriority] : { color: "text-slate-500 border-slate-500/20", label: "Normalny" };
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-white/5 ${color}`}>{label}</span>;
};

const renderSafeStatus = (status: string) => {
    const styles = {
        [TicketStatus.PENDING]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        [TicketStatus.IN_PROGRESS]: "bg-gk-blue-400/10 text-gk-blue-400 border-gk-blue-400/20",
        [TicketStatus.REVIEW]: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        [TicketStatus.DONE]: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    const style = (status && styles[status as TicketStatus]) ? styles[status as TicketStatus] : styles[TicketStatus.PENDING];
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${style}`}>{status || 'PENDING'}</span>;
};

export const TicketListView: React.FC<TicketListViewProps> = ({
    viewMode,
    selectedClientId,
    clients,
    activeFolderId,
    setActiveFolderId,
    folders,
    setIsFolderManagerOpen,
    setEditingFolder,
    categoryFilter,
    setCategoryFilter,
    filteredTickets,
    ticketsForFinance,
    user,
    currentMonth,
    onTicketsUpdated,
    onOpenTicketDetail,
    onStatusUpdate,
    onOpenInvoiceGenerator,
    isAdmin = true
}) => {
    const [expandedStatus, setExpandedStatus] = useState<TicketStatus | null>(null);

    return (
        <div className={`flex-1 ${isAdmin ? 'px-6 md:px-12' : 'px-4 md:px-8'} pt-6 w-full h-full overflow-hidden bg-gk-950 flex flex-col`}>
            {viewMode === 'calendar' && (
                <CalendarView
                    tickets={filteredTickets}
                    onUpdateTicket={async (tid, field, val) => {
                        await backend.updateTicketStatus(tid, val as TicketStatus);
                        const updated = await backend.getTickets(currentMonth);
                        onTicketsUpdated(updated);
                    }}
                    onOpenTicket={onOpenTicketDetail}
                />
            )}

            {viewMode === 'list' && (
                <div className="flex flex-col h-full overflow-hidden space-y-6 pb-6">
                    {(() => {
                        const statusesToCheck = [TicketStatus.REVIEW, TicketStatus.PENDING, TicketStatus.IN_PROGRESS, TicketStatus.DONE];
                        const activeStatuses = statusesToCheck.filter(s => filteredTickets.some(t => t.status === s));

                        if (activeStatuses.length === 0) return <div className="text-slate-500 text-center mt-10">Brak zgłoszeń.</div>;

                        return activeStatuses.map(status => {
                            const groupTickets = filteredTickets.filter(t => t.status === status);
                            const isExpanded = expandedStatus === status;
                            const isHidden = expandedStatus && !isExpanded;

                            if (isHidden) return null;

                            return (
                                <div
                                    key={status}
                                    className={`
                                        bg-white/5 rounded-2xl border border-white/5 flex flex-col transition-all duration-300
                                        ${isExpanded ? 'h-full' : 'flex-1 min-h-[60px]'}
                                    `}
                                >
                                    <div
                                        className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between rounded-t-2xl cursor-pointer hover:bg-white/10 transition-colors"
                                        onClick={() => setExpandedStatus(isExpanded ? null : status)}
                                    >
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${status === TicketStatus.DONE ? 'bg-emerald-500' : 'bg-gk-blue-400'}`} />
                                            {statusTranslations[status]}
                                            {isExpanded && <span className="text-[9px] bg-gk-blue-400/20 text-gk-blue-400 px-2 py-0.5 rounded ml-2">ROZWINIĘTE</span>}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-slate-500">{groupTickets.length}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5 bg-black/20">
                                        {groupTickets.map(ticket => (
                                            <div key={ticket.id} onClick={() => onOpenTicketDetail(ticket)} className="px-6 py-4 grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_120px_160px] items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group">
                                                <div className="text-slate-600 transition-colors group-hover:text-slate-400">{renderSafeIconOnly(ticket.category)}</div>

                                                <div className="min-w-0 overflow-hidden">
                                                    <div className="font-semibold text-sm text-slate-200 truncate pr-4">{ticket.subject}</div>
                                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                                        <span className="text-slate-400 font-medium">{ticket.clientName}</span>
                                                        {ticket.price && Number(ticket.price) > 0 && <span className="text-slate-500 border border-white/10 px-1.5 py-0.5 rounded bg-white/5">{ticket.price} PLN</span>}
                                                    </div>
                                                </div>

                                                <div className="hidden md:flex justify-center">
                                                    {renderSafePriority(ticket.priority)}
                                                </div>

                                                <div className="flex justify-end min-w-[140px]" onClick={e => e.stopPropagation()}>
                                                    {isAdmin ? (
                                                        <Select value={ticket.status} onChange={(e) => onStatusUpdate(ticket.id, e.target.value as TicketStatus)} options={Object.values(TicketStatus).map(s => ({ value: s, label: statusTranslations[s] }))} className="!h-8 !text-xs w-full" />
                                                    ) : (
                                                        <div className="flex justify-end">
                                                            {renderSafeStatus(ticket.status)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            {viewMode === 'kb' && (
                <KnowledgeBase clients={clients} activeClientId={selectedClientId} />
            )}

            {viewMode === 'board' && (
                <div className="flex gap-6 h-full pb-6 overflow-x-auto snap-x snap-mandatory px-2">
                    {[TicketStatus.REVIEW, TicketStatus.PENDING, TicketStatus.IN_PROGRESS, TicketStatus.DONE].map(status => {
                        const colTickets = filteredTickets.filter(t => t.status === status);

                        return (
                            <div
                                key={status}
                                className="min-w-[85vw] md:min-w-0 md:flex-1 bg-white/5 rounded-2xl flex flex-col h-full border border-white/5 snap-center transition-colors"
                            >
                                <div className="p-4 border-b border-white/5 font-bold text-[10px] uppercase text-slate-400 flex justify-between items-center bg-white/5 rounded-t-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${status === TicketStatus.DONE ? 'bg-emerald-500' : 'bg-gk-blue-400'}`} />
                                        {statusTranslations[status]}
                                    </div>
                                    <span className="bg-black/30 px-2 py-0.5 rounded text-slate-500">{colTickets.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                    {colTickets.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => onOpenTicketDetail(t)}
                                            className="bg-black/20 p-4 rounded-2xl border border-white/5 cursor-pointer hover:border-gk-blue-400/40 transition-all group hover:bg-white/5 hover:shadow-lg"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                {renderSafeCategory(t.category)}
                                                {renderSafePriority(t.priority)}
                                            </div>
                                            <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors mb-3 leading-snug">{t.subject}</h4>
                                            <div className="text-[10px] text-slate-500 flex justify-between items-center pt-2 border-t border-white/5">
                                                <span className="truncate max-w-[120px]">{t.clientName}</span>
                                                {t.price && Number(t.price) > 0 && <span className="text-emerald-500 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">{t.price} PLN</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {viewMode === 'finance' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] overflow-y-auto pb-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 p-6 rounded-2xl border border-emerald-500/20">
                            <div className="flex items-center gap-3 mb-2 text-emerald-400"><Wallet size={24} /><span className="text-xs font-bold uppercase tracking-widest">Zrealizowane ({currentMonth})</span></div>
                            <div className="text-3xl font-black text-white">{(ticketsForFinance || filteredTickets).filter(t => t.status === TicketStatus.DONE).reduce((acc, t) => acc + Number(t.price || 0), 0).toFixed(2)} PLN</div>
                        </div>
                        <div className="bg-gradient-to-br from-gk-blue-400/10 to-gk-blue-900/10 p-6 rounded-2xl border border-gk-blue-400/20">
                            <div className="flex items-center gap-3 mb-2 text-gk-blue-400"><TrendingUp size={24} /><span className="text-xs font-bold uppercase tracking-widest">W Toku (Przewidywane)</span></div>
                            <div className="text-3xl font-black text-white">{((ticketsForFinance || filteredTickets).reduce((acc, t) => acc + Number(t.price || 0), 0) - (ticketsForFinance || filteredTickets).filter(t => t.status === TicketStatus.DONE).reduce((acc, t) => acc + Number(t.price || 0), 0)).toFixed(2)} PLN</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 p-6 rounded-2xl border border-purple-500/20">
                            <div className="flex items-center gap-3 mb-2 text-purple-400"><PieChart size={24} /><span className="text-xs font-bold uppercase tracking-widest">Czas (Godzin)</span></div>
                            <div className="text-3xl font-black text-white">
                                {((ticketsForFinance || filteredTickets).reduce((acc, t) => acc + Number(t.total_duration_seconds || 0), 0) / 3600).toFixed(1)}h
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 p-6 rounded-2xl border border-amber-500/20">
                            <div className="flex items-center gap-3 mb-2 text-amber-400"><Zap size={24} /><span className="text-xs font-bold uppercase tracking-widest">Śr. Stawka (RHR)</span></div>
                            <div className="text-3xl font-black text-white">
                                {(() => {
                                    const doneWithPrice = (ticketsForFinance || filteredTickets).filter(t => t.status === TicketStatus.DONE && Number(t.price) > 0);
                                    const totalDoneRevenue = doneWithPrice.reduce((acc, t) => acc + Number(t.price || 0), 0);
                                    const totalDoneHours = doneWithPrice.reduce((acc, t) => acc + Number(t.total_duration_seconds || 0), 0) / 3600;

                                    if (totalDoneHours > 0) return (totalDoneRevenue / totalDoneHours).toFixed(0);
                                    return "0";
                                })()}
                            </div>
                            <div className="text-[10px] text-amber-500/60 mt-1 uppercase font-bold">PLN / H</div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={onOpenInvoiceGenerator} className="bg-indigo-600 hover:bg-indigo-500">
                            <Copy size={16} className="mr-2" /> Generator Opisu do Faktury
                        </Button>
                    </div>

                    <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><DollarSign size={18} className="text-amber-500" /> Wycena</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase text-slate-500 border-b border-white/10"><tr><th className="py-3 px-4">Klient</th><th className="py-3 px-4">Temat</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Kwota</th></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {(ticketsForFinance || filteredTickets).filter(t => Number(t.price) > 0).map(t => (
                                        <tr key={t.id} onClick={() => onOpenTicketDetail(t)} className="hover:bg-white/5 cursor-pointer">
                                            <td className="py-3 px-4 text-slate-300">{t.clientName}</td>
                                            <td className="py-3 px-4 text-slate-400">{t.subject}</td>
                                            <td className="py-3 px-4"><span className="text-[10px] opacity-70">{statusTranslations[t.status]}</span></td>
                                            <td className="py-3 px-4 text-right text-emerald-500 font-mono">{Number(t.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
