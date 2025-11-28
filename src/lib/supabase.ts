import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper to get current user id (throws if not authenticated)
export async function getCurrentUserId(): Promise<string> {
  // First try getSession (reads from localStorage, faster)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    return session.user.id;
  }
  
  // Fallback to getUser (validates with server)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return user.id;
}
