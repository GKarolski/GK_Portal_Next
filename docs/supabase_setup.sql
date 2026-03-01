-- ============================================================================
-- GK Portal SaaS - COMPLETE Supabase Schema v2.1
-- ============================================================================
-- This script is SAFE to run on both fresh and existing databases.
-- It uses CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS.
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query → Run.
-- ============================================================================

-- 0. Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE TABLES (IF NOT EXISTS — skips if already present)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    vip_status TEXT DEFAULT 'STANDARD',
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'CLIENT',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    category TEXT NOT NULL DEFAULT 'FEATURE',
    client_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_sessions (
    id BIGSERIAL PRIMARY KEY,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_timers (
    user_id UUID PRIMARY KEY,
    ticket_id UUID,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sops (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    category TEXT DEFAULT 'GENERAL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_documents (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT NOT NULL DEFAULT '',
    file_path TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: ADD ALL COLUMNS (IF NOT EXISTS — no-ops on existing columns)
-- ============================================================================

-- Organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS vip_status TEXT DEFAULT 'STANDARD';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo TEXT;

-- Profiles (the big one — adds all columns the codebase expects)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CLIENT';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_in_org TEXT DEFAULT 'MEMBER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;

-- Folders
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Folder';
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS automation_rules JSONB DEFAULT '[]';

-- Tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by_user_id UUID;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS url TEXT DEFAULT '';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT '';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT '';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS budget TEXT DEFAULT '';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'FIXED';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS billing_month TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS public_notes TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS admin_start_date TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS admin_deadline TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS error_date TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS is_hidden_from_client BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS subtasks_json JSONB DEFAULT '[]';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS history_json JSONB DEFAULT '[]';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attachments_json JSONB DEFAULT '[]';

-- Work Sessions
ALTER TABLE public.work_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.work_sessions ADD COLUMN IF NOT EXISTS ticket_id UUID;
ALTER TABLE public.work_sessions ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.work_sessions ADD COLUMN IF NOT EXISTS stop_time TIMESTAMPTZ;
ALTER TABLE public.work_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.work_sessions ADD COLUMN IF NOT EXISTS note TEXT;

-- Active Timers
ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS ticket_id UUID;

-- SOPs
ALTER TABLE public.sops ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Client Documents
ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS parsed_content TEXT;
ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();

-- Admin Settings
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS popup_note TEXT;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS sticky_notes JSONB DEFAULT '[]';
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS notepad_content TEXT;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS avatar TEXT;

-- ============================================================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    OR
    (auth.jwt()->'user_metadata'->>'role') = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_org_id() RETURNS UUID AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: RLS POLICIES (drop-if-exists + create to be idempotent)
-- ============================================================================

-- Profiles
DROP POLICY IF EXISTS "Profiles read" ON public.profiles;
CREATE POLICY "Profiles read" ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles update own" ON public.profiles;
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles admin insert" ON public.profiles;
CREATE POLICY "Profiles admin insert" ON public.profiles FOR INSERT
WITH CHECK (public.is_admin() OR auth.uid() = id);

-- Organizations
DROP POLICY IF EXISTS "Organizations read" ON public.organizations;
CREATE POLICY "Organizations read" ON public.organizations FOR SELECT
USING (id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "Organizations admin manage" ON public.organizations;
CREATE POLICY "Organizations admin manage" ON public.organizations FOR ALL
USING (public.is_admin());

-- Folders
DROP POLICY IF EXISTS "Folders isolation" ON public.folders;
CREATE POLICY "Folders isolation" ON public.folders FOR ALL
USING (organization_id = public.user_org_id() OR public.is_admin());

-- Tickets
DROP POLICY IF EXISTS "Tickets isolation" ON public.tickets;
CREATE POLICY "Tickets isolation" ON public.tickets FOR ALL
USING (organization_id = public.user_org_id() OR public.is_admin());

-- Work Sessions
DROP POLICY IF EXISTS "Work sessions isolation" ON public.work_sessions;
CREATE POLICY "Work sessions isolation" ON public.work_sessions FOR ALL
USING (ticket_id IN (SELECT id FROM public.tickets) OR public.is_admin());

-- Active Timers
DROP POLICY IF EXISTS "Active timers user" ON public.active_timers;
CREATE POLICY "Active timers user" ON public.active_timers FOR ALL
USING (user_id = auth.uid() OR public.is_admin());

-- SOPs
DROP POLICY IF EXISTS "SOPs isolation" ON public.sops;
CREATE POLICY "SOPs isolation" ON public.sops FOR ALL
USING (organization_id = public.user_org_id() OR public.is_admin());

-- Client Documents
DROP POLICY IF EXISTS "Documents isolation" ON public.client_documents;
CREATE POLICY "Documents isolation" ON public.client_documents FOR ALL
USING (organization_id = public.user_org_id() OR public.is_admin());

-- Admin Settings
DROP POLICY IF EXISTS "Admin settings isolation" ON public.admin_settings;
CREATE POLICY "Admin settings isolation" ON public.admin_settings FOR ALL
USING (organization_id = public.user_org_id() OR public.is_admin());

-- ============================================================================
-- STEP 6: TRIGGER — Auto-create profile on Auth Sign-up
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, email, role, organization_id, company_name,
    phone, nip, website, admin_notes, avatar, is_active
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'CLIENT'),
    (new.raw_user_meta_data->>'organization_id')::UUID,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nip',
    new.raw_user_meta_data->>'website',
    new.raw_user_meta_data->>'admin_notes',
    new.raw_user_meta_data->>'avatar_url',
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- DONE! All tables, columns, RLS policies, and triggers are up to date.
-- ============================================================================
