"use client";

import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketCategory, TicketPriority, DeviceType, MarketingPlatform, Subtask, BillingType, WorkSession, Attachment, Folder } from '@/types';
import { Button, Input, Select, TextArea, Modal, ImageViewer } from '@/components/legacy/UIComponents';
import { Bug, Megaphone, Zap, ArrowLeft, CheckCircle, Square, Eye, EyeOff, Trash2, Paperclip, X, Clock, CircleStop, Edit2, ExternalLink, LayoutGrid, Folder as FolderIcon, Plus, CheckCircle2 } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { backend } from '@/services/api';

interface TicketFormProps {
    mode: 'create' | 'edit';
    initialData?: Ticket | null;
    users: User[];
    clients: User[];
    defaultClientId?: string;
    onClose: () => void;
    onSubmit: (payload: any, clientId: string) => Promise<void>;
    onDelete?: (ticketId: string) => Promise<void>;
    folders?: Folder[];
    initialFolderId?: string;
}

const WizardSelectionCard = ({ icon: Icon, title, desc, active, onClick }: any) => (
    <div onClick={onClick} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center h-32 ${active ? 'border-accent-red bg-accent-red/10 text-white' : 'border-white/10 hover:border-white/30 text-slate-400 hover:text-white'}`}>
        <Icon size={28} />
        <div>
            <div className="font-bold">{title}</div>
            <div className="text-xs opacity-70 uppercase tracking-widest">{desc}</div>
        </div>
    </div>
);

export const TicketForm: React.FC<TicketFormProps> = ({ mode, initialData, clients, defaultClientId, onClose, onSubmit, onDelete, folders = [], initialFolderId }) => {
    const [wizardStep, setWizardStep] = useState(mode === 'create' ? 1 : 2);
    const [category, setCategory] = useState<TicketCategory | null>(initialData?.category || null);
    const [clientId, setClientId] = useState<string>(initialData?.clientId || defaultClientId || (clients[0]?.id || ''));
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [desc, setDesc] = useState(initialData?.description || '');
    const [priority, setPriority] = useState<TicketPriority>(initialData?.priority || TicketPriority.NORMAL);
    const [folderId, setFolderId] = useState<string | undefined>(initialData?.folder_id || initialFolderId);

    const [url, setUrl] = useState(initialData?.url || '');
    const [featureLink, setFeatureLink] = useState(initialData?.url || '');
    const [device, setDevice] = useState<DeviceType>(initialData?.device_type || DeviceType.DESKTOP);
    const [platform, setPlatform] = useState<MarketingPlatform>(initialData?.platform || MarketingPlatform.META);
    const [budget, setBudget] = useState(initialData?.budget || '');
    const [errorDate, setErrorDate] = useState(initialData?.error_date || '');

    const [price, setPrice] = useState(initialData?.price?.toString() || '');
    const [billingType, setBillingType] = useState<BillingType>(initialData?.billing_type || BillingType.FIXED);
    const [startDate, setStartDate] = useState(initialData?.admin_start_date?.slice(0, 10) || '');
    const [deadline, setDeadline] = useState(initialData?.admin_deadline?.slice(0, 10) || '');
    const [internalNotes, setInternalNotes] = useState(initialData?.internal_notes || '');
    const [publicNotes, setPublicNotes] = useState(initialData?.public_notes || '');
    const [status, setStatus] = useState<any>(initialData?.status || 'REVIEW');

    const [files, setFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [subtasks, setSubtasks] = useState<Subtask[]>(initialData?.subtasks || []);
    const [newSubtaskInput, setNewSubtaskInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);

    const { startTimer, stopTimer, activeTicketId, elapsedSeconds } = useTimer();

    useEffect(() => {
        if (initialData?.id) {
            backend.getWorkSessions(initialData.id).then(setWorkSessions).catch(console.error);
        }
    }, [initialData?.id]);

    const handleSubtaskAdd = () => {
        if (!newSubtaskInput.trim()) return;
        setSubtasks(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), title: newSubtaskInput.trim(), isVisibleToClient: true, isCompleted: false }]);
        setNewSubtaskInput('');
    };

    const handleSubtaskDelete = (id: string) => setSubtasks(prev => prev.filter(s => s.id !== id));
    const handleSubtaskToggle = (id: string, field: 'isCompleted' | 'isVisibleToClient') => setSubtasks(prev => prev.map(s => s.id === id ? { ...s, [field]: !s[field] } : s));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const finalUrl = category === TicketCategory.BUG ? url : (category === TicketCategory.FEATURE ? featureLink : undefined);
            const payload = {
                category,
                subject,
                description: desc,
                priority,
                status,
                price: parseFloat(price) || 0,
                billingType,
                adminStartDate: startDate,
                adminDeadline: deadline,
                internalNotes,
                publicNotes,
                subtasks,
                attachments,
                url: finalUrl,
                deviceType: device,
                errorDate,
                platform,
                budget,
                folderId
            };
            await onSubmit(payload, clientId);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (wizardStep === 1) {
        return (
            <div className="pt-4">
                <div className="mb-6">
                    <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Dla Klienta</label>
                    <div className="flex gap-2 flex-wrap">
                        {clients.map(c => (
                            <button key={c.id} type="button" onClick={() => setClientId(c.id)} className={`px-4 py-2 rounded-xl text-sm border transition-colors ${clientId === c.id ? 'border-accent-red bg-accent-red/10 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}>{c.companyName || c.name}</button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <WizardSelectionCard icon={Bug} title="Błąd" desc="Naprawa" active={category === TicketCategory.BUG} onClick={() => setCategory(TicketCategory.BUG)} />
                    <WizardSelectionCard icon={Megaphone} title="Marketing" desc="Reklamy" active={category === TicketCategory.MARKETING} onClick={() => setCategory(TicketCategory.MARKETING)} />
                    <WizardSelectionCard icon={Zap} title="Modyfikacja" desc="Nowa funkcja" active={category === TicketCategory.FEATURE} onClick={() => setCategory(TicketCategory.FEATURE)} />
                    <div className="md:col-span-3 flex justify-end mt-4">
                        <Button disabled={!category || !clientId} onClick={() => setWizardStep(2)}>Dalej</Button>
                    </div>
                </div>
            </div>
        );
    }

    const isThisActive = activeTicketId === initialData?.id;
    const historySeconds = workSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const totalSeconds = historySeconds + (isThisActive ? elapsedSeconds : 0);
    const totalHours = totalSeconds / 3600;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {mode === 'create' && <button type="button" onClick={() => setWizardStep(1)} className="text-slate-500 hover:text-white text-sm flex items-center gap-1"><ArrowLeft size={14} /> Kategoria</button>}
                    <span className="flex items-center gap-2 font-bold text-accent-red uppercase tracking-wider text-[10px] border border-accent-red/20 bg-accent-red/5 px-2 py-1 rounded">
                        {category}
                    </span>
                </div>
                {mode === 'edit' && initialData && (
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Czas</p>
                            <p className="text-sm font-mono font-bold text-white">{totalHours.toFixed(2)}h</p>
                        </div>
                        <button type="button" onClick={() => isThisActive ? stopTimer() : startTimer(initialData.id)} className={`h-10 px-4 rounded-xl flex items-center gap-2 font-bold text-xs transition-all ${isThisActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                            {isThisActive ? <CircleStop size={14} /> : <Clock size={14} />} {isThisActive ? 'STOP' : 'START'}
                        </button>
                    </div>
                )}
            </div>

            <Input label="Temat" value={subject} onChange={e => setSubject(e.target.value)} required />

            <div className="grid grid-cols-2 gap-4">
                <Select label="Priorytet" value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} options={[{ value: TicketPriority.LOW, label: 'Niski' }, { value: TicketPriority.NORMAL, label: 'Normalny' }, { value: TicketPriority.HIGH, label: 'Wysoki' }, { value: TicketPriority.URGENT, label: 'PILNY' }]} />
                <Select label="Folder" value={folderId || ''} onChange={e => setFolderId(e.target.value)} options={[{ value: '', label: 'Inbox' }, ...folders.map(f => ({ value: f.id, label: f.name }))]} />
            </div>

            <TextArea label="Opis" value={desc} onChange={e => setDesc(e.target.value)} rows={4} required />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Select label="Rozliczenie" value={billingType} onChange={e => setBillingType(e.target.value as BillingType)} options={[{ value: BillingType.FIXED, label: 'Fixed' }, { value: BillingType.HOURLY, label: 'Hourly' }]} />
                <Input type="number" label="Cena (PLN)" value={price} onChange={e => setPrice(e.target.value)} />
                <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} options={[{ value: 'REVIEW', label: 'Weryfikacja' }, { value: 'PENDING', label: 'Do zrobienia' }, { value: 'IN_PROGRESS', label: 'W trakcie' }, { value: 'DONE', label: 'Zakończone' }]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Input type="date" label="Początek" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <Input type="date" label="Deadline" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div className="space-y-4">
                <TextArea label="Notatki Admina (Prywatne)" value={internalNotes} onChange={e => setInternalNotes(e.target.value)} />
                <TextArea label="Notatki dla Klienta (Publiczne)" value={publicNotes} onChange={e => setPublicNotes(e.target.value)} className="border-accent-red/30" />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase">Podzadania</label>
                    <div className="flex gap-2 flex-1 ml-4">
                        <input value={newSubtaskInput} onChange={e => setNewSubtaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSubtaskAdd())} placeholder="Dodaj podzadanie..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 h-10 text-sm" />
                        <Button type="button" onClick={handleSubtaskAdd} className="h-10 w-10 p-0"><Plus size={18} /></Button>
                    </div>
                </div>
                {subtasks.length > 0 && (
                    <div className="bg-black/20 rounded-2xl border border-white/5 divide-y divide-white/5">
                        {subtasks.map(sub => (
                            <div key={sub.id} className="p-3 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => handleSubtaskToggle(sub.id, 'isCompleted')}>{sub.isCompleted ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Square size={18} className="text-slate-500" />}</button>
                                    <span className={sub.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}>{sub.title}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => handleSubtaskToggle(sub.id, 'isVisibleToClient')} className={sub.isVisibleToClient ? 'text-blue-400' : 'text-slate-600'}>{sub.isVisibleToClient ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                                    <button type="button" onClick={() => handleSubtaskDelete(sub.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-6 border-t border-white/5">
                {mode === 'edit' && onDelete && initialData && <Button type="button" variant="danger" onClick={() => onDelete(initialData.id)}><Trash2 size={16} /> Usuń</Button>}
                <div className="flex gap-3 ml-auto">
                    <Button type="button" variant="secondary" onClick={onClose}>Anuluj</Button>
                    <Button type="submit" isLoading={isSubmitting}>Zapisz Zmiany</Button>
                </div>
            </div>

            {previewImage && <ImageViewer src={previewImage} onClose={() => setPreviewImage(null)} />}
        </form>
    );
};
