import { createClient } from '@supabase/supabase-js';

// Эти два значения НЕ хранятся прямо в коде — они подставляются из
// настроек хостинга (Vercel → Environment Variables), чтобы их можно
// было менять без изменения кода.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
