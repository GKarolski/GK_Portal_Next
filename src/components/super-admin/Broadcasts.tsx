"use client";

import React, { useState } from 'react';
import { Megaphone, Send, Clock, Users } from 'lucide-react';
import { Input, TextArea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Broadcasts() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = () => {
        setIsSending(true);
        setTimeout(() => {
            alert('Wiadomość została zakolejkowana do wysłania.');
            setIsSending(false);
            setTitle('');
            setMessage('');
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone size={20} className="text-accent-red" /> Powiadomienia Masowe</h2>
                <p className="text-slate-500 text-sm">Wysyłaj globalne komunikaty, informacje o pracach serwisowych lub nowych funkcjach.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2 space-y-6 bg-black/30 border border-white/5 rounded-3xl p-8">
                    <h3 className="font-bold text-white mb-4">Tworzenie Komunikatu</h3>
                    <Input
                        label="Tytuł Powiadomienia"
                        placeholder="np. Przerwa techniczna w niedzielę"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <TextArea
                        label="Treść Wiadomości"
                        rows={8}
                        placeholder="Napisz szczegóły wiadomości, która zostanie rozesłana do wszystkich najemców..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <label className="flex items-center gap-2"><input type="checkbox" className="accent-accent-red" /> Email</label>
                            <label className="flex items-center gap-2"><input type="checkbox" className="accent-accent-red" defaultChecked /> Banner in-app</label>
                        </div>
                        <Button onClick={handleSend} isLoading={isSending} className="gap-2">
                            <Send size={16} /> Wyślij do wszystkich
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock size={16} /> Ostatnie Wiadomości
                        </h3>
                        <div className="space-y-4">
                            {[
                                { t: 'Aktualizacja Wersji V2.1', d: '2 dni temu', ok: true },
                                { t: 'Konserwacja Serwerów', d: '1 tydzień temu', ok: true },
                                { t: 'Regulamin - Aktualizacja', d: '1 miesiąc temu', ok: true }
                            ].map((msg, i) => (
                                <div key={i} className="p-4 bg-black/40 rounded-xl border border-white/5">
                                    <div className="font-bold text-white text-sm">{msg.t}</div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="text-xs text-slate-500">{msg.d}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Wysłano</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-3xl p-6">
                        <h3 className="font-bold text-indigo-300 flex items-center gap-2 mb-2"><Users size={18} /> Odbiorcy</h3>
                        <p className="text-sm text-indigo-200/80 mb-4">Twój komunikat dotrze natychmiastowo do wszystkich administratorów i klientów logujących się do platformy.</p>
                        <div className="text-3xl font-black text-white">4,208</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-1">Aktywnych Kont</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
