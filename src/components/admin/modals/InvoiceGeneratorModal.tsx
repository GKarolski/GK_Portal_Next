"use client";

import React, { useState } from 'react';
import { Ticket } from '@/types';
import { X, Copy, Check } from 'lucide-react';

interface InvoiceGeneratorModalProps {
    tickets: Ticket[];
    isOpen: boolean;
    onClose: () => void;
}

export const InvoiceGeneratorModal: React.FC<InvoiceGeneratorModalProps> = ({ tickets, isOpen, onClose }) => {
    const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>(
        tickets.map(t => t.id)
    );
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const toggleTicket = (id: string) => {
        setSelectedTicketIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const selectedTickets = tickets.filter(t => selectedTicketIds.includes(t.id));
    const totalAmount = selectedTickets.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

    const generateText = () => {
        let text = "Wykonano:\n";
        selectedTickets.forEach(t => {
            text += `\t- ${t.subject} -> ${t.price || 0} zł\n`;
        });
        text += `____________________\n`;
        text += `Suma_Zadań_Wykonanych -> ${totalAmount} zł`;
        return text;
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generateText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Generator Opisu do Faktury</h2>
                        <p className="text-sm text-slate-400 mt-1">Wybierz zadania do rozliczenia</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="text-slate-400 hover:text-white" size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
                        <div className="text-indigo-200 text-sm font-medium">Łączna kwota wybranych:</div>
                        <div className="text-4xl font-bold text-white tracking-tighter">
                            {totalAmount} <span className="text-lg text-indigo-400 font-normal">PLN</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {tickets.map(ticket => (
                            <label
                                key={ticket.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedTicketIds.includes(ticket.id)
                                    ? 'bg-indigo-500/10 border-indigo-500/50'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTicketIds.includes(ticket.id)}
                                    onChange={() => toggleTicket(ticket.id)}
                                    className="w-5 h-5 rounded border-white/10 bg-black text-accent-red focus:ring-accent-red"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className={`font-bold truncate ${selectedTicketIds.includes(ticket.id) ? 'text-white' : 'text-slate-400'}`}>
                                        {ticket.subject}
                                    </div>
                                    <div className="text-xs text-slate-500">{ticket.clientName}</div>
                                </div>
                                <div className="font-mono text-slate-300 whitespace-nowrap">
                                    {ticket.price || 0} zł
                                </div>
                            </label>
                        ))}
                    </div>

                    <div>
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 px-1">Podgląd tekstu</div>
                        <pre className="bg-black/40 p-4 rounded-2xl text-xs text-slate-400 font-mono overflow-x-auto border border-white/5 whitespace-pre-wrap">
                            {generateText()}
                        </pre>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                    <Button
                        onClick={handleCopy}
                        className="bg-indigo-600 hover:bg-indigo-500"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Skopiowano!' : 'Kopiuj Treść'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
