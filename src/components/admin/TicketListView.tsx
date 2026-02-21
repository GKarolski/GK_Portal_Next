"use client";

import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, Folder, User } from '@/types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge, StatusBadge, PriorityBadge, CategoryBadge } from '../ui/Badge';
import {
    Bug, Megaphone, Zap, AlertCircle, LayoutList, LayoutGrid,
    ChevronDown, ChevronUp, Clock, Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const renderIconOnly = (category: string) => {
        if (category === TicketCategory.BUG) return <Bug size={14} className="text-red-400" />;
        if (category === TicketCategory.MARKETING) return <Megaphone size={14} className="text-blue-400" />;
        if (category === TicketCategory.FEATURE) return <Zap size={14} className="text-yellow-400" />;
        return <AlertCircle size={14} className="text-slate-600" />;
    };

    if (viewMode === 'list') {
        const statusesToCheck = [TicketStatus.REVIEW, TicketStatus.PENDING, TicketStatus.IN_PROGRESS, TicketStatus.DONE];
        const activeStatuses = statusesToCheck.filter(s => filteredTickets.some(t => t.status === s));

        if (activeStatuses.length === 0) {
            return <div className="text-slate-500 text-center mt-10">Brak zgłoszeń.</div>;
        }

        return (
            <div className="flex flex-col h-full overflow-hidden space-y-6 pb-6 p-4 md:p-8">
                {activeStatuses.map(status => {
                    const groupTickets = filteredTickets.filter(t => t.status === status);
                    const isExpanded = expandedStatus === status;
                    const isHidden = expandedStatus && !isExpanded;

                    if (isHidden) return null;

                    return (
                        <div
                            key={status}
                            className={cn(
                                "bg-white/5 rounded-2xl border border-white/5 flex flex-col transition-all duration-300",
                                isExpanded ? "h-full" : "flex-1 min-h-[60px]"
                            )}
                        >
                            <div
                                className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between rounded-t-2xl cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() => setExpandedStatus(isExpanded ? null : status)}
                            >
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", status === TicketStatus.DONE ? "bg-accent-success" : "bg-blue-500")} />
                                    {statusTranslations[status]}
                                    {isExpanded && <span className="text-[9px] bg-accent-red/20 text-accent-red px-2 py-0.5 rounded ml-2 uppercase">Rozwinięte</span>}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-slate-500">{groupTickets.length}</span>
                                    {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5 bg-black/20">
                                {groupTickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => onOpenTicketDetail(ticket)}
                                        className="px-6 py-4 grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_120px_160px] items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="text-slate-600 transition-colors group-hover:text-slate-400">{renderIconOnly(ticket.category)}</div>

                                        <div className="min-w-0 overflow-hidden">
                                            <div className="font-semibold text-sm text-slate-200 truncate pr-4">{ticket.subject}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                                <span className="text-slate-400 font-medium">{ticket.clientName}</span>
                                                {ticket.price && Number(ticket.price) > 0 && <span className="text-slate-500 border border-white/10 px-1.5 py-0.5 rounded bg-white/5">{ticket.price} PLN</span>}
                                                <div className="md:hidden flex items-center gap-2 ml-2">
                                                    <PriorityBadge priority={ticket.priority} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex justify-center">
                                            <PriorityBadge priority={ticket.priority} />
                                        </div>

                                        <div className="flex justify-end min-w-[140px]" onClick={e => e.stopPropagation()}>
                                            {isAdmin ? (
                                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                                    <StatusBadge status={ticket.status} />
                                                </div>
                                            ) : (
                                                <StatusBadge status={ticket.status} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (viewMode === 'board') {
        const statusesToCheck = [TicketStatus.REVIEW, TicketStatus.PENDING, TicketStatus.IN_PROGRESS, TicketStatus.DONE];

        return (
            <div className="flex gap-6 h-full pb-6 overflow-x-auto snap-x snap-mandatory px-4 md:px-8 pt-6">
                {statusesToCheck.map(status => {
                    const colTickets = filteredTickets.filter(t => t.status === status);

                    return (
                        <div
                            key={status}
                            className="min-w-[85vw] md:min-w-[320px] md:flex-1 bg-white/5 rounded-2xl flex flex-col h-full border border-white/5 snap-center transition-colors"
                        >
                            <div className="p-4 border-b border-white/5 font-bold text-[10px] uppercase text-slate-400 flex justify-between items-center bg-white/5 rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full", status === TicketStatus.DONE ? "bg-accent-success" : "bg-blue-500")} />
                                    {statusTranslations[status]}
                                </div>
                                <span className="bg-black/30 px-2 py-0.5 rounded text-slate-500">{colTickets.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                {colTickets.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => onOpenTicketDetail(t)}
                                        className="bg-black/20 p-4 rounded-2xl border border-white/5 cursor-pointer hover:border-accent-red/40 transition-all group hover:bg-white/5 hover:shadow-lg"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <CategoryBadge category={t.category} />
                                            <PriorityBadge priority={t.priority} />
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors mb-3 leading-snug">{t.subject}</h4>
                                        <div className="text-[10px] text-slate-500 flex justify-between items-center pt-2 border-t border-white/5">
                                            <span className="truncate max-w-[120px]">{t.clientName}</span>
                                            {t.price && Number(t.price) > 0 && <span className="text-accent-success font-mono bg-accent-success/10 px-1.5 py-0.5 rounded">{t.price} PLN</span>}
                                        </div>
                                    </div>
                                ))}
                                {colTickets.length === 0 && (
                                    <div className="h-24 flex items-center justify-center text-slate-700 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                                        Pusto
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="p-8 text-center text-slate-500">
            Ten widok ({viewMode}) zostanie zaimplementowany w krótce.
        </div>
    );
};
