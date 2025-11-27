import { supabase, getCurrentUserId } from '@/lib/supabase';
import type { Session, SessionInsert } from '@/types/database';

/**
 * Create a new builder session
 */
export async function createSession(
  name: string,
  seedPhrase?: string
): Promise<Session> {
  const userId = await getCurrentUserId();

  const insert: SessionInsert = {
    user_id: userId,
    name,
    seed_phrase: seedPhrase ?? null,
    current_step: 1,
    status: 'active',
    source_module: 'builder',
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List all sessions for the current user, newest first
 */
export async function listSessions(): Promise<Session[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get a single session by ID (scoped to current user via RLS)
 */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Update session fields (e.g., current_step, last_activity_at)
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<Session, 'name' | 'seed_phrase' | 'current_step' | 'status' | 'total_phrases_generated' | 'total_phrases_refined' | 'total_super_items' | 'total_titles_saved' | 'total_packages_saved'>>
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update({ ...updates, last_activity_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a session (cascades to disposable tables)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}
