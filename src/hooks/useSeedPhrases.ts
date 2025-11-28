import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import type { Seed, SeedInsert } from '@/types/database';

export interface AddSeedInput {
  phrase: string;
  generationMethod?: string; // top10, child, a2z, prefix
  parentSeedId?: string;
  position?: number;
}

/**
 * Add multiple seeds to a session
 * Phrases are automatically converted to Title Case
 */
export async function addSeeds(
  sessionId: string,
  seeds: AddSeedInput[]
): Promise<Seed[]> {
  const inserts: SeedInsert[] = seeds.map((s) => ({
    session_id: sessionId,
    phrase: toTitleCase(s.phrase),
    generation_method: s.generationMethod ?? null,
    parent_seed_id: s.parentSeedId ?? null,
    position: s.position ?? null,
  }));

  const { data, error } = await supabase
    .from('seeds')
    .insert(inserts)
    .select();

  if (error) throw error;
  return data ?? [];
}

/**
 * Get all seeds for a session, ordered by created_at DESC (newest first)
 */
export async function getSeedsBySession(
  sessionId: string
): Promise<Seed[]> {
  const { data, error } = await supabase
    .from('seeds')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get only selected seeds for a session
 */
export async function getSelectedSeeds(
  sessionId: string
): Promise<Seed[]> {
  const { data, error } = await supabase
    .from('seeds')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_selected', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get finalist seeds for a session
 */
export async function getFinalistSeeds(
  sessionId: string
): Promise<Seed[]> {
  const { data, error } = await supabase
    .from('seeds')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_finalist', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Toggle selection state for a seed
 */
export async function toggleSeedSelected(
  seedId: string,
  isSelected: boolean
): Promise<Seed> {
  const { data, error } = await supabase
    .from('seeds')
    .update({ is_selected: isSelected })
    .eq('id', seedId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle finalist state for a seed
 */
export async function toggleSeedFinalist(
  seedId: string,
  isFinalist: boolean
): Promise<Seed> {
  const { data, error } = await supabase
    .from('seeds')
    .update({ is_finalist: isFinalist })
    .eq('id', seedId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Bulk update selection state
 */
export async function bulkSetSelected(
  seedIds: string[],
  isSelected: boolean
): Promise<void> {
  const { error } = await supabase
    .from('seeds')
    .update({ is_selected: isSelected })
    .in('id', seedIds);

  if (error) throw error;
}

/**
 * Delete seeds
 */
export async function deleteSeeds(seedIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('seeds')
    .delete()
    .in('id', seedIds);

  if (error) throw error;
}

/**
 * Get seeds by generation method (for counting)
 */
export async function getSeedsByMethod(
  sessionId: string,
  method: string
): Promise<Seed[]> {
  const { data, error } = await supabase
    .from('seeds')
    .select('*')
    .eq('session_id', sessionId)
    .eq('generation_method', method)
    .order('position', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
