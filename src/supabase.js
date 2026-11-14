import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

// Publishable key is intended for browser use. Never put a service_role/secret key here.
export const supabase = createClient(
  'https://xxmmserpshucnohcaowx.supabase.co',
  'sb_publishable_dutw2_pa2P24Na-ljQn7fw_io9K68gi',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
