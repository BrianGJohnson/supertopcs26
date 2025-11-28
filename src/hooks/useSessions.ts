import { supabase, getCurrentUserId } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import type { Session, SessionInsert } from '@/types/database';

/**
 * Helper to throw proper Error from Supabase error
 */
function throwSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new Error(String((error as { message: unknown }).message));
  }
  throw new Error('Database operation failed');
}

/**
 * Create a new builder session
 * Name and seed phrase are automatically converted to Title Case
 */
export async function createSession(
  name: string,
  seedPhrase?: string
): Promise<Session> {
  const userId = await getCurrentUserId();

  const insert: SessionInsert = {
    user_id: userId,
    name: toTitleCase(name),
    seed_phrase: seedPhrase ? toTitleCase(seedPhrase) : null,
    current_step: 1,
    status: 'active',
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(insert)
    .select()
    .single();

  if (error) throwSupabaseError(error);
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

  if (error) throwSupabaseError(error);
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
    throwSupabaseError(error);
  }
  return data;
}

/**
 * Update session fields
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<Session, 'name' | 'seed_phrase' | 'current_step' | 'status'>>
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throwSupabaseError(error);
  return data;
}

/**
 * Delete a session (cascades to seeds and seed_analysis)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throwSupabaseError(error);
}
