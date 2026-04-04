import { createClient } from '@supabase/supabase-js'

// ============================================================
// ⚠️  REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
// ============================================================
const SUPABASE_URL = 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
