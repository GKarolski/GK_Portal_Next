"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/legacy/UIComponents';
import { Folder, TicketPriority, TicketCategory, AutomationRule, User } from '@/types';
import { backend } from '@/services/api';
import { Folder as FolderIcon, Plus, Settings, Trash2 } from 'lucide-react';

interface FolderManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClientId: string;
    folders: Folder[];
    setFolders: (folders: Folder[]) => void;
    clients: User[];
    initialFolderId?: string | null;
    hideList?: boolean;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
    isOpen,
    onClose,
    selectedClientId,
    folders,
    setFolders,
    clients,
    initialFolderId,
    hideList
}) => {
    // Local State
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [folderName, setFolderName] = useState('');
    const [folderColor, setFolderColor] = useState('#3b82f6');
    const [folderRules, setFolderRules] = useState<AutomationRule[]>([]);

    // Reset/Sync state when opening/editing
    useEffect(() => {
        if (!isOpen) {
            setEditingFolder(null);
            setFolderName('');
            setFolderRules([]);
        } else {
            // Handle Pre-selection
            if (initialFolderId) {
                const f = folders.find(fd => fd.id === initialFolderId);
                if (f) handleSelectFolder(f);
            } else if (hideList) {
                // If list hidden and no ID, assume Create Mode
                handleNewFolder();
            }
        }
    }, [isOpen, initialFolderId, hideList]);

    const handleSelectFolder = (f: Folder) => {
        setEditingFolder(f);
        setFolderName(f.name);
        setFolderColor(f.color);
        setFolderRules(f.automation_rules || []);
    };

    const handleNewFolder = () => {
        setEditingFolder(null);
        setFolderName('');
        setFolderColor('#3b82f6');
        setFolderRules([]);
    };

    const handleSave = async () => {
        await backend.manageFolder(editingFolder ? 'update' : 'create', {
            folderId: editingFolder?.id,
            organizationId: selectedClientId,
            name: folderName,
            color: folderColor,
            icon: 'folder',
            automationRules: folderRules
        });
        // Refresh
        const fData = await backend.getFolders(selectedClientId);
        setFolders(fData);
        onClose();
    };

    const handleDelete = async () => {
        if (editingFolder && confirm("Usunąć folder?")) {
            await backend.manageFolder('delete', { folderId: editingFolder.id });
            const fData = await backend.getFolders(selectedClientId);
            setFolders(fData);
            setEditingFolder(null);
        }
    };

    const orgClients = clients.filter(c => c.organizationId === selectedClientId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pulpit Smart Folders">
            <div className="space-y-8">
                {/* List of existing folders (Hidden in Fast Mode) */}
                {!hideList && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {folders.map(f => (
                            <div
                                key={f.id}
                                onClick={() => handleSelectFolder(f)}
                                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${editingFolder?.id === f.id ? 'bg-white/10 border-white' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderIcon size={20} style={{ color: f.color }} />
                                    <span className="font-bold text-white">{f.name}</span>
                                </div>
                                <span className="text-[10px] bg-black/40 px-2 py-1 rounded text-slate-500">{f.automation_rules?.length || 0} Reguł</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Editor Area */}
                <div className="bg-gk-900 p-6 rounded-3xl border border-white/10">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        {editingFolder ? <Settings size={16} /> : <Plus size={16} />}
                        {editingFolder ? `Edytuj: ${editingFolder.name}` : "Kreowanie Nowego Folderu"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Input label="Nazwa Folderu" value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Np. Grafika, Pilne" />
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Kolor</label>
                            <div className="flex gap-2">
                                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setFolderColor(c)}
                                        className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${folderColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Rules Engine */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Automatyzacja (Jeśli... to wpadnij tutaj)</label>
                        <div className="space-y-3 bg-black/20 p-4 rounded-2xl">
                            {folderRules.map((rule, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <span className="text-xs font-mono text-slate-400 px-2">JEŚLI</span>
                                    <Select
                                        value={rule.field}
                                        onChange={e => { const newRules = [...folderRules]; newRules[idx].field = e.target.value as any; setFolderRules(newRules); }}
                                        options={[{ value: 'category', label: 'Kategoria' }, { value: 'priority', label: 'Priorytet' }, { value: 'created_by_user_id', label: 'Autor' }, { value: 'subject', label: 'Temat' }]}
                                        className="w-full md:w-32"
                                    />

                                    {/* Operator Selection for Subject */}
                                    {rule.field === 'subject' ? (
                                        <Select
                                            value={rule.operator || 'CONTAINS'}
                                            onChange={e => { const newRules = [...folderRules]; newRules[idx].operator = e.target.value as any; setFolderRules(newRules); }}
                                            options={[{ value: 'CONTAINS', label: 'ZAWIERA' }, { value: 'EQUALS', label: 'JEST RÓWNE' }]}
                                            className="w-full md:w-32"
                                        />
                                    ) : (
                                        <span className="text-xs font-mono text-slate-400 px-2 hidden md:inline">=</span>
                                    )}

                                    {rule.field === 'created_by_user_id' ? (
                                        <Select
                                            value={rule.value}
                                            onChange={e => { const newRules = [...folderRules]; newRules[idx].value = e.target.value; setFolderRules(newRules); }}
                                            options={orgClients.map(c => ({ value: c.id, label: c.name }))}
                                            className="flex-1 w-full"
                                        />
                                    ) : rule.field === 'priority' ? (
                                        <Select
                                            value={rule.value}
                                            onChange={e => { const newRules = [...folderRules]; newRules[idx].value = e.target.value; setFolderRules(newRules); }}
                                            options={[
                                                { value: TicketPriority.LOW, label: 'Niski' },
                                                { value: TicketPriority.NORMAL, label: 'Normalny' },
                                                { value: TicketPriority.HIGH, label: 'Wysoki' },
                                                { value: TicketPriority.URGENT, label: 'Pilny' }
                                            ]}
                                            className="flex-1 w-full"
                                        />
                                    ) : rule.field === 'category' ? (
                                        <Select
                                            value={rule.value}
                                            onChange={e => { const newRules = [...folderRules]; newRules[idx].value = e.target.value; setFolderRules(newRules); }}
                                            options={[
                                                { value: TicketCategory.BUG, label: 'Błąd' },
                                                { value: TicketCategory.FEATURE, label: 'Modyfikacja' },
                                                { value: TicketCategory.MARKETING, label: 'Marketing' },
                                                { value: TicketCategory.OTHER, label: 'Inne' }
                                            ]}
                                            className="flex-1 w-full"
                                        />
                                    ) : (
                                        <Input
                                            value={rule.value}
                                            onChange={e => { const newRules = [...folderRules]; newRules[idx].value = e.target.value; setFolderRules(newRules); }}
                                            className="flex-1 w-full"
                                            placeholder="Wartość..."
                                        />
                                    )}
                                    <button onClick={() => setFolderRules(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:bg-red-500/10 p-2 rounded ml-auto md:ml-0"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            <Button variant="secondary" className="text-xs h-8 px-3" onClick={() => setFolderRules([...folderRules, { id: Math.random().toString(), folderId: editingFolder?.id || '', type: 'FROM_USER', field: 'priority', operator: 'EQUALS', value: 'NORMAL' }])}><Plus size={14} className="mr-2" /> Dodaj Warunek</Button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        {editingFolder ? (
                            <button onClick={handleDelete} className="text-red-400 text-xs hover:underline flex items-center gap-1"><Trash2 size={14} /> Usuń Folder</button>
                        ) : (
                            <button onClick={handleNewFolder} className="text-slate-500 text-xs hover:text-white flex items-center gap-1 transition-colors"><Plus size={14} /> Wyczyść / Nowy</button>
                        )}

                        <Button onClick={handleSave}>
                            {editingFolder ? "Zapisz Zmiany" : "Utwórz Folder"}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
