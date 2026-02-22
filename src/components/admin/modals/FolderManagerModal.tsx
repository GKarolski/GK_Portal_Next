"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/legacy/UIComponents';
import { Folder, TicketPriority, TicketCategory, User } from '@/types';
import { backend } from '@/services/api';
import { Folder as FolderIcon, Plus, Settings, Trash2 } from 'lucide-react';

interface FolderManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClientId: string;
    folders: Folder[];
    setFolders: (folders: Folder[]) => void;
    clients: User[];
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
    isOpen,
    onClose,
    selectedClientId,
    folders,
    setFolders,
    clients,
}) => {
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [folderName, setFolderName] = useState('');
    const [folderColor, setFolderColor] = useState('#3b82f6');
    const [folderRules, setFolderRules] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setEditingFolder(null);
            setFolderName('');
            setFolderRules([]);
        }
    }, [isOpen]);

    const handleSelectFolder = (f: Folder) => {
        setEditingFolder(f);
        setFolderName(f.name);
        setFolderColor(f.color);
        setFolderRules(f.automation_rules || []);
    };

    const handleSave = async () => {
        // Mocking folder management for now to avoid breaking UI flow
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pulpit Smart Folders">
            <div className="space-y-8">
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
                        </div>
                    ))}
                </div>

                <div className="bg-[#0c0c0c] p-6 rounded-3xl border border-white/10">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        {editingFolder ? <Settings size={16} /> : <Plus size={16} />}
                        {editingFolder ? `Edytuj: ${editingFolder.name}` : "Nowy Folder"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Input label="Nazwa Folderu" value={folderName} onChange={e => setFolderName(e.target.value)} />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <Button onClick={handleSave}>
                            {editingFolder ? "Zapisz Zmiany" : "Utwórz Folder"}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
