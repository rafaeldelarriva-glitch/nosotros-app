import { createClient } from '@supabase/supabase-js'

// Sustituye estos valores con los datos reales de tu proyecto en Supabase (Project URL y anon public key)
const SUPABASE_URL = 'https://tu-proyecto.supabase.co'
const SUPABASE_ANON_KEY = 'tu-clave-anon-aqui'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
