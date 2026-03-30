import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zgrxiszjezjydqcqtulr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpncnhpc3pqZXpqeWRxY3F0dWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjYyODQsImV4cCI6MjA5MDMwMjI4NH0.ZhA-ntPW0xcsKs9lw1aB7Ll5TiXz1luFOEg88ComDbM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
