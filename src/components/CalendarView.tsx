"use client";

import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus } from '@/types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, Zap, Bug, Megaphone } from 'lucide-react';

interface CalendarViewProps {
    tickets: Ticket[];
    onUpdateTicket: (ticketId: string, field: string, value: any) => Promise<void>;
    onOpenTicket: (ticket: Ticket) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export const CalendarView: React.FC<CalendarViewProps> = ({ tickets, onUpdateTicket, onOpenTicket }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const getStatusColor = (status: string) => {
        if (status === 'DONE') return '#10b981';
        if (status === 'IN_PROGRESS') return '#3b82f6';
        return '#64748b';
    };

    const prev = () => {
        const next = new Date(currentDate);
        if (viewMode === 'day') next.setDate(next.getDate() - 1);
        else if (viewMode === 'week') next.setDate(next.getDate() - 7);
        else next.setMonth(next.getMonth() - 1);
        setCurrentDate(next);
    };

    const next = () => {
        const next = new Date(currentDate);
        if (viewMode === 'day') next.setDate(next.getDate() + 1);
        else if (viewMode === 'week') next.setDate(next.getDate() + 7);
        else next.setMonth(next.getMonth() + 1);
        setCurrentDate(next);
    };

    const today = () => setCurrentDate(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const days = [];

        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, lastDayOfPrevMonth - i),
                isPadding: true
            });
        }

        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDayOfMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isPadding: false
            });
        }

        const totalSlots = 42;
        const remaining = totalSlots - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isPadding: true
            });
        }

        return days;
    }, [currentDate]);

    const weekDays = useMemo(() => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentDate]);

    const handleDragStart = (e: React.DragEvent, ticketId: string) => {
        e.dataTransfer.setData('ticketId', ticketId);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.4';
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    };

    const handleDrop = async (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('ticketId');
        if (!ticketId) return;

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        await onUpdateTicket(ticketId, 'admin_start_date', dateStr);
    };

    const allowDrop = (e: React.DragEvent) => e.preventDefault();

    return (
        <div className="flex flex-col h-full bg-gk-950 overflow-hidden">
            <div className="pb-4 border-b border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CalendarIcon className="text-gk-blue-400" size={24} />
                        <span className="capitalize text-white">
                            {currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
                        </span>
                    </h2>
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                        <button onClick={prev} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"><ChevronLeft size={20} /></button>
                        <button onClick={today} className="px-3 py-1 text-xs font-medium hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">Dziś</button>
                        <button onClick={next} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    {(['day', 'week', 'month'] as ViewMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => setViewMode(m)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${viewMode === m ? 'bg-gk-blue-400 text-white shadow-lg shadow-gk-blue-400/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            {m === 'day' ? 'Dzień' : m === 'week' ? 'Tydzień' : 'Miesiąc'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto pt-4 px-4 pb-6 custom-scrollbar">
                {viewMode === 'month' && (
                    <div className="flex flex-col flex-1 bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl min-h-0 h-full">
                        <div className="grid grid-cols-7 border-b border-white/5 shrink-0">
                            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(d => (
                                <div key={d} className="p-2 bg-gk-900 text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest">{d}</div>
                            ))}
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            {(() => {
                                const weeks: { date: Date; isPadding: boolean; }[][] = [];
                                let currentWeek: { date: Date; isPadding: boolean; }[] = [];
                                daysInMonth.forEach((day) => {
                                    currentWeek.push(day);
                                    if (currentWeek.length === 7) {
                                        weeks.push(currentWeek);
                                        currentWeek = [];
                                    }
                                });
                                if (currentWeek.length > 0) weeks.push(currentWeek);

                                return weeks.map((week, wIndex) => (
                                    <div key={wIndex} className="flex-1 grid grid-cols-7 border-b last:border-b-0 border-white/5 min-h-0">
                                        {week.map((day, dIndex) => {
                                            const y = day.date.getFullYear();
                                            const m = String(day.date.getMonth() + 1).padStart(2, '0');
                                            const d = String(day.date.getDate()).padStart(2, '0');
                                            const dateStr = `${y}-${m}-${d}`;

                                            const dayTickets = tickets.filter(t => t.admin_start_date && t.admin_start_date.slice(0, 10) === dateStr);
                                            const isToday = new Date().toDateString() === day.date.toDateString();

                                            return (
                                                <div
                                                    key={dIndex}
                                                    onDragOver={allowDrop}
                                                    onDrop={(e) => handleDrop(e, day.date)}
                                                    className={`p-1 flex flex-col gap-1 transition-colors border-r last:border-r-0 border-white/5 group hover:bg-white/5 min-h-0 ${day.isPadding ? 'opacity-20 bg-black/20' : ''}`}
                                                >
                                                    <div className={`text-[10px] font-mono mb-0.5 flex justify-between items-center shrink-0 ${isToday ? 'text-gk-blue-400 font-bold' : 'text-slate-500'}`}>
                                                        <span>{day.date.getDate()}</span>
                                                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-gk-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>}
                                                    </div>
                                                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar invisible-scrollbar min-h-0">
                                                        {dayTickets.map(t => (
                                                            <div
                                                                key={t.id}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, t.id)}
                                                                onDragEnd={handleDragEnd}
                                                                onClick={() => onOpenTicket(t)}
                                                                className="p-1 px-1.5 rounded text-[9px] font-medium border border-white/5 flex items-center justify-between gap-1 cursor-pointer hover:border-white/20 transition-all bg-gk-900 relative group/item shrink-0"
                                                                style={{ borderLeft: `2px solid ${getStatusColor(t.status)}` }}
                                                            >
                                                                <span className="truncate text-slate-300 flex-1 leading-tight">{t.subject}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                )}
                {/* Simplified week/day views for now to stay focused on high-level restoration */}
            </div>
        </div>
    );
};
