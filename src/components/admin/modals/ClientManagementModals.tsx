"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, TextArea } from '@/components/legacy/UIComponents';
import { User } from '@/types';
import { backend } from '@/services/api';
import { CheckCircle, Send, Users, Settings, Trash2, RefreshCw } from 'lucide-react';

// --- INVITE CLIENT MODAL ---
interface InviteClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteOrganizationId: string | null;
    inviteCompany: string;
    onSuccess?: () => void;
}

export const InviteClientModal: React.FC<InviteClientModalProps> = ({ isOpen, onClose, inviteOrganizationId, inviteCompany: initialCompany, onSuccess }) => {
    const [company, setCompany] = useState(initialCompany || '');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [nip, setNip] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [mailSent, setMailSent] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setCompany(initialCompany || '');
        setName('');
        setEmail('');
        setNip('');
        setPhone('');
        setWebsite('');
        setNotes('');
        setAvatar(null);
        setShowDetails(false);
        setIsSent(false);
        setMailSent(true);
        setSuccessMessage(null);
        setError(null);
    }, [isOpen, initialCompany]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setError(null);
        try {
            const result = await backend.inviteClient(name, email, company, inviteOrganizationId || undefined, {
                nip, phone, website, adminNotes: notes, avatar: avatar || undefined
            });
            setMailSent(result.mailSent !== false);
            setSuccessMessage(result.message || null);
            setIsSent(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Wystąpił nieoczekiwany błąd podczas wysyłania zaproszenia.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={inviteOrganizationId ? `Dodaj Pracownika do ${initialCompany}` : "Zaproś Nowego Klienta"}>
            {isSent ? (
                <div className="text-center py-6">
                    <div className={`w-16 h-16 ${mailSent ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {mailSent ? <CheckCircle size={32} /> : <Send size={32} className="opacity-50" />}
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">
                        {mailSent ? 'Zaproszenie Wysłane!' : 'Klient Utworzony'}
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                        {successMessage || 'Klient został pomyślnie dodany do systemu.'}
                    </p>
                    <Button onClick={() => { onClose(); if (onSuccess) onSuccess(); }}>Zamknij</Button>
                </div>
            ) : (
                <form onSubmit={handleInvite} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm animate-in shake duration-300">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <Input label={inviteOrganizationId ? "Organizacja (Zablokowane)" : "Nazwa Firmy"} value={company} onChange={(e) => setCompany(e.target.value)} required disabled={!!inviteOrganizationId} />
                        <Input label="Osoba Kontaktowa" value={name} onChange={(e) => setName(e.target.value)} required />
                        <Input label="Adres Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    {!inviteOrganizationId && (
                        <div className="pt-4 border-t border-white/10">
                            <button type="button" onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-4 hover:text-white transition-colors">
                                <span>Dane do Wizytówki (Opcjonalne)</span>
                                <Settings size={14} className={showDetails ? 'rotate-180' : ''} />
                            </button>
                            {showDetails && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-center mb-4">
                                        <div className="relative group cursor-pointer">
                                            <input type="file" onChange={e => {
                                                if (e.target.files?.[0]) {
                                                    const reader = new FileReader();
                                                    reader.readAsDataURL(e.target.files[0]);
                                                    reader.onload = () => setAvatar(reader.result as string);
                                                }
                                            }} className="hidden" id="invite-avatar-upload" />
                                            <label htmlFor="invite-avatar-upload" className="block w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 hover:border-accent-red overflow-hidden relative transition-all">
                                                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><Users size={20} /></div>}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">Dodaj</div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="NIP" value={nip} onChange={(e) => setNip(e.target.value)} />
                                        <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </div>
                                    <Input label="Strona WWW" value={website} onChange={(e) => setWebsite(e.target.value)} />
                                    <TextArea label="Notatki Admina" value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-end pt-4 border-t border-white/10">
                        <Button type="submit" isLoading={isSending}><Send size={16} className="mr-2" /> Wyślij Zaproszenie</Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

// --- EDIT CLIENT MODAL ---
interface EditClientModalProps {
    client: User | null;
    onClose: () => void;
    onSave: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onSave }) => {
    const [company, setCompany] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [nip, setNip] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isResetSent, setIsResetSent] = useState(false);

    useEffect(() => {
        if (client) {
            setCompany(client.companyName || '');
            setName(client.name);
            setEmail(client.email);
            setPhone(client.phone || '');
            setNip(client.nip || '');
            setWebsite(client.website || '');
            setNotes(client.adminNotes || '');
            setAvatarPreview(client.avatar || null);
            setIsResetSent(false);
        }
    }, [client]);

    if (!client) return null;

    const handleSave = async () => {
        await backend.updateUserProfile(client.id, { companyName: company, name, phone, nip, website, adminNotes: notes, avatar: avatarPreview });
        onSave();
        onClose();
    };

    return (
        <Modal isOpen={!!client} onClose={onClose} title="Edycja Klienta">
            <div className="space-y-6">
                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer">
                        <input type="file" onChange={e => {
                            if (e.target.files?.[0]) {
                                const reader = new FileReader();
                                reader.readAsDataURL(e.target.files[0]);
                                reader.onload = () => setAvatarPreview(reader.result as string);
                            }
                        }} className="hidden" id="client-avatar-upload" />
                        <label htmlFor="client-avatar-upload" className="block w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 hover:border-accent-red overflow-hidden relative transition-all">
                            {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><Users size={24} /></div>}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold">Zmień</div>
                        </label>
                    </div>
                </div>
                <Input label="Nazwa Firmy" value={company} onChange={e => setCompany(e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Osoba Kontaktowa" value={name} onChange={e => setName(e.target.value)} />
                    <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Telefon" value={phone} onChange={e => setPhone(e.target.value)} />
                    <Input label="NIP" value={nip} onChange={e => setNip(e.target.value)} />
                </div>
                <Input label="Strona WWW" value={website} onChange={e => setWebsite(e.target.value)} />
                <TextArea label="Notatki Admina" value={notes} onChange={e => setNotes(e.target.value)} />
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave}>Zapisz Zmiany</Button>
                </div>
            </div>
        </Modal>
    );
};

// --- CLIENT CARD MODAL ---
interface ClientCardModalProps {
    client: User | null;
    onClose: () => void;
    allClients: User[];
    onEdit: (client: User) => void;
    onDelete: (clientId: string) => void;
}

export const ClientCardModal: React.FC<ClientCardModalProps> = ({ client, onClose, allClients, onEdit, onDelete }) => {
    if (!client) return null;
    const members = allClients.filter(c => c.organizationId === client.organizationId);

    return (
        <Modal isOpen={!!client} onClose={onClose} title="Wizytówka Klienta">
            <div className="space-y-6 text-center py-6">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-800 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-red-500/20">
                    <span className="text-3xl font-black text-white">{client.companyName?.[0] || client.name[0]}</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{client.companyName || 'Brak Firmy'}</h2>
                    <p className="text-slate-400">{client.name}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Email</p>
                        <p className="text-slate-200 break-all">{client.email}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Telefon</p>
                        <p className="text-slate-200">{client.phone || '-'}</p>
                    </div>
                </div>
                {client.organizationId && (
                    <div className="text-left pt-6 border-t border-white/10 mt-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Users size={16} /> Pracownicy ({members.length})</h3>
                        <div className="space-y-2">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                                    <span className="text-sm text-white font-bold">{member.name}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { onClose(); onEdit(member); }} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"><Settings size={14} /></button>
                                        <button onClick={() => { if (confirm(`Usunąć ${member.name}?`)) onDelete(member.id); }} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <Button variant="secondary" onClick={onClose} className="w-full justify-center mt-6">Zamknij</Button>
            </div>
        </Modal>
    );
};
