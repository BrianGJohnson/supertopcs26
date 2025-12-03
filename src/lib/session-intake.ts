/**
 * Session Intake Operations
 * 
 * Handles saving Data Intake results to database
 * and session lifecycle management (auto-delete after 3 months)
 */

import { supabase } from '@/lib/supabase';
import { runDataIntake } from '@/lib/data-intake';
import type { IntakeStats } from '@/types/database';

/**
 * Top 9 phrase with position for demand scoring
 */
interface Top9Phrase {
  phrase: string;
  position: number;
}

/**
 * Run Data Intake for a session and save to database
 * Called when user clicks "Proceed to Refine" on Page 1
 */
export async function runAndSaveDataIntake(sessionId: string): Promise<IntakeStats> {
  // 1. Get session info (seed phrase)
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('seed_phrase')
    .eq('id', sessionId)
    .single();
  
  if (sessionError || !session?.seed_phrase) {
    throw new Error('Session not found or missing seed phrase');
  }
  
  // 2. Get all phrases for this session
  const { data: seeds, error: seedsError } = await supabase
    .from('seeds')
    .select('phrase, generation_method, position')
    .eq('session_id', sessionId);
  
  if (seedsError) {
    throw new Error('Failed to fetch phrases: ' + seedsError.message);
  }
  
  const allSeeds = seeds || [];
  const phrases = allSeeds.map(s => s.phrase);
  
  if (phrases.length === 0) {
    throw new Error('No phrases found for session');
  }
  
  // 3. Extract Top 9 phrases with their positions (for demand scoring)
  const top9Phrases: Top9Phrase[] = allSeeds
    .filter(s => s.generation_method === 'top10' && s.position !== null && s.position < 9)
    .map(s => ({ phrase: s.phrase, position: s.position as number }))
    .sort((a, b) => a.position - b.position);
  
  console.log(`[SessionIntake] Found ${top9Phrases.length} Top 9 phrases for demand scoring`);
  
  // 4. Run Data Intake algorithm with Top 9 data
  const intakeStats = runDataIntake(phrases, session.seed_phrase, top9Phrases);
  
  // 5. Save to database
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      intake_stats: intakeStats,
      total_phrases_generated: phrases.length,
      current_step: 2, // Move to Refine step
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  if (updateError) {
    throw new Error('Failed to save intake stats: ' + updateError.message);
  }
  
  return intakeStats;
}

/**
 * Get intake stats for a session (from database)
 */
export async function getIntakeStats(sessionId: string): Promise<IntakeStats | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('intake_stats')
    .eq('id', sessionId)
    .single();
  
  if (error || !data?.intake_stats) {
    return null;
  }
  
  return data.intake_stats as IntakeStats;
}

/**
 * Soft delete a session (keeps record for history, but marks as deleted)
 * Super Topics are NOT deleted - they're tied to channel, not session
 */
export async function softDeleteSession(sessionId: string): Promise<void> {
  // 1. Count super topics from this session (for reference)
  const { count: superTopicCount } = await supabase
    .from('super_topics')
    .select('*', { count: 'exact', head: true })
    .eq('source_session_id', sessionId);
  
  // 2. Update session to deleted status
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      total_super_topics: superTopicCount || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  if (updateError) {
    throw new Error('Failed to delete session: ' + updateError.message);
  }
  
  // 3. Delete seeds and seed_analysis (cascade will handle seed_analysis)
  const { error: deleteError } = await supabase
    .from('seeds')
    .delete()
    .eq('session_id', sessionId);
  
  if (deleteError) {
    throw new Error('Failed to delete phrases: ' + deleteError.message);
  }
  
  // Note: Super Topics are NOT deleted - they reference session by ID but don't cascade
}

/**
 * Hard delete a session (complete removal)
 * Only used for cleanup of very old sessions
 */
export async function hardDeleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);
  
  if (error) {
    throw new Error('Failed to hard delete session: ' + error.message);
  }
}

/**
 * Get sessions that should be auto-deleted (older than 3 months)
 * Returns sessions with status 'deleted' or 'completed' older than cutoff
 */
export async function getSessionsForCleanup(cutoffDays: number = 90): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
  
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .or('status.eq.deleted,status.eq.completed')
    .lt('updated_at', cutoffDate.toISOString());
  
  if (error) {
    console.error('Failed to get sessions for cleanup:', error);
    return [];
  }
  
  return (data || []).map(s => s.id);
}

/**
 * Run cleanup job - delete sessions older than 3 months
 * Should be called by a cron job or scheduled task
 */
export async function runSessionCleanup(): Promise<{ deleted: number; errors: number }> {
  const sessionIds = await getSessionsForCleanup(90); // 90 days = ~3 months
  
  let deleted = 0;
  let errors = 0;
  
  for (const sessionId of sessionIds) {
    try {
      await hardDeleteSession(sessionId);
      deleted++;
    } catch (err) {
      console.error(`Failed to delete session ${sessionId}:`, err);
      errors++;
    }
  }
  
  return { deleted, errors };
}

/**
 * Update session step (for navigation tracking)
 */
export async function updateSessionStep(sessionId: string, step: number): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      current_step: step,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  if (error) {
    throw new Error('Failed to update session step: ' + error.message);
  }
}

/**
 * Mark session as completed (user finished Page 3)
 */
export async function markSessionCompleted(sessionId: string, superTopicCount: number): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      current_step: 3,
      total_super_topics: superTopicCount,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  if (error) {
    throw new Error('Failed to mark session completed: ' + error.message);
  }
}
