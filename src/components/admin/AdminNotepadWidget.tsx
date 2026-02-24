"use client";

import React, { useState, useEffect } from 'react';
import { Save, FileText, Loader } from 'lucide-react';
import { backend } from '@/services/api';

export const AdminNotepadWidget: React.FC = () => {
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        loadNote();
    }, []);

    const loadNote = async () => {
        setIsLoading(true);
        try {
            const settings = await backend.getAdminSettings();
            setNote((settings as any)?.notepadContent || '');
        } catch (e) {
            console.error("Failed to load note", e);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const currentSettings = await backend.getAdminSettings();
            await backend.updateAdminSettings({ ...currentSettings, notepadContent: note });
            setLastSaved(new Date());
        } catch (e) {
            console.error("Failed to save note", e);
        }
        setIsSaving(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full min-h-[300px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <FileText size={16} className="text-yellow-400" />
                    Szybki Notatnik
                </h3>
                <div className="flex items-center gap-2">
                    {lastSaved && <span className="text-[10px] text-slate-500">Zapisano {lastSaved.toLocaleTimeString()}</span>}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="Zapisz (Ctrl+S)"
                    >
                        {isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                    </button>
                </div>
            </div>
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                        <Loader size={20} className="animate-spin" />
                    </div>
                ) : (
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Wpisz szybkie notatki, pomysły, czy rzeczy do zrobienia..."
                        className="w-full h-full bg-transparent p-4 text-sm text-slate-300 resize-none focus:outline-none placeholder:text-slate-600 font-mono"
                        spellCheck={false}
                    />
                )}
            </div>
        </div>
    );
};
