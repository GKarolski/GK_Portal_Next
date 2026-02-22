"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Loader2, User, Paperclip, FileText, Image as ImageIcon, MessageSquare, Library, Search } from 'lucide-react';
import { Ticket, TicketPriority, TicketCategory } from '@/types';
import { backend } from '@/services/api';
import { fileToBase64 } from '@/lib/fileHelpers';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    thoughtSignature?: string; // For Gemini 3.0 Context
    attachments?: string[];
    files?: { base64: string, mimeType: string }[];
}

interface AISidebarProps {
    isOpen: boolean;
    onClose: () => void;
    contextData: {
        tickets: Ticket[];
        clients: any[];
        revenue: number;
        month: string;
        selectedTicket?: any;
        activeClientId?: string;
    };
    onAction: (action: any) => void;
    variant?: 'overlay' | 'push';
}

export const AISidebar: React.FC<AISidebarProps> = ({ isOpen, onClose, contextData, onAction, variant = 'overlay' }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Cześć! Jestem Twoją asystentką. Jak mogę Ci pomóc w zarządzaniu zadaniami?', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Context Vault State
    const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat');
    const [clientFiles, setClientFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [fileSearch, setFileSearch] = useState('');

    useEffect(() => {
        if (activeTab === 'files') {
            fetchClientFiles();
        }
    }, [activeTab, contextData.selectedTicket, contextData.clients, contextData.activeClientId]);

    const fetchClientFiles = async () => {
        const clientId = contextData.selectedTicket?.organization_id || contextData.activeClientId || (contextData.clients.length > 0 ? contextData.clients[0].id : null);
        if (!clientId) return;

        setLoadingFiles(true);
        try {
            const files = await backend.getClientDocuments(clientId !== 'ALL' ? clientId : undefined);
            setClientFiles(files);
        } catch (error) {
            console.error("Failed to fetch client files:", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset to auto to get correct scrollHeight
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input, isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() && attachments.length === 0) return;

        const attachmentNames = attachments.map(f => f.name);

        // Convert to base64 for Vision
        const fileDatas = await Promise.all(attachments.map(async f => {
            const b64 = await fileToBase64(f);
            return {
                base64: b64.includes(',') ? b64.split(',')[1] : b64, // Remove Prefix
                mimeType: f.type
            };
        }));

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
            attachments: attachmentNames.length > 0 ? attachmentNames : undefined,
            files: fileDatas.length > 0 ? fileDatas : undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        setIsTyping(true);

        try {
            // Updated to use the unified backend service
            const history = [...messages, userMsg].map(m => ({
                role: m.role,
                content: m.content,
                thoughtSignature: m.thoughtSignature,
                attachments: m.attachments,
                files: m.files
            }));
            const response = await backend.chatWithAI(history, contextData);

            setIsTyping(false);

            // Handle Array or Single Object
            const responses = Array.isArray(response) ? response : [response];

            for (const resp of responses) {
                if (resp.type === 'MESSAGE') {
                    const aiMsg: Message = {
                        id: (Date.now() + Math.random()).toString(),
                        role: 'assistant',
                        content: resp.text || "...",
                        timestamp: new Date(),
                        thoughtSignature: resp.thoughtSignature
                    };
                    setMessages(prev => [...prev, aiMsg]);

                } else if (resp.type === 'ACTION' && resp.action === 'CREATE_TICKET' && resp.data) {
                    try {
                        const sess = localStorage.getItem('gk_user_session');
                        const currentUser = sess ? JSON.parse(sess) : null;

                        if (!currentUser) throw new Error("No active session");

                        const payload = {
                            ...resp.data,
                            organization_id: resp.data.client_id || resp.data.organization_id
                        };

                        await backend.createTicket(currentUser, payload);

                        let successText = `✅ Stworzyłam zadanie: "${payload.subject}"`;
                        if (payload.priority && payload.priority !== 'NORMAL') successText += `\nPriorytet: ${payload.priority}`;
                        if (payload.adminDeadline) successText += `\nTermin: ${payload.adminDeadline}`;

                        const aiMsg: Message = {
                            id: (Date.now() + Math.random()).toString(),
                            role: 'assistant',
                            content: successText,
                            timestamp: new Date(),
                            thoughtSignature: resp.thoughtSignature
                        };
                        setMessages(prev => [...prev, aiMsg]);
                        onAction({ type: 'REFRESH_DATA' });
                    } catch (err) {
                        const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: `❌ Błąd tworzenia: ${err}`, timestamp: new Date() };
                        setMessages(prev => [...prev, errorMsg]);
                    }

                } else if (resp.type === 'ACTION' && resp.action === 'UPDATE_TICKET' && resp.data) {
                    try {
                        await backend.updateTicket(resp.data.ticket_id, resp.data.field, resp.data.value);
                        const aiMsg: Message = {
                            id: (Date.now() + Math.random()).toString(),
                            role: 'assistant',
                            content: `🔄 Zaktualizowałam zadanie (ID: ${resp.data.ticket_id}).\nZmiana: ${resp.data.field} -> ${resp.data.value}`,
                            timestamp: new Date(),
                            thoughtSignature: resp.thoughtSignature
                        };
                        setMessages(prev => [...prev, aiMsg]);
                        onAction({ type: 'REFRESH_DATA' });
                    } catch (err) {
                        const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: `❌ Błąd aktualizacji: ${err}`, timestamp: new Date() };
                        setMessages(prev => [...prev, errorMsg]);
                    }

                } else if (resp.type === 'ACTION' && resp.action === 'DELETE_TICKET' && resp.data) {
                    try {
                        await backend.deleteTicket(resp.data.ticket_id);
                        const aiMsg: Message = {
                            id: (Date.now() + Math.random()).toString(),
                            role: 'assistant',
                            content: `🗑️ Zadanie usunięte: "${resp.data.confirmation_name || 'Zadanie'}"`,
                            timestamp: new Date(),
                            thoughtSignature: resp.thoughtSignature
                        };
                        setMessages(prev => [...prev, aiMsg]);
                        onAction({ type: 'REFRESH_DATA' });
                    } catch (err) {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Błąd usuwania: ${err}`, timestamp: new Date() }]);
                    }
                } else if (resp.type === 'ACTION' && resp.action === 'START_TIMER' && resp.data) {
                    try {
                        const sess = localStorage.getItem('gk_user_session');
                        const currentUser = sess ? JSON.parse(sess) : null;
                        if (!currentUser) throw new Error("No session");

                        await backend.startTimer(currentUser.id, resp.data.ticket_id);
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `⏱️ Wystartowałam stoper dla zadania: ${resp.data.ticket_id}`,
                            timestamp: new Date()
                        }]);
                        onAction({ type: 'REFRESH_DATA' });
                    } catch (err) {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Błąd stopera: ${err}`, timestamp: new Date() }]);
                    }
                } else if (resp.type === 'ACTION' && resp.action === 'STOP_TIMER') {
                    try {
                        const sess = localStorage.getItem('gk_user_session');
                        const currentUser = sess ? JSON.parse(sess) : null;
                        if (!currentUser) throw new Error("No session");

                        await backend.stopTimer(currentUser.id);
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `🛑 Zatrzymałam aktywny stoper.`,
                            timestamp: new Date()
                        }]);
                        onAction({ type: 'REFRESH_DATA' });
                    } catch (err) {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Błąd zatrzymania: ${err}`, timestamp: new Date() }]);
                    }
                } else if (resp.type === 'ACTION' && resp.action === 'UPDATE_CLIENT_DATA' && resp.data) {
                    try {
                        await backend.updateClientData(resp.data.client_id, resp.data.field, resp.data.value);
                        setMessages(prev => [...prev, {
                            id: (Date.now() + Math.random()).toString(),
                            role: 'assistant',
                            content: `📋 Zapisałam ważne informacje w profilu klienta.`,
                            timestamp: new Date()
                        }]);
                        onAction({ type: 'REFRESH_DATA' });
                    } catch (err) {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Błąd zapisu danych klienta: ${err}`, timestamp: new Date() }]);
                    }
                } else {
                    const content = resp.text || (typeof resp === 'string' ? resp : null);
                    if (content) {
                        setMessages(prev => [...prev, { id: (Date.now() + Math.random()).toString(), role: 'assistant', content: content, timestamp: new Date() }]);
                    }
                }
            }

            setIsTyping(false);

        } catch (e) {
            setIsTyping(false);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `❌ Błąd krytyczny: ${e instanceof Error ? e.message : String(e)}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const containerClasses = variant === 'overlay'
        ? `fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-gk-900 border-l border-white/10 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
        : `h-full bg-gk-900 border-l border-white/10 shadow-2xl transition-all duration-300 flex flex-col shrink-0 ${isOpen ? 'w-96 translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`;

    const sess = typeof window !== 'undefined' ? localStorage.getItem('gk_user_session') : null;
    const currentUser = sess ? JSON.parse(sess) : null;
    const isStarter = currentUser?.plan?.tier === 'STARTER';

    return (
        <>
            {isOpen && (variant === 'overlay' || (typeof window !== 'undefined' && window.innerWidth < 1024)) && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

            <div className={containerClasses}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gk-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Asystent AI</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Online (Beta)</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {!isStarter && (
                    <div className="flex bg-gk-900 px-4 pt-2 gap-1 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'chat' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <MessageSquare size={14} /> CZAT
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'files' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <Library size={14} /> PLIKI
                        </button>
                    </div>
                )}

                {activeTab === 'chat' ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gk-950/50 custom-scrollbar">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-indigo-600/90 text-white rounded-tr-sm'
                                    : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/5'
                                    }`}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className="min-h-[1.2em]" dangerouslySetInnerHTML={{
                                            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        }} />
                                    ))}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                                            {msg.attachments.map((name, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] bg-black/20 p-1.5 rounded-lg border border-white/5">
                                                    <FileText size={12} className="text-indigo-400" />
                                                    <span className="truncate max-w-full opacity-80">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 text-slate-400 rounded-2xl rounded-tl-sm p-4 border border-white/5 flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-xs">Analizuję...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto bg-gk-950/50 p-4 flex flex-col custom-scrollbar">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Szukaj w plikach klienta..."
                                value={fileSearch}
                                onChange={e => setFileSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            />
                        </div>

                        {loadingFiles ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-500" />
                            </div>
                        ) : clientFiles.length > 0 ? (
                            <div className="space-y-2">
                                {clientFiles
                                    .filter(f => f.filename.toLowerCase().includes(fileSearch.toLowerCase()))
                                    .map(file => (
                                        <div key={file.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer group">
                                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                <FileText size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-200 truncate">{file.filename}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{new Date(file.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center px-6">
                                <Library size={48} className="mb-4 opacity-20" />
                                <p className="text-sm italic">Brak dokumentów przypisanych do tego klienta w bazie wiedzy.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 border-t border-white/10 bg-gk-900">
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300">
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                    <button onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-white">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative flex items-end gap-2 bg-black/30 border border-white/10 rounded-xl px-2 py-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                        {!isStarter && (
                            <button
                                onClick={handleFileClick}
                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                                title="Załącz plik"
                            >
                                <Paperclip size={20} />
                            </button>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onFileChange}
                            multiple
                            accept="image/*,application/pdf,text/csv,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                        />

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={isStarter ? "Zadaj pytanie asystentowi..." : "Zapytaj lub załącz plik..."}
                            rows={1}
                            className="flex-1 bg-transparent border-none p-2 text-sm text-white focus:outline-none placeholder-slate-500 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
                        />

                        <button
                            onClick={handleSend}
                            disabled={(!input.trim() && attachments.length === 0) || isTyping}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

