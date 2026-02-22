"use client";

import React from 'react';
import { User, Folder } from '@/types';
import { X, UserPlus, Settings, Folder as FolderIcon, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/legacy/UIComponents';
import UsageWidget from '@/components/UsageWidget';

interface AdminSidebarProps {
    clients: User[];
    selectedClientId: string;
    setSelectedClientId: (id: string) => void;
    folders: Folder[];
    activeFolderId: string | null;
    setActiveFolderId: (id: string | null) => void;
    onManageFolders: () => void;
    onAddFolder: () => void;
    onEditFolder: (id: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onInviteClient: () => void;
    onOpenSettings: () => void;
    onAddMember: (orgId: string, companyName: string) => void;
    onOpenClientCard: (client: User) => void;
    onEditClient: (client: User) => void;
    onDeleteClient: (id: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    clients,
    selectedClientId,
    setSelectedClientId,
    folders,
    activeFolderId,
    setActiveFolderId,
    onManageFolders,
    isSidebarOpen,
    setIsSidebarOpen,
    onInviteClient,
    onOpenSettings,
    onAddMember,
    onOpenClientCard,
    onEditClient,
    onDeleteClient,
    onAddFolder,
    onEditFolder
}) => {
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    return (
        <>
            {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gk-900 border-r border-white/5 flex flex-col flex-shrink-0 h-full transition-transform duration-300 lg:static lg:h-full lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gk-900 z-10 h-[73px]">
                    <h2 className="text-xl font-bold text-white tracking-wide">Klienci</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 pt-6 space-y-1">

                    {(() => {
                        const processedOrgs = new Set();
                        console.log('[DEBUG] AdminSidebar: Filtering clients. Total count:', clients.length);
                        return clients
                            .filter(c => c.role !== 'ADMIN')
                            .map(client => {
                                // If no organizationId, we treat the client as their own organization/individual
                                const orgId = client.organizationId || `INDIVIDUAL-${client.id}`;
                                if (processedOrgs.has(orgId)) return null;
                                processedOrgs.add(orgId);

                                const orgMembers = client.organizationId
                                    ? clients.filter(c => c.organizationId === client.organizationId)
                                    : [client];

                                const isSelected = selectedClientId === (client.organizationId || client.id);

                                console.log(`[DEBUG] AdminSidebar: Rendering org group: ${orgId}, Members: ${orgMembers.length}`);

                                return (
                                    <div key={orgId} className="flex flex-col gap-1 group">
                                        <div
                                            className={`relative flex items-center gap-2 w-full p-3 rounded-2xl transition-all cursor-pointer group/row ${isSelected ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedClientId('ALL');
                                                    setActiveFolderId(null);
                                                } else {
                                                    setSelectedClientId(client.organizationId!);
                                                    setActiveFolderId(null);
                                                }
                                            }}
                                        >
                                            <div className={`transition-transform duration-300 ${isSelected ? 'rotate-90' : 'opacity-50'}`}>
                                                <ChevronRight size={14} />
                                            </div>

                                            <div
                                                className="relative group/avatar cursor-pointer"
                                                onClick={(e) => { e.stopPropagation(); onOpenClientCard(client); }}
                                            >
                                                {client.avatar ? (
                                                    <img src={client.avatar} className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover/avatar:border-white/30 transition-colors" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold border border-white/10 group-hover/avatar:border-white/30 transition-colors">
                                                        {client.companyName?.[0] || client.name[0]}
                                                    </div>
                                                )}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gk-900 ${client.isActive ? 'bg-green-500' : 'bg-slate-500'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <span className="text-sm font-bold truncate leading-tight">{client.companyName || client.name}</span>
                                                <span className="text-[10px] opacity-50 truncate">{orgMembers.length} użytkowników</span>
                                            </div>

                                            <div className={`absolute right-2 flex items-center gap-1 transition-opacity ${isSelected || 'group-hover/row:opacity-100 opacity-0'}`}>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === client.organizationId ? null : client.organizationId!);
                                                        }}
                                                        className={`p-1.5 rounded-lg transition-colors ${openMenuId === client.organizationId ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                                        title="Ustawienia"
                                                    >
                                                        <Settings size={14} />
                                                    </button>

                                                    {openMenuId === client.organizationId && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-gk-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onAddMember(client.organizationId!, client.companyName || client.name); setOpenMenuId(null); }}
                                                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                                            >
                                                                <UserPlus size={14} /> Dodaj pracownika
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onEditClient(client); setOpenMenuId(null); }}
                                                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 border-t border-white/5"
                                                            >
                                                                <Settings size={14} /> Edytuj Klienta
                                                            </button>
                                                        </div>
                                                    )}
                                                    {openMenuId === client.organizationId && <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />}
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="pl-4 pr-2 mb-2 space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider group/folders">
                                                    <span>Foldery</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/folders:opacity-100 transition-opacity">
                                                        <button onClick={onAddFolder} className="hover:text-white transition-colors p-1" title="Dodaj Folder"><Plus size={12} /></button>
                                                        <button onClick={onManageFolders} className="hover:text-white transition-colors p-1" title="Zarządzaj Folderami"><Settings size={12} /></button>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => { setActiveFolderId(null); setIsSidebarOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${activeFolderId === null ? 'bg-gk-blue-400/10 text-gk-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                                >
                                                    <div className="w-2 h-2 rounded-full border border-current opacity-70" />
                                                    <span className="font-medium">Wszystkie Zgłoszenia</span>
                                                </button>

                                                {folders && folders.length > 0 ? (
                                                    folders.map(f => (
                                                        <div
                                                            key={f.id}
                                                            className={`relative group/folder flex items-center w-full rounded-lg transition-colors ${activeFolderId === f.id ? 'bg-gk-blue-400/10 text-gk-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                                        >
                                                            <button
                                                                onClick={() => { setActiveFolderId(f.id); setIsSidebarOpen(false); }}
                                                                className="flex-1 text-left px-3 py-2 text-sm flex items-center gap-3"
                                                            >
                                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color || '#64748b', boxShadow: `0 0 8px ${f.color}40` }} />
                                                                <span className="truncate font-medium">{f.name}</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onEditFolder(f.id); }}
                                                                className="absolute right-1 p-1.5 text-slate-500 hover:text-white opacity-0 group-hover/folder:opacity-100 transition-opacity"
                                                                title="Edytuj Folder"
                                                            >
                                                                <Settings size={12} />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-[10px] text-slate-600 italic">Brak folderów</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                    })()}

                </div>
                <div className="p-4 border-t border-white/5 bg-gk-900 z-10 space-y-2">
                    <UsageWidget />
                    <Button variant="secondary" onClick={onInviteClient} className="w-full text-xs py-3 justify-center"><UserPlus size={16} className="mr-2" /> Zaproś Klienta</Button>
                    <Button variant="ghost" onClick={onOpenSettings} className="w-full text-xs py-2 justify-center text-slate-500"><Settings size={16} className="mr-2" /> Ustawienia Admina</Button>
                </div>
            </aside>
        </>
    );
};
