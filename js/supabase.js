import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://dfrbiegpfzdxaxgbjbjz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q43nV_g5aO4Md-FOEBpt5A_rXhZB-LC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
