export enum UserRole {
    ADMIN = 'ADMIN',
    CLIENT = 'CLIENT'
}

export interface Attachment {
    name: string;
    url: string;
}

export interface Organization {
    id: string;
    name: string;
    nip?: string;
    logo?: string;
    createdAt: string;
    vipStatus?: boolean;
    tenant_id?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyName?: string;
    organizationId?: string;
    organizationLogo?: string;
    roleInOrg?: 'OWNER' | 'MEMBER';
    isActive: boolean;
    phone?: string;
    nip?: string;
    website?: string;
    adminNotes?: string;
    avatar?: string;
    color?: string;
    settings?: any;
    tenant_id?: string;
}

export interface Ticket {
    id: string;
    clientId: string;
    clientName: string;
    client_name?: string; // Supabase column
    organizationId?: string; // Alias
    organization_id?: string;
    createdByUserId?: string; // Alias
    created_by_user_id?: string;
    subject: string;
    category: TicketCategory;
    url?: string;
    device_type?: DeviceType;
    platform?: MarketingPlatform;
    budget?: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    price?: number;
    billing_type?: BillingType;
    billingType?: BillingType; // Alias
    billing_month?: string;
    billingMonth?: string; // Alias
    internal_notes?: string;
    internalNotes?: string; // Alias
    public_notes?: string;
    publicNotes?: string; // Alias
    admin_start_date?: string;
    adminStartDate?: string; // Alias
    admin_deadline?: string;
    adminDeadline?: string; // Alias
    error_date?: string;
    errorDate?: string; // Alias
    folder_id?: string;
    folderId?: string; // Alias
    is_hidden_from_client: boolean;
    created_at: string;
    createdAt?: string; // Alias
    subtasks: Subtask[];
    history_log: HistoryEntry[];
    historyLog?: HistoryEntry[]; // Alias
    attachments: Attachment[];
    total_duration_seconds?: number;
    tenant_id: string;
}

export enum BillingType {
    FIXED = 'FIXED',
    HOURLY = 'HOURLY'
}

export interface WorkSession {
    id: number;
    user_id: string;
    ticket_id: string;
    start_time: string;
    end_time?: string;
    duration_seconds: number;
    is_active: boolean;
    note?: string;
    tenant_id: string;
}

export enum TicketStatus {
    REVIEW = 'REVIEW',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export enum TicketPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum TicketCategory {
    BUG = 'BUG',
    MARKETING = 'MARKETING',
    FEATURE = 'FEATURE',
    OTHER = 'OTHER',
}

export enum DeviceType {
    ALL = 'Wszystkie',
    DESKTOP = 'Desktop',
    MOBILE = 'Mobile',
    TABLET = 'Tablet',
}

export enum MarketingPlatform {
    META = 'Meta Ads',
    GOOGLE = 'Google Ads',
    TIKTOK = 'TikTok Ads',
    OTHER = 'Inne',
}

export interface Subtask {
    id: string;
    title: string;
    isCompleted: boolean;
    isVisibleToClient: boolean;
}

export interface HistoryEntry {
    date: string;
    content: string;
}

export interface Folder {
    id: string;
    organization_id: string;
    name: string;
    icon: string;
    color: string;
    automation_rules: any[];
    created_at: string;
    tenant_id: string;
}
export interface AdminSettings {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    popupNote: string;
    avatar?: string;
}

export interface NewTicketPayload {
    category: TicketCategory;
    subject: string;
    description: string;
    priority: TicketPriority;
    errorDate?: string;
    url?: string;
    deviceType?: DeviceType;
    platform?: MarketingPlatform;
    budget?: string;
    price?: number;
    adminDeadline?: string;
    adminStartDate?: string;
    internalNotes?: string;
    initialSubtasks?: string[];
    subtasks?: Subtask[];
    attachments?: Attachment[];
    billingMonth?: string;
}

export interface AutomationRule {
    id: string;
    folderId: string;
    type: 'FROM_USER' | 'KEYWORD' | 'CATEGORY';
    field: string;
    operator: string;
    value: string;
}
