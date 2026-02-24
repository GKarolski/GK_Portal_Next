"use client";

import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketCategory, TicketPriority, DeviceType, MarketingPlatform, Subtask, BillingType, WorkSession, Attachment, Folder } from '@/types';
import { Button, Input, Select, TextArea, Modal, ImageViewer } from '@/components/legacy/UIComponents';
import { Bug, Megaphone, Zap, ArrowLeft, CheckCircle, Square, Eye, EyeOff, Trash2, Paperclip, X, Clock, CircleStop, Edit2, ExternalLink, LayoutGrid, Folder as FolderIcon, Plus, CheckCircle2 } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { backend } from '@/services/api';
import { supabase } from '@/lib/supabase';

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

const uploadFile = async (file: File): Promise<Attachment | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            // Fallback: try returning a blob URL for local preview
            return { name: file.name, url: URL.createObjectURL(file) };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return { name: file.name, url: publicUrl };
    } catch (e) {
        console.error("Upload error", e);
        return null;
    }
};

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
    // Stage 1: Wizard (Create Only)
    const [wizardStep, setWizardStep] = useState(mode === 'create' ? 1 : 2);

    // Core Field State
    const [category, setCategory] = useState<TicketCategory | null>(initialData?.category as TicketCategory || null);

    const [clientId, setClientId] = useState<string>(() => {
        if (initialData?.clientId) return initialData.clientId;
        if (defaultClientId) {
            if (clients.find(c => c.id === defaultClientId)) return defaultClientId;
            const firstInOrg = clients.find(c => c.organizationId === defaultClientId);
            if (firstInOrg) return firstInOrg.id;
            return defaultClientId;
        }
        return (clients.length > 0 ? clients[0].id : '');
    });
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [desc, setDesc] = useState(initialData?.description || '');
    const [priority, setPriority] = useState<TicketPriority>(initialData?.priority || TicketPriority.NORMAL);
    const [folderId, setFolderId] = useState<string | null>(initialData?.folder_id || initialData?.folderId || initialFolderId || null);

    // Dynamic Fields
    const [url, setUrl] = useState(initialData?.url || '');
    const [featureLink, setFeatureLink] = useState(initialData?.url || '');
    const [device, setDevice] = useState<DeviceType>(initialData?.device_type as DeviceType || DeviceType.DESKTOP);
    const [platform, setPlatform] = useState<MarketingPlatform>(initialData?.platform as MarketingPlatform || MarketingPlatform.META);
    const [budget, setBudget] = useState(initialData?.budget || '');
    const [errorDate, setErrorDate] = useState(initialData?.error_date || initialData?.errorDate || '');

    // Admin Fields
    const [price, setPrice] = useState(initialData?.price?.toString() || '');
    const [billingType, setBillingType] = useState<BillingType>(initialData?.billing_type || initialData?.billingType || BillingType.FIXED);
    const [startDate, setStartDate] = useState((initialData?.admin_start_date || initialData?.adminStartDate)?.slice(0, 10) || '');
    const [deadline, setDeadline] = useState((initialData?.admin_deadline || initialData?.adminDeadline)?.slice(0, 10) || '');
    const [internalNotes, setInternalNotes] = useState(initialData?.internal_notes || initialData?.internalNotes || '');
    const [publicNotes, setPublicNotes] = useState(initialData?.public_notes || initialData?.publicNotes || '');
    const [status, setStatus] = useState<any>(initialData?.status || 'REVIEW');

    // Files & Subtasks
    const [files, setFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [subtasks, setSubtasks] = useState<Subtask[]>(initialData?.subtasks || []);
    const [newSubtaskInput, setNewSubtaskInput] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Session History State
    const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
    const [isManualSessionModalOpen, setIsManualSessionModalOpen] = useState(false);
    const [manualSessionDuration, setManualSessionDuration] = useState('');
    const [manualSessionNote, setManualSessionNote] = useState('');
    const [manualSessionDate, setManualSessionDate] = useState('');

    const { startTimer, stopTimer, activeTicketId, elapsedSeconds } = useTimer();

    // --- SYNC STATE WITH PROPS (Fix for AI BG Updates) ---
    useEffect(() => {
        if (initialData) {
            setCategory(initialData.category as TicketCategory);
            setClientId(initialData.clientId);
            setSubject(initialData.subject);
            setDesc(initialData.description);
            setPriority(initialData.priority);
            setStatus(initialData.status);
            setPrice(initialData.price?.toString() || '');
            setBillingType(initialData.billing_type || initialData.billingType || BillingType.FIXED);
            setStartDate((initialData.admin_start_date || initialData.adminStartDate)?.slice(0, 10) || '');
            setDeadline((initialData.admin_deadline || initialData.adminDeadline)?.slice(0, 10) || '');
            setInternalNotes(initialData.internal_notes || initialData.internalNotes || '');
            setPublicNotes(initialData.public_notes || initialData.publicNotes || '');
            setSubtasks(initialData.subtasks || []);
            setAttachments(initialData.attachments || []);

            // Dynamic fields
            setUrl(initialData.url || '');
            setFeatureLink(initialData.url || '');
            setDevice(initialData.device_type as DeviceType || DeviceType.DESKTOP);
            setPlatform(initialData.platform as MarketingPlatform || MarketingPlatform.META);
            setBudget(initialData.budget || '');
            setErrorDate(initialData.error_date || initialData.errorDate || '');

            // Fetch Sessions
            backend.getWorkSessions(initialData.id).then(setWorkSessions).catch(console.error);
        }
    }, [initialData]);

    // Dynamic Folder Fetch
    const [internalFolders, setInternalFolders] = useState<any[]>(folders);
    useEffect(() => {
        const updateFolders = async () => {
            const selectedClient = clients.find(c => c.id === clientId);
            const orgId = selectedClient?.organizationId || (initialData as any)?.organizationId || (initialData as any)?.organization_id;

            if (folders && folders.length > 0) {
                if (orgId) {
                    const filtered = folders.filter(f => (f.organization_id) === orgId);
                    setInternalFolders(filtered.length === 0 ? folders : filtered);
                } else {
                    setInternalFolders(folders);
                }
                return;
            }

            if (orgId) {
                const f = await backend.getFolders(orgId);
                setInternalFolders(f);
            } else if (clientId && mode === 'create') {
                const f = await backend.getFolders(clientId);
                setInternalFolders(f);
            } else {
                setInternalFolders([]);
            }
        };
        updateFolders();
    }, [clientId, mode, folders, clients, initialData?.organization_id]);

    // --- LOGIC ---

    const handleSubtaskAdd = () => {
        if (!newSubtaskInput.trim()) return;
        setSubtasks(prev => [...prev, { id: `new_${Date.now()}`, title: newSubtaskInput.trim(), isVisibleToClient: false, isCompleted: false }]);
        setNewSubtaskInput('');
    };

    const handleSubtaskDelete = (id: string) => {
        setSubtasks(prev => prev.filter(s => s.id !== id));
    };

    const handleSubtaskToggle = (id: string, field: 'isCompleted' | 'isVisibleToClient') => {
        setSubtasks(prev => prev.map(s => s.id === id ? { ...s, [field]: !s[field] } : s));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Upload new files
            let uploadedAttachments: Attachment[] = [...attachments];
            for (const file of files) {
                const uploaded = await uploadFile(file);
                if (uploaded) uploadedAttachments.push(uploaded);
            }

            const finalUrl = category === TicketCategory.BUG ? url : (category === TicketCategory.FEATURE ? featureLink : undefined);

            const payload: any = {
                category,
                subject,
                description: desc,
                priority,
                status,
                price: parseFloat(price) || 0,
                billingType,
                adminStartDate: startDate || undefined,
                adminDeadline: deadline || undefined,
                internalNotes,
                publicNotes,
                subtasks,
                attachments: uploadedAttachments,
                url: finalUrl,
                deviceType: category === TicketCategory.BUG ? device : undefined,
                errorDate: category === TicketCategory.BUG ? errorDate : undefined,
                platform: category === TicketCategory.MARKETING ? platform : undefined,
                budget: category === TicketCategory.MARKETING ? budget : undefined,
                folderId: folderId || undefined,
            };

            await onSubmit(payload, clientId);
            if (mode === 'create') setFiles([]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Manual Session
    const handleManualSessionAdd = async () => {
        if (!initialData || !manualSessionDuration) return;
        const durSeconds = parseInt(manualSessionDuration) * 60;

        await backend.manageWorkSession({
            subAction: 'create',
            ticketId: initialData.id,
            userId: 'ME',
            duration: durSeconds,
            note: manualSessionNote,
            date: manualSessionDate,
        });

        const sessions = await backend.getWorkSessions(initialData.id);
        setWorkSessions(sessions);
        setIsManualSessionModalOpen(false);
        setManualSessionDuration('');
        setManualSessionNote('');
    };

    const handleSessionDelete = async (sessionId: number) => {
        if (!confirm("Usunąć ten wpis czasu?")) return;
        await backend.manageWorkSession({ subAction: 'delete', sessionId: sessionId.toString() });
        setWorkSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    // --- RENDER ---

    if (wizardStep === 1) {
        return (
            <div className="pt-4">
                {/* Client Selector (Create Mode Only) */}
                <div className="mb-6">
                    <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Dla Klienta</label>
                    <div className="flex gap-2 flex-wrap">
                        {clients.map(c => (
                            <button
                                type="button"
                                key={c.id}
                                onClick={() => setClientId(c.id)}
                                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${clientId === c.id ? 'border-accent-red bg-accent-red/10 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
                            >
                                {c.companyName || c.name}
                            </button>
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

    // STEP 2: The Main Form
    const isThisActive = activeTicketId === initialData?.id;
    const historySeconds = workSessions.reduce((acc, s) => acc + Number(s.duration_seconds || 0), 0);
    const totalSeconds = historySeconds + (isThisActive ? elapsedSeconds : 0);
    const totalHours = totalSeconds / 3600;

    // RHR / Accrued Revenue
    let displayMetric: React.ReactNode = null;
    if (mode === 'edit' && initialData) {
        const priceVal = parseFloat(price) || 0;
        if (billingType === BillingType.FIXED) {
            const isCalibrating = totalSeconds > 0 && totalSeconds < 900;
            const rhr = priceVal > 0 && totalHours > 0 ? (priceVal / totalHours).toFixed(0) : '0';
            const isProfitable = parseFloat(rhr) > 100;
            displayMetric = (
                <div className={`hidden sm:flex flex-col items-end leading-none ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className="text-[10px] font-bold opacity-70">RHR</span>
                    <span className="font-mono font-bold text-sm">
                        {isCalibrating ? 'KALIBRACJA...' : `${rhr} pln/h`}
                    </span>
                </div>
            );
        } else {
            const accrued = (totalHours * priceVal).toFixed(2);
            displayMetric = (
                <div className="hidden sm:flex flex-col items-end leading-none text-blue-400">
                    <span className="text-[10px] font-bold opacity-70">PRZYCHÓD</span>
                    <span className="font-mono font-bold text-sm">{accrued} PLN</span>
                </div>
            );
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    {mode === 'create' && (
                        <button type="button" onClick={() => setWizardStep(1)} className="text-slate-500 hover:text-white text-sm flex items-center gap-1"><ArrowLeft size={14} /> Kategoria</button>
                    )}
                    {mode === 'create' && <span className="text-slate-600">|</span>}
                    <span className="flex items-center gap-2 font-bold text-accent-red uppercase tracking-wider text-xs border border-accent-red/20 bg-accent-red/5 px-2 py-1 rounded">
                        {category === TicketCategory.BUG && <Bug size={14} />}
                        {category === TicketCategory.MARKETING && <Megaphone size={14} />}
                        {category === TicketCategory.FEATURE && <Zap size={14} />}
                        {category}
                    </span>
                </div>

                {/* TIMER & RHR (EDIT MODE ONLY) */}
                {mode === 'edit' && initialData && (
                    <div className="flex items-center gap-3">
                        {displayMetric}

                        <button
                            type="button"
                            onClick={async () => {
                                if (isThisActive) {
                                    if (confirm("Zatrzymać stoper? Czy oznaczyć to zadanie jako DONE?")) {
                                        await stopTimer();
                                        await backend.updateTicket(initialData.id, 'status', 'DONE');
                                        onClose();
                                        window.dispatchEvent(new CustomEvent('refresh-tickets'));
                                    } else {
                                        await stopTimer();
                                    }
                                } else {
                                    await startTimer(initialData.id);
                                }
                            }}
                            className={`h-8 px-3 rounded-xl flex items-center gap-2 font-bold text-xs transition-all ${isThisActive
                                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            {isThisActive ? <CircleStop size={14} /> : <Clock size={14} />}
                            {isThisActive ? 'STOP' : 'START'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setManualSessionDuration('60');
                                setManualSessionDate(new Date().toISOString().slice(0, 16));
                                setIsManualSessionModalOpen(true);
                            }}
                            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                            title="Dodaj czas ręcznie"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                )}
            </div>

            <Input label="Temat" value={subject} onChange={e => setSubject(e.target.value)} required />

            {/* CONDITIONAL FIELDS */}
            {category === TicketCategory.BUG && (
                <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Link" value={url} onChange={e => setUrl(e.target.value)} />
                        <Select label="Urządzenie" value={device} onChange={e => setDevice(e.target.value as DeviceType)} options={[...Object.values(DeviceType).map(t => ({ value: t, label: t })), { value: 'ALL', label: 'Wszystkie' }]} />
                    </div>
                    <Input type="date" label="Kiedy zauważono błąd?" value={errorDate} onChange={e => setErrorDate(e.target.value)} />
                </div>
            )}
            {category === TicketCategory.MARKETING && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Select label="Platforma" value={platform} onChange={e => setPlatform(e.target.value as MarketingPlatform)} options={Object.values(MarketingPlatform).map(t => ({ value: t, label: t }))} />
                    <Input label="Budżet (Opcjonalnie)" value={budget} onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setBudget(e.target.value) }} placeholder="Np. 5000" />
                </div>
            )}
            {category === TicketCategory.FEATURE && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Input label="Link (Inspiracja)" value={featureLink} onChange={e => setFeatureLink(e.target.value)} placeholder="https://..." />
                </div>
            )}

            {/* PRIORITY & FOLDER */}
            <div className="grid grid-cols-2 gap-4">
                <Select label="Priorytet" value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} options={[{ value: TicketPriority.LOW, label: 'Niski' }, { value: TicketPriority.NORMAL, label: 'Normalny' }, { value: TicketPriority.HIGH, label: 'Wysoki' }, { value: TicketPriority.URGENT, label: 'PILNY' }]} />

                {(mode === 'create' || mode === 'edit') && (
                    <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Folder</label>
                        {internalFolders && internalFolders.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFolderId(null)}
                                    className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-colors ${!folderId ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                >
                                    <LayoutGrid size={14} /> Inbox
                                </button>
                                {internalFolders.map((f: any) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setFolderId(f.id)}
                                        className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-colors truncate ${folderId === f.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        title={f.name}
                                    >
                                        <FolderIcon size={14} style={{ color: f.color }} className="shrink-0" />
                                        <span className="truncate">{f.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 italic p-2 border border-white/5 rounded-xl bg-white/5">Brak dostępnych folderów</div>
                        )}
                    </div>
                )}
            </div>
            <TextArea label="Opis" value={desc} onChange={e => setDesc(e.target.value)} rows={4} required />

            {/* ATTACHMENTS (READ/DELETE) */}
            {attachments.length > 0 && (
                <div className="bg-blue-900/10 p-4 rounded-2xl border border-blue-500/10">
                    <h4 className="text-xs font-bold text-blue-300 mb-2 flex gap-2"><Paperclip size={14} /> Załączniki</h4>
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((f, i) => (
                            <div key={i} className="flex items-center gap-1 bg-black/40 pr-1 pl-3 py-1.5 rounded text-blue-200 text-xs border border-blue-500/20 group">
                                <span className="cursor-pointer hover:text-white flex items-center gap-1" onClick={() => { if (f.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) setPreviewImage(f.url); else window.open(f.url, '_blank'); }}>
                                    <ExternalLink size={10} /> {f.name}
                                </span>
                                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ADMIN ONLY GRID - ROW 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 relative">
                <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Rozliczenie</label>
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 h-[42px]">
                        <button type="button" onClick={() => setBillingType(BillingType.FIXED)} className={`flex-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${billingType === BillingType.FIXED ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>Fixed</button>
                        <button type="button" onClick={() => setBillingType(BillingType.HOURLY)} className={`flex-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${billingType === BillingType.HOURLY ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>Hourly</button>
                    </div>
                </div>
                <Input type="number" label={billingType === BillingType.FIXED ? "Cena (PLN)" : "Stawka (PLN/h)"} value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} options={[
                    { value: 'REVIEW', label: 'WERYFIKACJA' },
                    { value: 'PENDING', label: 'DO ZROBIENIA' },
                    { value: 'IN_PROGRESS', label: 'W TRAKCIE' },
                    { value: 'DONE', label: 'GOTOWE' },
                ]} />
            </div>

            {/* ADMIN ONLY GRID - ROW 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 relative">
                <Input type="date" label="Początek" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <Input type="date" label="Deadline" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                <TextArea label="Notatki Admina (Prywatne)" value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Tylko dla administratora..." />
                <TextArea label="Notatki dla Klienta (Widoczne w portalu)" value={publicNotes} onChange={e => setPublicNotes(e.target.value)} placeholder="Informacja dla klienta o postępach lub rozwiązaniu..." className="!border-accent-red/30 focus:!border-accent-red" />

                {/* FILE UPLOAD ZONE */}
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 block font-bold uppercase">Nowe Załączniki</label>
                    <input
                        type="file"
                        id="form-file-upload"
                        multiple
                        onChange={e => {
                            if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                        }}
                        className="hidden"
                    />
                    <label htmlFor="form-file-upload" className="flex items-center justify-center w-full h-20 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-white/30 hover:bg-white/5 transition-colors">
                        <div className="flex flex-col items-center gap-1 text-slate-500">
                            <Plus size={20} />
                            <span className="text-[10px] font-bold uppercase">Kliknij aby dodać pliki</span>
                        </div>
                    </label>

                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300">
                                    <Paperclip size={12} />
                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                    <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-500">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subtasks */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">Podzadania</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newSubtaskInput}
                            onChange={e => setNewSubtaskInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubtaskAdd(); } }}
                            placeholder="Wpisz i naciśnij Enter..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red/50"
                        />
                        <Button type="button" onClick={handleSubtaskAdd} className="bg-white/10 hover:bg-white/20"><Plus size={16} /></Button>
                    </div>
                    {subtasks.length > 0 && (
                        <div className="space-y-1 bg-gk-900 rounded-2xl border border-white/10 p-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {subtasks.map(sub => (
                                <div key={sub.id} className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 text-sm transition-colors">
                                    <div className="flex items-center gap-3 flex-1">
                                        <button type="button" onClick={() => handleSubtaskToggle(sub.id, 'isCompleted')} className="text-slate-500 hover:text-emerald-500 transition-colors">
                                            {sub.isCompleted ? <CheckCircle size={18} className="text-emerald-500" /> : <Square size={18} />}
                                        </button>
                                        <span className={`${sub.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{sub.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => handleSubtaskToggle(sub.id, 'isVisibleToClient')} className={`p-1.5 rounded-lg hover:bg-white/10 ${sub.isVisibleToClient ? 'text-blue-400' : 'text-slate-600'}`} title={sub.isVisibleToClient ? "Widoczne dla klienta" : "Ukryte"}>
                                            {sub.isVisibleToClient ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button type="button" onClick={() => handleSubtaskDelete(sub.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* WORK HISTORY */}
                {mode === 'edit' && (
                    <div className="pt-4 border-t border-white/10">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Historia Czasu</span>
                            <span className="text-slate-500 font-mono">{workSessions.length > 0 ? (workSessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 3600).toFixed(2) + 'h' : ''}</span>
                        </label>

                        <div className="bg-gk-900 rounded-2xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-slate-500 uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-2">Czas</th>
                                        <th className="px-4 py-2 w-full">Notatka</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {(() => {
                                        const cleanSessions = workSessions.filter(s => s.duration_seconds > 59 || s.note);
                                        const grouped: Record<string, WorkSession[]> = {};
                                        cleanSessions.forEach(s => {
                                            const d = s.start_time ? new Date(s.start_time).toLocaleDateString('pl-PL') : 'Nieznana';
                                            if (!grouped[d]) grouped[d] = [];
                                            grouped[d].push(s);
                                        });

                                        if (Object.keys(grouped).length === 0) {
                                            return <tr><td colSpan={3} className="px-4 py-3 text-center text-slate-600 italic">Brak istotnych sesji ({">"}1min).</td></tr>;
                                        }

                                        return Object.entries(grouped).map(([date, sessions]) => {
                                            const dayTotal = sessions.reduce((acc, s) => acc + Number(s.duration_seconds || 0), 0);
                                            return (
                                                <React.Fragment key={date}>
                                                    <tr className="bg-white/5 text-slate-400 font-bold">
                                                        <td colSpan={3} className="px-4 py-1.5 flex justify-between items-center text-[10px] uppercase tracking-wider">
                                                            <span>{date}</span>
                                                            <span className="text-accent-red opacity-80">{(dayTotal / 3600).toFixed(2)}h</span>
                                                        </td>
                                                    </tr>
                                                    {sessions.map(session => (
                                                        <tr key={session.id} className="group hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-2 font-mono font-bold text-slate-300 whitespace-nowrap">
                                                                <div className="flex flex-col leading-none">
                                                                    <span>{(session.duration_seconds / 3600).toFixed(2)}h</span>
                                                                    <span className="text-[10px] opacity-40 font-sans font-normal">{session.start_time ? new Date(session.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 text-slate-400 truncate max-w-[200px]" title={session.note || ''}>
                                                                {session.note || '-'}
                                                            </td>
                                                            <td className="px-4 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity w-[40px]">
                                                                <button type="button" onClick={() => handleSessionDelete(session.id)} className="text-slate-600 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Manual Session Modal */}
            <Modal isOpen={isManualSessionModalOpen} onClose={() => setIsManualSessionModalOpen(false)} title="Dodaj Czas Ręcznie">
                <div className="space-y-4">
                    <Input type="datetime-local" label="Kiedy?" value={manualSessionDate} onChange={e => setManualSessionDate(e.target.value)} />
                    <Input type="number" label="Czas trwania (minuty)" value={manualSessionDuration} onChange={e => setManualSessionDuration(e.target.value)} placeholder="60" />
                    <TextArea label="Notatka (opcjonalnie)" value={manualSessionNote} onChange={e => setManualSessionNote(e.target.value)} />
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleManualSessionAdd}>Zapisz Czas</Button>
                    </div>
                </div>
            </Modal>

            <div className="flex justify-between pt-4 border-t border-white/10">
                {mode === 'edit' && onDelete && initialData && (
                    <Button type="button" variant="ghost" onClick={() => onDelete(initialData.id)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 size={16} className="mr-2" /> Usuń
                    </Button>
                )}
                <div className="flex gap-2 ml-auto">
                    <Button type="button" variant="ghost" onClick={onClose}>Anuluj</Button>
                    <Button type="submit" isLoading={isSubmitting}>Zapisz</Button>
                </div>
            </div>

            {previewImage && <ImageViewer src={previewImage} onClose={() => setPreviewImage(null)} />}
        </form>
    );
};
