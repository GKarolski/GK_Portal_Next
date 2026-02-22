"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader, GripHorizontal, FileText as StickyNoteIcon } from 'lucide-react';
import { backend } from '@/services/api';

interface StickyNote {
    id: string;
    content: string;
    color: 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'slate';
    createdAt: number;
}

export const StickyNotesWidget: React.FC = () => {
    const [notes, setNotes] = useState<StickyNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setIsLoading(true);
        try {
            const settings = await backend.getAdminSettings();
            let loadedNotes: StickyNote[] = [];
            if (settings?.stickyNotes) {
                loadedNotes = settings.stickyNotes;
            } else if (settings?.notepadContent) {
                loadedNotes = [{
                    id: Date.now().toString(),
                    content: settings.notepadContent,
                    color: 'yellow',
                    createdAt: Date.now()
                }];
            }
            setNotes(loadedNotes);
        } catch (e) {
            console.error("Failed to load notes", e);
        }
        setIsLoading(false);
    };

    const saveNotes = async (newNotes: StickyNote[]) => {
        setIsSaving(true);
        try {
            await backend.updateAdminSettings({ stickyNotes: newNotes });
        } catch (e) {
            console.error("Failed to save notes", e);
        }
        setIsSaving(false);
    };

    const updateNotes = (newNotes: StickyNote[]) => {
        setNotes(newNotes);
        saveNotes(newNotes);
    };

    const addNote = () => {
        const newNote: StickyNote = {
            id: Date.now().toString(),
            content: '',
            color: 'slate',
            createdAt: Date.now()
        };
        updateNotes([newNote, ...notes]);
    };

    const updateNoteContent = (id: string, content: string) => {
        const updated = notes.map(n => n.id === id ? { ...n, content } : n);
        setNotes(updated);
    };

    const updateNoteColor = (id: string, color: StickyNote['color']) => {
        const updated = notes.map(n => n.id === id ? { ...n, color } : n);
        updateNotes(updated);
    };

    const handleBlur = () => {
        saveNotes(notes);
    };

    const deleteNote = (id: string) => {
        if (confirm("Usunąć notatkę?")) {
            const updated = notes.filter(n => n.id !== id);
            updateNotes(updated);
        }
    };

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
        e.preventDefault();
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onDrop = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const copyNotes = [...notes];
            const dragNote = copyNotes[dragItem.current];
            copyNotes.splice(dragItem.current, 1);
            copyNotes.splice(dragOverItem.current, 0, dragNote);
            dragItem.current = null;
            dragOverItem.current = null;
            updateNotes(copyNotes);
        }
    };

    const colors = {
        slate: 'bg-slate-800 border-slate-700 text-slate-300',
        yellow: 'bg-yellow-950/40 border-yellow-700/50 text-yellow-200',
        blue: 'bg-blue-950/40 border-blue-700/50 text-blue-200',
        green: 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200',
        red: 'bg-red-950/40 border-red-700/50 text-red-200',
        purple: 'bg-purple-950/40 border-purple-700/50 text-purple-200',
    };

    const dotColors = {
        slate: 'bg-slate-600',
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500',
        green: 'bg-emerald-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <StickyNoteIcon size={18} className="text-yellow-400" />
                    Notatki
                    {isSaving && <Loader size={12} className="animate-spin text-slate-500" />}
                </h3>
                <button
                    onClick={addNote}
                    className="p-1 px-3 bg-gk-blue-400/20 text-gk-blue-400 hover:bg-gk-blue-400/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                    <Plus size={14} /> Nowa
                </button>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden p-4 flex-1 flex flex-col min-h-0">
                <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-500"><Loader className="animate-spin mx-auto" /></div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl cursor-pointer hover:border-gk-blue-400/50 hover:bg-white/5 transition-all group" onClick={addNote}>
                            <div className="text-sm font-medium group-hover:text-white transition-colors">Brak notatek.</div>
                            <div className="text-xs mt-2 text-gk-blue-400 font-bold flex items-center justify-center gap-1"><Plus size={14} /> Dodaj pierwszą</div>
                        </div>
                    ) : (
                        notes.map((note, index) => (
                            <div
                                key={note.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragEnter={(e) => onDragEnter(e, index)}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                                className={`p-6 rounded-2xl relative group transition-all duration-300 border shadow-xl ${colors[note.color] || colors.slate} cursor-grab active:cursor-grabbing hover:shadow-2xl hover:border-white/20`}
                            >
                                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                                    <span className="cursor-grab text-white/50 hover:text-white transition-colors"><GripHorizontal size={16} /></span>
                                    <div className="w-px h-3 bg-white/20"></div>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        className="p-1 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <textarea
                                    value={note.content}
                                    onChange={(e) => updateNoteContent(note.id, e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="Wpisz treść notatki..."
                                    className="w-full h-32 bg-transparent resize-none focus:outline-none text-base font-medium leading-relaxed placeholder:text-white/20"
                                    spellCheck={false}
                                />

                                <div className="flex justify-end gap-2 mt-4 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all origin-bottom-right">
                                    {(Object.keys(colors) as Array<keyof typeof colors>).map(c => (
                                        <button
                                            key={c}
                                            onClick={() => updateNoteColor(note.id, c)}
                                            className={`w-4 h-4 rounded-full ${dotColors[c]} ${note.color === c ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-black/50 scale-110' : 'opacity-40 hover:opacity-100'} transition-all shadow-sm`}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
