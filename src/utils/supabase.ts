import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://jprhujxljkzhshmljhao.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcmh1anhsamt6aHNobWxqaGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NTYyNDcsImV4cCI6MjEwODUzMjI0N30.3cNUGaZOSLn0gTx-sMyLBePn_LvfPdZDUNpfV22BprA';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
