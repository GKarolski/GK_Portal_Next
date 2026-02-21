-- GK Portal SaaS - Supabase PostgreSQL Schema (Shared Database with RLS)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    vip_status TEXT DEFAULT 'STANDARD',
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'CLIENT',
    company_name TEXT,
    organization_id UUID REFERENCES organizations(id),
    role_in_org TEXT DEFAULT 'MEMBER',
    is_active BOOLEAN DEFAULT FALSE,
    phone TEXT,
    nip TEXT,
    website TEXT,
    admin_notes TEXT,
    avatar TEXT,
    color TEXT DEFAULT '#3b82f6',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. FOLDERS
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Folder',
    color TEXT DEFAULT '#3b82f6',
    automation_rules JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- 5. TICKETS
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES profiles(id),
    client_name TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES profiles(id),
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT DEFAULT '',
    device_type TEXT DEFAULT '',
    platform TEXT DEFAULT '',
    budget TEXT DEFAULT '',
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    price DECIMAL(10,2) DEFAULT 0.00,
    billing_type TEXT DEFAULT 'FIXED',
    billing_month TEXT, -- Format YYYY-MM
    internal_notes TEXT,
    public_notes TEXT,
    admin_start_date TIMESTAMPTZ,
    admin_deadline TIMESTAMPTZ,
    error_date TIMESTAMPTZ,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    is_hidden_from_client BOOLEAN DEFAULT FALSE,
    subtasks_json JSONB DEFAULT '[]',
    history_json JSONB DEFAULT '[]',
    attachments_json JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 6. WORK SESSIONS
CREATE TABLE IF NOT EXISTS work_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- 7. SOPs (Standard Operating Procedures)
CREATE TABLE IF NOT EXISTS sops (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'GENERAL',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- 8. CLIENT DOCUMENTS (Context Vault)
CREATE TABLE IF NOT EXISTS client_documents (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    parsed_content TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------

-- Helper: Check if user is Admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read their own profile or all if admin
DROP POLICY IF EXISTS "Profiles read" ON public.profiles;
CREATE POLICY "Profiles read" ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_admin());

-- Organizations: Users can read their own organization
DROP POLICY IF EXISTS "Organizations read" ON public.organizations;
CREATE POLICY "Organizations read" ON public.organizations FOR SELECT
USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());

-- Folders: Tenant isolation
DROP POLICY IF EXISTS "Folders isolation" ON public.folders;
CREATE POLICY "Folders isolation" ON public.folders FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());

-- Tickets: Tenant isolation
DROP POLICY IF EXISTS "Tickets isolation" ON public.tickets;
CREATE POLICY "Tickets isolation" ON public.tickets FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());

-- Work Sessions: Tenant isolation
DROP POLICY IF EXISTS "Work sessions isolation" ON public.work_sessions;
CREATE POLICY "Work sessions isolation" ON public.work_sessions FOR ALL
USING (ticket_id IN (SELECT id FROM public.tickets) OR public.is_admin());

-- SOPs: Tenant isolation
DROP POLICY IF EXISTS "SOPs isolation" ON public.sops;
CREATE POLICY "SOPs isolation" ON public.sops FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());

-- Client Documents: Tenant isolation
DROP POLICY IF EXISTS "Documents isolation" ON public.client_documents;
CREATE POLICY "Documents isolation" ON public.client_documents FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());

--------------------------------------------------------------------------------
-- TRIGGERS
--------------------------------------------------------------------------------

-- Auto-create profile on Auth Sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, 'CLIENT');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
