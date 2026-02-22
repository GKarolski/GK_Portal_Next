"use client";

import React, { useState, useMemo } from 'react';
import { Ticket, User, TicketStatus } from '@/types';
import { AlertCircle, Clock, TrendingUp, Users, Activity, ArrowRight, BarChart3 } from 'lucide-react';
import { StickyNotesWidget } from '@/components/admin/StickyNotesWidget';

interface AdminDashboardOverviewProps {
    tickets: Ticket[];
    clients: User[];
    onNavigateToClient: (clientId: string) => void;
    onOpenTicket: (ticket: Ticket) => void;
}

const MONTH_LABELS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ tickets, clients, onNavigateToClient, onOpenTicket }) => {

    // Calculate Stats
    const openTickets = tickets.filter(t => t.status !== TicketStatus.DONE);
    const urgentTickets = openTickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');
    const doneTickets = tickets.filter(t => t.status === TicketStatus.DONE);

    // --- REAL REVENUE CALCULATION ---
    const doneWithPrice = doneTickets.filter(t => Number(t.price || 0) > 0);
    const hasRealData = doneWithPrice.length > 0;

    // Monthly revenue from real ticket data
    const monthlyRevenue = useMemo(() => {
        const now = new Date();

        const generateMonths = (count: number) => {
            const result: { key: string; label: string; revenue: number }[] = [];
            for (let i = count - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                result.push({ key, label: MONTH_LABELS[d.getMonth()], revenue: 0 });
            }
            return result;
        };

        return (period: number) => {
            const months = generateMonths(period);

            if (!hasRealData) return months;

            doneWithPrice.forEach(ticket => {
                const ticketDate = ticket.billingMonth
                    || ticket.billing_month
                    || new Date(ticket.created_at).toISOString().substring(0, 7);

                const month = months.find(m => m.key === ticketDate);
                if (month) {
                    month.revenue += Number(ticket.price || 0);
                }
            });

            return months;
        };
    }, [doneWithPrice, hasRealData]);

    // Current month real revenue for KPI card
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthRevenue = doneWithPrice
        .filter(t => {
            const ticketDate = t.billingMonth || t.billing_month || new Date(t.created_at).toISOString().substring(0, 7);
            return ticketDate === currentMonthKey;
        })
        .reduce((acc, t) => acc + Number(t.price || 0), 0);

    // Recent Activity (Last 20 ACTIVE tickets)
    const recentActivity = [...tickets]
        .filter(t => t.status !== TicketStatus.DONE)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

    // Client Stats
    const clientStats = clients.map(client => {
        const clientTickets = openTickets.filter(t => t.organizationId === client.organizationId);
        const hasUrgent = clientTickets.some(t => t.priority === 'URGENT');
        return { client, count: clientTickets.length, hasUrgent };
    }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    // Revenue Chart Logic
    const [chartPeriod, setChartPeriod] = useState<'3M' | '6M' | '1Y'>('6M');
    const periodMap = { '3M': 3, '6M': 6, '1Y': 12 };
    const currentData = monthlyRevenue(periodMap[chartPeriod]);
    const totalRevenue = currentData.reduce((acc, m) => acc + m.revenue, 0);
    const maxRevenue = Math.max(...currentData.map(m => m.revenue), 1);

    // Demo data for frosted glass state
    const demoData: Record<string, number[]> = { '3M': [60, 55, 75], '6M': [35, 45, 30, 60, 55, 75], '1Y': [40, 35, 50, 45, 60, 55, 35, 45, 30, 60, 55, 75] };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Critical Tickets */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Krytyczne</div>
                            <div className={`text-3xl font-bold mt-1 ${urgentTickets.length > 0 ? 'text-red-500' : 'text-white'}`}>{urgentTickets.length}</div>
                        </div>
                        <div className={`p-2 rounded-lg ${urgentTickets.length > 0 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/10 text-slate-400'}`}>
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">Wymagają natychmiastowej uwagi</div>
                </div>

                {/* Open Tickets */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Otwarte Zgłoszenia</div>
                            <div className="text-3xl font-bold mt-1 text-white">{openTickets.length}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">Wszystkie aktywne zadania</div>
                </div>

                {/* Clients Active */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Aktywni Klienci</div>
                            <div className="text-3xl font-bold mt-1 text-white">{clientStats.length}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">Firmy z otwartymi zgłoszeniami</div>
                </div>

                {/* Revenue KPI — Real Data */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Przychód (Msc)</div>
                            <div className="text-3xl font-bold mt-1 text-emerald-400">
                                {hasRealData ? `${currentMonthRevenue.toLocaleString('pl-PL')} PLN` : '0,00 PLN'}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        {hasRealData ? 'Na podstawie zamkniętych zgłoszeń z ceną' : 'Uzupełnij ceny w zgłoszeniach'}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-340px)] min-h-[500px] mb-6">

                {/* LEFT COLUMN: Recent Activity */}
                <div className="space-y-4 flex flex-col h-full min-h-0">
                    <div className="flex justify-between items-center px-1 h-8 shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity size={18} className="text-gk-blue-400" />
                            Ostatnia Aktywność
                        </h3>
                    </div>
                    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {recentActivity.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Brak otwartych zadań w ostatnim czasie.</div>
                        ) : (
                            <div>
                                {recentActivity.map((ticket) => {
                                    const client = clients.find(c => c.organizationId === ticket.organizationId);
                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => onOpenTicket(ticket)}
                                            className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between group gap-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white truncate mb-1">{ticket.subject}</div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="text-slate-400 font-medium">{client?.companyName || 'Nieznany Klient'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {ticket.priority === 'URGENT' && (
                                                    <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-bold tracking-wider animate-pulse">PILNE</span>
                                                )}
                                                {ticket.priority === 'HIGH' && (
                                                    <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold tracking-wider">WYSOKI</span>
                                                )}
                                                <ArrowRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Chart + Widgets */}
                <div className="space-y-6 flex flex-col h-full min-h-0 overflow-hidden">

                    {/* Revenue Chart Widget */}
                    <div className="flex flex-col gap-3 h-[300px] min-h-[300px] shrink-0">
                        <div className="flex justify-between items-center px-1 h-8 shrink-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-400" />
                                Przychody
                            </h3>
                            <div className="flex bg-black/20 rounded-lg p-1 gap-1">
                                <button onClick={() => setChartPeriod('3M')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${chartPeriod === '3M' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white'}`}>3M</button>
                                <button onClick={() => setChartPeriod('6M')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${chartPeriod === '6M' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white'}`}>6M</button>
                                <button onClick={() => setChartPeriod('1Y')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${chartPeriod === '1Y' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white'}`}>1R</button>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl border border-white/5 p-6 flex flex-col justify-between relative group flex-1 min-h-0 overflow-hidden">

                            {/* === REAL DATA MODE === */}
                            {hasRealData && (
                                <>
                                    <div>
                                        <div className="text-3xl font-bold text-emerald-400">{totalRevenue.toLocaleString('pl-PL')} PLN</div>
                                        <div className="text-xs text-slate-500">Suma z wybranego okresu ({doneWithPrice.length} zgłoszeń z ceną)</div>
                                    </div>
                                    <div className="flex-1 flex items-end justify-between gap-2 overflow-hidden mt-4 min-h-0">
                                        {currentData.map((m, i) => {
                                            const barHeight = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                                            return (
                                                <div key={m.key} className="flex-1 flex flex-col justify-end group/bar h-full">
                                                    <div
                                                        className="w-full bg-emerald-500/20 rounded-t-lg relative group-hover/bar:bg-emerald-500/30 transition-all cursor-pointer"
                                                        style={{ height: `${Math.max(barHeight, 2)}%` }}
                                                    >
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-emerald-300 opacity-0 group-hover/bar:opacity-100 transition-opacity font-bold bg-black/80 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap z-10">
                                                            {m.revenue.toLocaleString('pl-PL')} PLN
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-600 text-center mt-2 uppercase font-bold">{m.label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* === FROSTED GLASS MODE (no real data) === */}
                            {!hasRealData && (
                                <>
                                    {/* Demo chart behind frosted glass */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="text-3xl font-bold text-emerald-400/30">12 450 PLN</div>
                                            <div className="text-xs text-slate-500/30">Przykładowe dane</div>
                                        </div>
                                        <div className="flex-1 flex items-end justify-between gap-2 mt-4">
                                            {demoData[chartPeriod].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                                                    <div className="w-full bg-emerald-500/15 rounded-t-lg" style={{ height: `${h}%` }}></div>
                                                    <div className="text-[10px] text-slate-600/40 text-center mt-2 uppercase font-bold">{MONTH_LABELS[i % 12]}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Frosted glass overlay */}
                                    <div className="absolute inset-0 backdrop-blur-md z-10 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                            <BarChart3 size={24} className="text-emerald-500/60" />
                                        </div>
                                        <h4 className="text-white font-bold text-base mb-2">Dane są zbierane</h4>
                                        <p className="text-slate-400 text-xs leading-relaxed max-w-[280px]">
                                            Wykres pojawi się automatycznie, gdy dodasz cenę do pierwszego zamkniętego zgłoszenia.
                                        </p>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse"></div>
                                            Oczekiwanie na dane
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Notes & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
                        <div className="h-full min-h-0 flex flex-col overflow-hidden">
                            <StickyNotesWidget />
                        </div>

                        {/* Client Status */}
                        <div className="h-full min-h-0 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center px-1 h-8 shrink-0 mb-3">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Users size={18} className="text-purple-400" />
                                    Status Klientów
                                </h3>
                            </div>
                            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden p-4 space-y-3 flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {clientStats.length === 0 ? (
                                    <div className="text-center text-slate-500 py-4">Brak aktywnych zgłoszeń u klientów.</div>
                                ) : (
                                    clientStats.map((stat) => (
                                        <div
                                            key={stat.client.id}
                                            onClick={() => onNavigateToClient(stat.client.organizationId || stat.client.id)}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-white/10 flex-shrink-0">
                                                    {stat.client.companyName?.[0]}
                                                </div>
                                                <div className="truncate text-sm font-medium text-slate-300">{stat.client.companyName}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {stat.hasUrgent && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Pilne zgłoszenia" />}
                                                <div className="bg-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-400 min-w-[24px] text-center">
                                                    {stat.count}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
