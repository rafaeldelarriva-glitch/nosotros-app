import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ltcyjroc4f46khik8red.supabase.co'
// Sustituye la siguiente constante por la clave "anon public" de tu panel de Supabase (Settings > API)
const SUPABASE_ANON_KEY = 'yixocexdzebbkbeaszab'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
