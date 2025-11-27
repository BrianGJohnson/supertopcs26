import { supabase, getCurrentUserId } from '@/lib/supabase';
import type { SeedPhrase, SeedPhraseInsert } from '@/types/database';

export interface AddPhraseInput {
  phrase: string;
  builderSourceTag?: string;
  originSourceModule?: string;
  parentPhraseId?: string;
  hierarchyPath?: string;
  hierarchyDepth?: number;
}

/**
 * Add multiple seed phrases to a session
 */
export async function addSeedPhrases(
  sessionId: string,
  phrases: AddPhraseInput[]
): Promise<SeedPhrase[]> {
  const userId = await getCurrentUserId();

  const inserts: SeedPhraseInsert[] = phrases.map((p) => ({
    user_id: userId,
    session_id: sessionId,
    phrase: p.phrase,
    builder_source_tag: p.builderSourceTag ?? null,
    origin_source_module: p.originSourceModule ?? 'seed',
    parent_phrase_id: p.parentPhraseId ?? null,
    hierarchy_path: p.hierarchyPath ?? null,
    hierarchy_depth: p.hierarchyDepth ?? null,
  }));

  const { data, error } = await supabase
    .from('seed_phrases')
    .insert(inserts)
    .select();

  if (error) throw error;
  return data ?? [];
}

/**
 * Get all seed phrases for a session, ordered by created_at ASC
 */
export async function getSeedPhrasesBySession(
  sessionId: string
): Promise<SeedPhrase[]> {
  const { data, error } = await supabase
    .from('seed_phrases')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get only selected seed phrases for a session
 */
export async function getSelectedSeedPhrases(
  sessionId: string
): Promise<SeedPhrase[]> {
  const { data, error } = await supabase
    .from('seed_phrases')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_selected', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get finalist seed phrases for a session
 */
export async function getFinalistSeedPhrases(
  sessionId: string
): Promise<SeedPhrase[]> {
  const { data, error } = await supabase
    .from('seed_phrases')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_finalist', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Toggle selection state for a phrase
 */
export async function togglePhraseSelected(
  phraseId: string,
  isSelected: boolean
): Promise<SeedPhrase> {
  const { data, error } = await supabase
    .from('seed_phrases')
    .update({ is_selected: isSelected })
    .eq('id', phraseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle favorite state for a phrase
 */
export async function togglePhraseFavorite(
  phraseId: string,
  isFavorite: boolean
): Promise<SeedPhrase> {
  const { data, error } = await supabase
    .from('seed_phrases')
    .update({ is_favorite: isFavorite })
    .eq('id', phraseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Bulk update selection state
 */
export async function bulkSetSelected(
  phraseIds: string[],
  isSelected: boolean
): Promise<void> {
  const { error } = await supabase
    .from('seed_phrases')
    .update({ is_selected: isSelected })
    .in('id', phraseIds);

  if (error) throw error;
}

/**
 * Delete phrases from a session
 */
export async function deleteSeedPhrases(phraseIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('seed_phrases')
    .delete()
    .in('id', phraseIds);

  if (error) throw error;
}
