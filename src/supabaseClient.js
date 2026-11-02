import { createClient } from '@supabase/supabase-js'

// Sustituye estos valores con los datos reales de tu proyecto en Supabase (Project URL y anon public key)
const SUPABASE_URL = 'https://ltcyjroc4f46khik8red.supabase.co' 
const SUPABASE_ANON_KEY = 'prj_LTcyjROc4f46KhiK8rEd9ZP8Nyze'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
