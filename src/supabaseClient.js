import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yixocexdzebbkbeaszab.supabase.co'
const SUPABASE_ANON_KEY = 'yixocexdzebbkbeaszab'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
