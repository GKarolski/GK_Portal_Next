import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

// This client has admin privileges and bypasses RLS
// Use ONLY in server actions and route handlers
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
