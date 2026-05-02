import { createClient } from '@supabase/supabase-js';

let supabaseAdmin: ReturnType<typeof createClient<any>> | null = null;

export function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  return supabaseAdmin;
}

export interface PostLog {
  id?: string;
  company_id: string;
  post_id: string;
  whop_post_id?: string | null;
  posted_at?: string;
  ai_content?: string | null;
}
