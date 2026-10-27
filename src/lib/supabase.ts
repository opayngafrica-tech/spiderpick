import { createClient } from '@supabase/supabase-js';

// Support both NEXT_PUBLIC_ (user request specification) and VITE_ (Vite SPA) conventions
const envUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (import.meta.env?.VITE_SUPABASE_URL as string) ||
  '';

const envKey = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
  '';

export const supabaseUrl = envUrl && !envUrl.includes('your-project') 
  ? envUrl 
  : 'https://jprhujxljkzhshmljhao.supabase.co';

export const supabaseAnonKey = envKey && !envKey.includes('your-anon') && !envKey.includes('your-publishable')
  ? envKey 
  : 'sb_publishable__gdLqUr9WIbO-YqIIt3KIQ_ecyHD0ck';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
