"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefineTable } from "./RefineTable";
import { FilterToolbar, FilterState, phraseMatchesFilter, phraseBelowThreshold, PhraseScores } from "./FilterToolbar";
import { isOutdatedPhrase } from "@/lib/phrase-filtering";
import { ActionToolbar } from "./ActionToolbar";
import { JumpToTitleModal } from "./JumpToTitleModal";
import { OpportunityModal } from "@/components/ui/OpportunityModal";
import { calculateOpportunityScore, buildHotAnchors, type SessionContext } from "@/lib/opportunity-scoring";
import { getSeedsBySession } from "@/hooks/useSeedPhrases";
import { supabase } from "@/lib/supabase";
import type { Seed, IntakeStats } from "@/types/database";
// NOTE: DEM column uses the 'demand' column from Apify scoring
// OPP column uses the 'opportunity' column
// See docs/1-gemini-demand-scoring.md for the scoring algorithm

// =============================================================================
// TYPES
// =============================================================================

interface SeedAnalysis {
  seed_id: string;
  topic_strength: number | null;
  audience_fit: number | null;
  demand: number | null; // Apify autocomplete-based demand score
  opportunity: number | null; // Opportunity score (lower competition = higher opportunity)
  ltv_score: number | null; // Long-Term Views score (Top 10 alignment)
  is_hidden?: boolean;
  extra?: {
    demand_v2?: {
      suggestionCount?: number;
      exactMatchCount?: number;
      topicMatchCount?: number;
    };
  };
}

interface RefinePhrase {
  id: string;
  phrase: string;
  source: "seed" | "top10" | "child" | "az" | "prefix";
  topic: number | null;
  fit: number | null;
  demand: number | null;
  opp: number | null;
  ltvScore: number; // Long-Term Views score (0-100)
  isStarred: boolean;
  isRejected: boolean;
  isHidden: boolean;
  // For opportunity modal
  suggestionCount: number;
  exactMatchCount: number;
  topicMatchCount: number;
  generationMethod: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

function mapSeedToRefinePhrase(
  seed: Seed,
  analysis?: SeedAnalysis
): RefinePhrase {
  // Map generation_method to source type
  // Child variations (child_phrase, child_prefix_how_to, child_prefix_what_does) all map to "child"
  const getSource = (method: string | null): RefinePhrase["source"] => {
    if (!method) return "seed";
    if (method.startsWith("child")) return "child";
    const sourceMap: Record<string, RefinePhrase["source"]> = {
      seed: "seed",
      top10: "top10",
      az: "az",
      prefix: "prefix",
    };
    return sourceMap[method] || "seed";
  };

  const source = getSource(seed.generation_method);

  // Use database 'demand' column (from Apify autocomplete scoring)
  // No fallback - if not scored, show dash
  const demandScore: number | null = analysis?.demand ?? null;

  return {
    id: seed.id,
    phrase: seed.phrase,
    source,
    topic: analysis?.topic_strength ?? null,
    fit: analysis?.audience_fit ?? null,
    demand: demandScore,  // From 'demand' column (Apify autocomplete)
    opp: analysis?.opportunity ?? null,
    ltvScore: analysis?.ltv_score ?? 0,
    isStarred: seed.is_selected || false,
    isRejected: false,
    isHidden: analysis?.is_hidden ?? false,
    // For opportunity modal
    suggestionCount: analysis?.extra?.demand_v2?.suggestionCount ?? 0,
    exactMatchCount: analysis?.extra?.demand_v2?.exactMatchCount ?? 0,
    topicMatchCount: analysis?.extra?.demand_v2?.topicMatchCount ?? 0,
    generationMethod: seed.generation_method,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RefinePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  // State
  const [phrases, setPhrases] = useState<RefinePhrase[]>([]);
  const [intakeStats, setIntakeStats] = useState<IntakeStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringProgress, setScoringProgress] = useState<{ current: number; total: number } | undefined>();
  const [sessionName, setSessionName] = useState("Session");
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [opportunityPhrase, setOpportunityPhrase] = useState<RefinePhrase | null>(null);
  const [seedPhrase, setSeedPhrase] = useState("");

  // Table sort state (controlled from parent so we can auto-sort after auto-pick)
  const [tableSortColumn, setTableSortColumn] = useState<"phrase" | "source" | "topic" | "fit" | "demand" | "opp" | "starred">("source");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("asc");

  // Filter state with defaults: Medium + Long, English only, Topic metric
  // scoreThreshold starts at 0 and will be auto-set when scores load
  const [filterState, setFilterState] = useState<FilterState>({
    lengths: new Set(["medium", "long"]),  // "Short" (2-5) and "Medium" (6-9) labels
    language: "english",
    searchQuery: "",
    scoreMetric: "topic",
    scoreThreshold: 0, // Will be auto-set based on score distribution
  });

  // Track if threshold has been auto-set (to avoid overriding user changes)
  const [thresholdAutoSet, setThresholdAutoSet] = useState(false);

  // Fixed preset value - calculated once, never changes
  const [presetValue, setPresetValue] = useState(70);

  // Fetch phrases and their analysis from database
  const fetchPhrases = useCallback(async () => {
    if (!sessionId) {
      setPhrases([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch session name and intake_stats
      const { data: session } = await supabase
        .from("sessions")
        .select("name, intake_stats")
        .eq("id", sessionId)
        .single();

      if (session?.name) {
        setSessionName(session.name);
      }

      // Store intake stats for demand scoring
      const loadedIntakeStats = session?.intake_stats as IntakeStats | null;
      setIntakeStats(loadedIntakeStats);

      if (loadedIntakeStats?.top9Demand) {
        console.log(`[RefinePageContent] Loaded intake stats with ${loadedIntakeStats.top9Demand.phrases?.length ?? 0} Top 9 phrases`);
      }

      // Fetch seeds
      const seeds = await getSeedsBySession(sessionId);

      // Find the seed phrase (generation_method = 'seed')
      const seedPhraseRecord = seeds.find(s => s.generation_method === 'seed');
      if (seedPhraseRecord) {
        setSeedPhrase(seedPhraseRecord.phrase);
      }

      // Fetch analysis for all seeds (including extra for autocomplete data)
      const seedIds = seeds.map(s => s.id);
      const { data: analyses } = await supabase
        .from("seed_analysis")
        .select("seed_id, topic_strength, audience_fit, demand, opportunity, ltv_score, is_hidden, extra")
        .in("seed_id", seedIds);

      // Create lookup map
      const analysisMap = new Map<string, SeedAnalysis>();
      analyses?.forEach(a => analysisMap.set(a.seed_id, a));

      // Map seeds to RefinePhrase - DEM uses 'demand' column from Apify scoring
      const refinePhrases = seeds.map(seed =>
        mapSeedToRefinePhrase(seed, analysisMap.get(seed.id))
      );

      // Log demand score distribution
      const demandScores = refinePhrases.map(p => p.demand).filter((p): p is number => p !== null);
      if (demandScores.length > 0) {
        const min = Math.min(...demandScores);
        const max = Math.max(...demandScores);
        const avg = Math.round(demandScores.reduce((a, b) => a + b, 0) / demandScores.length);
        console.log(`[RefinePageContent] Demand scores: min=${min}, max=${max}, avg=${avg}, count=${demandScores.length}`);
      }

      setPhrases(refinePhrases);

      // Auto-hide outdated phrases (past months/years) on page load
      // This saves money by not scoring irrelevant phrases
      if (seedPhraseRecord) {
        const currentSeedPhrase = seedPhraseRecord.phrase;
        const phrasesToHide: string[] = [];

        refinePhrases.forEach(phrase => {
          // Skip if already hidden
          if (phrase.isHidden) return;

          // Check if phrase is outdated
          if (isOutdatedPhrase(phrase.phrase, currentSeedPhrase)) {
            phrasesToHide.push(phrase.id);
          }
        });

        // Auto-hide outdated phrases in database
        if (phrasesToHide.length > 0) {
          console.log(`[RefinePageContent] Auto-hiding ${phrasesToHide.length} outdated phrases`);

          // Update database
          try {
            const { error } = await supabase
              .from("seed_analysis")
              .update({ is_hidden: true })
              .in("seed_id", phrasesToHide);

            if (error) {
              console.error("[RefinePageContent] Failed to auto-hide outdated phrases:", error);
            } else {
              // Update local state to reflect hidden phrases
              setPhrases(prev => prev.map(p =>
                phrasesToHide.includes(p.id) ? { ...p, isHidden: true } : p
              ));
            }
          } catch (err) {
            console.error("[RefinePageContent] Failed to auto-hide outdated phrases:", err);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load phrases:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    fetchPhrases();
  }, [fetchPhrases]);

  // Handlers
  const handleToggleStar = useCallback(async (id: string) => {
    // Find current phrase to get its current starred state
    const currentPhrase = phrases.find(p => p.id === id);
    if (!currentPhrase) return;

    const newStarredState = !currentPhrase.isStarred;

    // Optimistically update local state
    setPhrases(prev => prev.map(p =>
      p.id === id ? { ...p, isStarred: newStarredState } : p
    ));

    // Also update opportunityPhrase if it's the same phrase
    if (opportunityPhrase?.id === id) {
      setOpportunityPhrase(prev => prev ? { ...prev, isStarred: newStarredState } : null);
    }

    // Persist to database (seeds.is_selected field)
    try {
      const { error } = await supabase
        .from("seeds")
        .update({ is_selected: newStarredState })
        .eq("id", id);

      if (error) {
        console.error("[RefinePageContent] Failed to save star state:", error);
        // Revert on error
        setPhrases(prev => prev.map(p =>
          p.id === id ? { ...p, isStarred: currentPhrase.isStarred } : p
        ));
      }
    } catch (error) {
      console.error("[RefinePageContent] Error saving star state:", error);
    }
  }, [phrases, opportunityPhrase]);

  const handleToggleReject = useCallback((id: string) => {
    setPhrases(prev => prev.map(p =>
      p.id === id ? { ...p, isRejected: !p.isRejected } : p
    ));
    // TODO: Persist to database (soft delete)
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Topic Strength Scoring Handler
  const handleRunTopicScoring = useCallback(async () => {
    if (!sessionId || isScoring) return;

    // Get visible phrase IDs - only score what's currently shown
    const nonHidden = phrases.filter(p => !p.isRejected && !p.isHidden);
    const visible = nonHidden.filter(p => {
      const scores: PhraseScores = { topic: p.topic, fit: p.fit, demand: p.demand, opp: p.opp };
      return phraseMatchesFilter(p.phrase, filterState, scores);
    });
    const visibleIds = visible.map(p => p.id);

    if (visibleIds.length === 0) {
      console.log("[RefinePageContent] No visible phrases to score");
      return;
    }

    setIsScoring(true);
    setScoringProgress({ current: 0, total: visibleIds.length });

    // Create abort controller with 5 minute timeout (scoring 400+ phrases takes ~30-60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    try {
      console.log(`[RefinePageContent] Starting Topic Strength scoring for ${visibleIds.length} visible phrases`);
      console.log(`[RefinePageContent] Calling: /api/sessions/${sessionId}/score-topic`);

      const response = await fetch(`/api/sessions/${sessionId}/score-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedIds: visibleIds }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[RefinePageContent] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Scoring failed");
      }

      const result = await response.json();

      console.log(`[RefinePageContent] Scoring complete:`, result.distribution);

      // Update local state with new scores
      const scoreMap = new Map<string, number>();
      result.results.forEach((r: { seedId: string; score: number }) => {
        scoreMap.set(r.seedId, r.score);
      });

      setPhrases(prev => prev.map(p => ({
        ...p,
        topic: scoreMap.get(p.id) ?? p.topic,
      })));

      // Show success feedback
      // TODO: Add toast notification
      console.log(`[RefinePageContent] Updated ${result.totalScored} phrases with Topic Strength scores`);

    } catch (error) {
      clearTimeout(timeoutId);
      console.error("[RefinePageContent] Topic scoring failed:", error);
      console.error("[RefinePageContent] Error type:", error instanceof TypeError ? "TypeError (network/fetch issue)" : "Other");
      console.error("[RefinePageContent] Session ID was:", sessionId);
      console.error("[RefinePageContent] Visible IDs count:", visibleIds.length);
      // TODO: Show error toast
    } finally {
      setIsScoring(false);
      setScoringProgress(undefined);
    }
  }, [sessionId, isScoring, phrases, filterState]);

  // Audience Fit Scoring Handler
  const handleRunAudienceFitScoring = useCallback(async () => {
    if (!sessionId || isScoring) return;

    // Get visible phrase IDs - only score what's currently shown
    const nonHidden = phrases.filter(p => !p.isRejected && !p.isHidden);
    const visible = nonHidden.filter(p => {
      const scores: PhraseScores = { topic: p.topic, fit: p.fit, demand: p.demand, opp: p.opp };
      return phraseMatchesFilter(p.phrase, filterState, scores);
    });
    const visibleIds = visible.map(p => p.id);

    if (visibleIds.length === 0) {
      console.log("[RefinePageContent] No visible phrases to score");
      return;
    }

    setIsScoring(true);
    setScoringProgress({ current: 0, total: visibleIds.length });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    try {
      console.log(`[RefinePageContent] Starting Audience Fit scoring for ${visibleIds.length} visible phrases`);

      const response = await fetch(`/api/sessions/${sessionId}/score-audience-fit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedIds: visibleIds }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[RefinePageContent] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Audience Fit scoring failed");
      }

      const result = await response.json();

      console.log(`[RefinePageContent] Audience Fit scoring complete:`, result.distribution);

      // Update local state with new scores
      const scoreMap = new Map<string, number>();
      result.results.forEach((r: { seedId: string; score: number }) => {
        scoreMap.set(r.seedId, r.score);
      });

      setPhrases(prev => prev.map(p => ({
        ...p,
        fit: scoreMap.get(p.id) ?? p.fit,
      })));

      console.log(`[RefinePageContent] Updated ${result.totalScored} phrases with Audience Fit scores`);

    } catch (error) {
      clearTimeout(timeoutId);
      console.error("[RefinePageContent] Audience Fit scoring failed:", error);
      // TODO: Show error toast
    } finally {
      setIsScoring(false);
      setScoringProgress(undefined);
    }
  }, [sessionId, isScoring, phrases, filterState]);

  // Demand Scoring Handler (uses Apify autocomplete)
  const handleRunDemandScoring = useCallback(async () => {
    console.log("[RefinePageContent] handleRunDemandScoring called");
    console.log("[RefinePageContent] sessionId:", sessionId, "isScoring:", isScoring);

    if (!sessionId || isScoring) {
      console.log("[RefinePageContent] Early return - no sessionId or already scoring");
      return;
    }

    // Get visible phrase IDs - only score what's currently shown
    const nonHidden = phrases.filter(p => !p.isRejected && !p.isHidden);
    console.log("[RefinePageContent] nonHidden count:", nonHidden.length);

    const visible = nonHidden.filter(p => {
      const scores: PhraseScores = { topic: p.topic, fit: p.fit, demand: p.demand, opp: p.opp };
      return phraseMatchesFilter(p.phrase, filterState, scores);
    });
    const visibleIds = visible.map(p => p.id);
    console.log("[RefinePageContent] visible count:", visible.length);

    // Validate 75 phrase limit
    if (visibleIds.length > 75) {
      console.error(`[RefinePageContent] Too many phrases for demand scoring: ${visibleIds.length}. Max is 75.`);
      // TODO: Show error toast
      return;
    }

    if (visibleIds.length === 0) {
      console.log("[RefinePageContent] No visible phrases to score");
      return;
    }

    setIsScoring(true);
    setScoringProgress({ current: 0, total: visibleIds.length });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000); // 3 min timeout

    try {
      console.log(`[RefinePageContent] Starting Demand scoring for ${visibleIds.length} visible phrases`);

      const response = await fetch(`/api/sessions/${sessionId}/score-demand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedIds: visibleIds }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[RefinePageContent] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Demand scoring failed");
      }

      const result = await response.json();

      console.log(`[RefinePageContent] Demand scoring complete:`, result.distribution);
      console.log(`[RefinePageContent] Cost: ~$${result.estimatedCostUsd?.toFixed(3)}`);

      // Update local state with new scores
      const scoreMap = new Map<string, number>();
      result.results.forEach((r: { seedId: string; score: number }) => {
        scoreMap.set(r.seedId, r.score);
      });

      setPhrases(prev => prev.map(p => ({
        ...p,
        demand: scoreMap.get(p.id) ?? p.demand,
      })));

      console.log(`[RefinePageContent] Updated ${result.totalScored} phrases with Demand scores`);

    } catch (error) {
      clearTimeout(timeoutId);
      console.error("[RefinePageContent] Demand scoring failed:", error);
      // TODO: Show error toast
    } finally {
      setIsScoring(false);
      setScoringProgress(undefined);
    }
  }, [sessionId, isScoring, phrases, filterState]);

  // Opportunity Scoring Handler (uses existing session data, no API calls)
  const handleRunOpportunityScoring = useCallback(async () => {
    console.log("[RefinePageContent] handleRunOpportunityScoring called");

    if (!sessionId || isScoring) {
      console.log("[RefinePageContent] Early return - no sessionId or already scoring");
      return;
    }

    setIsScoring(true);

    try {
      // Build session context for opportunity scoring
      const sessionPhrases = phrases.map(p => ({
        phrase: p.phrase,
        demand: p.demand,
      }));

      const hotAnchors = buildHotAnchors(sessionPhrases);

      const context: SessionContext = {
        allPhrases: sessionPhrases,
        hotAnchors,
        seedPhrase,
      };

      // Calculate opportunity scores for visible phrases with demand scores
      const visible = phrases.filter(p => !p.isRejected && !p.isHidden && p.demand !== null);
      const updates: { id: string; opportunity: number }[] = [];

      for (const p of visible) {
        const input = {
          phrase: p.phrase,
          demand: p.demand,
          suggestionCount: p.suggestionCount,
          exactMatchCount: p.exactMatchCount,
          topicMatchCount: p.topicMatchCount,
          generationMethod: p.generationMethod,
        };

        const result = calculateOpportunityScore(input, context);
        updates.push({ id: p.id, opportunity: result.score });
      }

      console.log(`[RefinePageContent] Calculated opportunity scores for ${updates.length} phrases`);

      // Save to database
      for (const update of updates) {
        await supabase
          .from("seed_analysis")
          .update({ opportunity: update.opportunity })
          .eq("seed_id", update.id);
      }

      // Update local state - opportunity maps to 'opp' field in RefinePhrase
      const scoreMap = new Map(updates.map(u => [u.id, u.opportunity]));
      setPhrases(prev => prev.map(p => ({
        ...p,
        opp: scoreMap.get(p.id) ?? p.opp,
      })));

      console.log(`[RefinePageContent] Opportunity scoring complete`);

    } catch (error) {
      console.error("[RefinePageContent] Opportunity scoring failed:", error);
    } finally {
      setIsScoring(false);
    }
  }, [sessionId, isScoring, phrases, seedPhrase]);

  const handleAutoPick = useCallback(async () => {
    const AUTO_PICK_TARGET = 18;

    // Get currently starred phrases (keep them)
    const currentlyStarred = phrases.filter(p => p.isStarred);
    const currentStarredCount = currentlyStarred.length;

    // If already at or above target, nothing to do
    if (currentStarredCount >= AUTO_PICK_TARGET) {
      console.log("[RefinePageContent] Already at or above auto-pick target");
      return;
    }

    // How many more do we need?
    const toAdd = AUTO_PICK_TARGET - currentStarredCount;

    // Get candidate phrases: visible, not rejected, not hidden, not already starred, has scores
    const candidates = phrases.filter(p =>
      !p.isStarred &&
      !p.isRejected &&
      !p.isHidden &&
      p.topic !== null &&
      p.fit !== null &&
      p.demand !== null &&
      p.opp !== null
    );

    // Calculate composite score for each candidate
    // Formula: Opportunity 35%, Audience Fit 25%, Topic Strength 25%, Demand 15%
    // Plus boosts: LTV (+8 if score >= 50), Length (+3 for 4-6 words, -2 for 3 words, -5 for 2 words)
    const scored = candidates.map(p => {
      const topic = p.topic ?? 0;
      const fit = p.fit ?? 0;
      const demand = p.demand ?? 0;
      const opp = p.opp ?? 0;
      const ltvScore = p.ltvScore ?? 0;

      // Base composite score
      let compositeScore = (
        (opp * 0.35) +      // Opportunity: 35% - Low competition is key
        (fit * 0.25) +      // Audience Fit: 25% - Will subs click?
        (topic * 0.25) +    // Topic Strength: 25% - Good video topic?
        (demand * 0.15)     // Demand: 15% - People searching? (lower because high demand = hard to rank)
      );

      // LTV boost: phrases with strong Top 10 alignment get long-term views
      if (ltvScore >= 50) {
        compositeScore += 8;
      }

      // Length adjustments: prefer 4-6 word phrases
      const wordCount = p.phrase.split(' ').length;
      if (wordCount >= 4 && wordCount <= 6) {
        compositeScore += 3;  // Ideal length boost
      } else if (wordCount === 3) {
        compositeScore -= 2;  // Slight penalty for short
      } else if (wordCount <= 2) {
        compositeScore -= 5;  // Strong penalty for very short
      }

      return {
        phrase: p,
        score: compositeScore,
        hasLtvBoost: ltvScore >= 50,
      };
    });

    // ============================================================
    // DIVERSITY SELECTION: Multi-factor variety for best auto-picks
    // ============================================================

    // Helper: Check if phrase is a question
    const isQuestion = (text: string): boolean => {
      const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'which', 'can', 'does', 'is', 'are', 'do', 'will', 'should'];
      const firstWord = text.toLowerCase().split(' ')[0];
      return questionWords.includes(firstWord) || text.endsWith('?');
    };

    // Helper: Get phrase length category
    const getLengthCategory = (text: string): 'short' | 'medium' | 'long' => {
      const wordCount = text.split(' ').length;
      if (wordCount <= 3) return 'short';
      if (wordCount <= 6) return 'medium';  // 4-6 words is ideal
      return 'long';
    };

    // Helper: Get content words (for overlap detection)
    const getContentWords = (text: string): Set<string> => {
      const stopWords = new Set(['how', 'to', 'the', 'a', 'an', 'in', 'on', 'for', 'is', 'are', 'and', 'or', 'what', 'why', 'when', 'where', 'who', 'which', 'your', 'my', 'this', 'that', 'with', 'from', 'of', 'do', 'does', 'can', 'will', 'should']);
      return new Set(
        text.toLowerCase().split(/\s+/)
          .filter(w => w.length >= 2 && !stopWords.has(w))
      );
    };

    // Helper: Calculate word overlap percentage
    const getWordOverlap = (words1: Set<string>, words2: Set<string>): number => {
      if (words1.size === 0 || words2.size === 0) return 0;
      let overlap = 0;
      for (const word of words1) {
        if (words2.has(word)) overlap++;
      }
      const minSize = Math.min(words1.size, words2.size);
      return overlap / minSize;
    };

    // Categorize all candidates
    const categorized = scored.map(item => ({
      ...item,
      isQuestion: isQuestion(item.phrase.phrase),
      lengthCategory: getLengthCategory(item.phrase.phrase),
      contentWords: getContentWords(item.phrase.phrase),
      method: item.phrase.generationMethod || 'unknown',
    }));

    // Sort by composite score
    categorized.sort((a, b) => b.score - a.score);

    // Smart selection with diversity constraints
    const selected: typeof categorized = [];
    const OVERLAP_THRESHOLD = 0.70; // Skip if 70%+ word overlap
    const TARGET_QUESTION_RATIO = 0.40; // ~40% questions, 60% statements
    const TARGET_LTV_RATIO = 0.40; // Target 35-45% LTV phrases
    const MIN_LTV_RATIO = 0.30; // Minimum acceptable LTV ratio

    // Track diversity stats
    let questionCount = 0;
    let statementCount = 0;
    let ltvCount = 0;
    const lengthCounts = { short: 0, medium: 0, long: 0 };
    const methodCounts = new Map<string, number>();

    for (const candidate of categorized) {
      if (selected.length >= toAdd) break;

      // Check word overlap with already selected phrases
      let hasTooMuchOverlap = false;
      for (const sel of selected) {
        const overlap = getWordOverlap(candidate.contentWords, sel.contentWords);
        if (overlap > OVERLAP_THRESHOLD) {
          hasTooMuchOverlap = true;
          break;
        }
      }
      if (hasTooMuchOverlap) continue;

      // Check question/statement balance
      const currentQuestionRatio = selected.length > 0
        ? questionCount / selected.length
        : 0;

      // Soft preference: if we have too many questions, prefer statements (and vice versa)
      if (candidate.isQuestion && currentQuestionRatio > TARGET_QUESTION_RATIO + 0.15) {
        // We have enough questions, but still consider if score is very high
        if (candidate.score < categorized[0].score * 0.85) continue;
      }
      if (!candidate.isQuestion && currentQuestionRatio < TARGET_QUESTION_RATIO - 0.15 && selected.length > 3) {
        // We need more questions, but still consider if score is very high
        if (candidate.score < categorized[0].score * 0.85) continue;
      }

      // LTV balance: prefer LTV phrases if we're below target
      const currentLtvRatio = selected.length > 0 ? ltvCount / selected.length : 0;
      if (!candidate.hasLtvBoost && currentLtvRatio < MIN_LTV_RATIO && selected.length >= 5) {
        // We need more LTV phrases, skip non-LTV unless score is exceptional
        if (candidate.score < categorized[0].score * 0.90) continue;
      }

      // Check method diversity (soft limit: no more than 6 from same method)
      const methodCount = methodCounts.get(candidate.method) || 0;
      if (methodCount >= 6) {
        // Skip if this method already has 6, unless score is exceptional
        if (candidate.score < categorized[0].score * 0.90) continue;
      }

      // Check length diversity (soft limit: no more than 8 of same length)
      if (lengthCounts[candidate.lengthCategory] >= 8) {
        if (candidate.score < categorized[0].score * 0.90) continue;
      }

      // This candidate passes all diversity checks - select it!
      selected.push(candidate);

      // Update counters
      if (candidate.isQuestion) questionCount++;
      else statementCount++;
      if (candidate.hasLtvBoost) ltvCount++;
      lengthCounts[candidate.lengthCategory]++;
      methodCounts.set(candidate.method, (methodCounts.get(candidate.method) || 0) + 1);
    }

    // If we still need more, relax constraints and fill from remaining
    if (selected.length < toAdd) {
      const selectedIds = new Set(selected.map(s => s.phrase.id));
      for (const candidate of categorized) {
        if (selected.length >= toAdd) break;
        if (selectedIds.has(candidate.phrase.id)) continue;

        // Only check hard constraint: word overlap
        let hasTooMuchOverlap = false;
        for (const sel of selected) {
          if (getWordOverlap(candidate.contentWords, sel.contentWords) > 0.85) {
            hasTooMuchOverlap = true;
            break;
          }
        }
        if (!hasTooMuchOverlap) {
          selected.push(candidate);
          if (candidate.isQuestion) questionCount++;
          else statementCount++;
        }
      }
    }

    const idsToStar = selected.map(s => s.phrase.id);

    // Log comprehensive diversity stats
    console.log(`[RefinePageContent] Auto-picking ${selected.length} phrases with diversity:`, {
      methods: Object.fromEntries(methodCounts),
      questions: questionCount,
      statements: statementCount,
      lengths: lengthCounts,
    });

    // Update local state
    setPhrases(prev => prev.map(p =>
      idsToStar.includes(p.id) ? { ...p, isStarred: true } : p
    ));

    // Auto-sort by starred (desc) to bring starred phrases to top
    setTableSortColumn("starred");
    setTableSortDirection("desc");

    // Persist to database
    try {
      for (const id of idsToStar) {
        await supabase
          .from("seeds")
          .update({ is_selected: true })
          .eq("id", id);
      }
      console.log(`[RefinePageContent] Saved ${idsToStar.length} auto-picked phrases to database`);
    } catch (error) {
      console.error("[RefinePageContent] Failed to save auto-picked phrases:", error);
    }
  }, [phrases]);

  const handleSelectAll = useCallback(() => {
    // Toggle: if all visible are selected, deselect all; otherwise select all visible
    const visibleIds = phrases.filter(p => !p.isRejected && !p.isHidden).map(p => p.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  }, [phrases, selectedIds]);

  // Select phrases based on current filter context:
  // - If search query exists: select ALL visible phrases (for text-based hiding workflow)
  // - If no search query: select phrases BELOW threshold (for score-based hiding workflow)
  const handleSelectFiltered = useCallback(() => {
    const hasSearchQuery = filterState.searchQuery.trim().length > 0;

    const selectedPhraseIds = phrases
      .filter(p => {
        if (p.isRejected || p.isHidden) return false;
        const scores: PhraseScores = { topic: p.topic, fit: p.fit, demand: p.demand, opp: p.opp };
        // Must match basic filters (length, language, search)
        if (!phraseMatchesFilter(p.phrase, filterState, scores)) return false;

        // If searching: select all visible matches
        // If not searching: only select those below threshold
        if (hasSearchQuery) {
          return true; // Select all that match the search
        } else {
          return phraseBelowThreshold(filterState, scores);
        }
      })
      .map(p => p.id);
    setSelectedIds(new Set(selectedPhraseIds));
  }, [phrases, filterState]);

  // Hide selected phrases (soft delete)
  const handleHideSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const idsToHide = Array.from(selectedIds);

    // Update local state immediately
    setPhrases(prev => prev.map(p =>
      selectedIds.has(p.id) ? { ...p, isHidden: true } : p
    ));
    setSelectedIds(new Set());

    // Clear search query after hiding (QoL: avoids empty results view)
    if (filterState.searchQuery) {
      setFilterState(prev => ({ ...prev, searchQuery: "" }));
    }

    // NOTE: We intentionally DO NOT reset thresholdAutoSet here
    // After the initial bulk hide, user enters "refinement mode" 
    // and uses +/- stepper for granular control

    // Persist to database
    try {
      const { error } = await supabase
        .from("seed_analysis")
        .update({ is_hidden: true })
        .in("seed_id", idsToHide);

      if (error) {
        console.error("Failed to hide phrases:", error);
        // Note: Column might not exist yet - that's okay, local state still works
      }
    } catch (err) {
      console.error("Failed to hide phrases:", err);
    }
  }, [selectedIds, filterState.searchQuery]);

  const handleContinue = useCallback(() => {
    if (sessionId) {
      router.push(`/members/build/super?session_id=${sessionId}`);
    }
  }, [sessionId, router]);

  // Jump to Title - power user shortcut
  // 1 starred = go directly, 2-10 starred = open modal to pick one, 11+ = show warning
  const starredPhrases = useMemo(() =>
    phrases.filter(p => p.isStarred && !p.isRejected && !p.isHidden),
    [phrases]
  );

  const handleJumpToTitle = useCallback(() => {
    if (starredPhrases.length === 1) {
      // Direct navigation with the single starred phrase
      if (sessionId) {
        router.push(`/members/build/title?session_id=${sessionId}&phrase_id=${starredPhrases[0].id}`);
      }
    } else if (starredPhrases.length > 1) {
      // Open modal to select one
      setIsJumpModalOpen(true);
    }
  }, [sessionId, router, starredPhrases]);

  const handleJumpModalGo = useCallback((selectedPhraseId: string) => {
    setIsJumpModalOpen(false);
    if (sessionId) {
      router.push(`/members/build/title?session_id=${sessionId}&phrase_id=${selectedPhraseId}`);
    }
  }, [sessionId, router]);

  // Computed values
  const nonHiddenPhrases = phrases.filter(p => !p.isRejected && !p.isHidden);

  // Source priority: seed=1, top10=2, child=3, az=4, prefix=5
  const sourceOrder: Record<string, number> = { seed: 1, top10: 2, child: 3, az: 4, prefix: 5 };

  const visiblePhrases = nonHiddenPhrases
    .filter(p => {
      const scores: PhraseScores = { topic: p.topic, fit: p.fit, demand: p.demand, opp: p.opp };
      return phraseMatchesFilter(p.phrase, filterState, scores);
    })
    .sort((a, b) => {
      const orderA = sourceOrder[a.source] ?? 99;
      const orderB = sourceOrder[b.source] ?? 99;
      return orderA - orderB;
    });
  const starredCount = starredPhrases.length;
  const canContinue = starredCount >= 10; // Require at least 10 starred phrases

  // Check if Topic Strength scoring is complete for all visible phrases
  // A. Fit only becomes available when ALL visible phrases have topic scores
  const topicStrengthComplete = useMemo(() => {
    if (visiblePhrases.length === 0) return false;
    return visiblePhrases.every(p => p.topic !== null);
  }, [visiblePhrases]);

  // Check if Audience Fit scoring is complete (enables Demand)
  // Consider complete if 95%+ of visible phrases have fit scores (allows for edge cases)
  const audienceFitComplete = useMemo(() => {
    if (visiblePhrases.length === 0) return false;
    const withFit = visiblePhrases.filter(p => p.fit !== null).length;
    const percentage = (withFit / visiblePhrases.length) * 100;
    const result = percentage >= 95; // 95% threshold instead of 100%
    console.log(`[RefinePageContent] Audience Fit check: ${withFit}/${visiblePhrases.length} (${percentage.toFixed(0)}%) have fit scores, complete=${result}`);
    return result;
  }, [visiblePhrases]);

  // Check if Demand scoring is complete (enables Opportunity)
  // Consider complete if 95%+ of visible phrases have demand scores
  const demandComplete = useMemo(() => {
    if (visiblePhrases.length === 0) return false;
    const withDemand = visiblePhrases.filter(p => p.demand !== null).length;
    const percentage = (withDemand / visiblePhrases.length) * 100;
    const result = percentage >= 95; // 95% threshold
    console.log(`[RefinePageContent] Demand check: ${withDemand}/${visiblePhrases.length} (${percentage.toFixed(0)}%) have demand scores, complete=${result}`);
    return result;
  }, [visiblePhrases]);

  // Check if Opportunity scoring is complete (enables Auto-Pick)
  // Consider complete if 95%+ of visible phrases have opportunity scores
  const opportunityComplete = useMemo(() => {
    if (visiblePhrases.length === 0) return false;
    const withOpp = visiblePhrases.filter(p => p.opp !== null).length;
    const percentage = (withOpp / visiblePhrases.length) * 100;
    const result = percentage >= 95; // 95% threshold
    console.log(`[RefinePageContent] Opportunity check: ${withOpp}/${visiblePhrases.length} (${percentage.toFixed(0)}%) have opp scores, complete=${result}`);
    return result;
  }, [visiblePhrases]);

  // Build score data for threshold calculation
  // Build score data for percentile-based color coding
  // IMPORTANT: Use ALL phrases (including rejected/hidden) so colors stay stable
  const scoreData = useMemo(() => {
    const data = {
      topic: [] as number[],
      fit: [] as number[],
      demand: [] as number[],
      opp: [] as number[],
    };
    // Use ALL phrases, not just nonHiddenPhrases, so color coding is stable
    phrases.forEach(p => {
      if (p.topic !== null) data.topic.push(p.topic);
      if (p.fit !== null) data.fit.push(p.fit);
      if (p.demand !== null) data.demand.push(p.demand);
      if (p.opp !== null) data.opp.push(p.opp);
    });
    console.log('[RefinePageContent] scoreData from ALL phrases:', {
      totalPhrases: phrases.length,
      topicScores: data.topic.length,
      topicRange: data.topic.length > 0 ? `${Math.min(...data.topic)}-${Math.max(...data.topic)}` : 'N/A',
    });
    return data;
  }, [phrases]);

  // Auto-set threshold (53%) and preset button (58%) ONCE when scores become available
  // After this, we never touch these values again - user is in control
  useEffect(() => {
    if (thresholdAutoSet) return; // Already set, never change again

    const scores = scoreData[filterState.scoreMetric];
    if (!scores || scores.length === 0) return;

    // Only auto-set if we have meaningful scores
    if (scores.length >= 10) {
      const sorted = [...scores].sort((a, b) => a - b);

      // Calculate 62nd percentile for stepper (shows top ~38%, targeting ~100 phrases)
      const index62 = Math.floor(sorted.length * 0.62);
      const threshold62 = sorted[index62] ?? 65;

      // Calculate 67th percentile for preset button
      const index67 = Math.floor(sorted.length * 0.67);
      const threshold67 = sorted[index67] ?? 70;

      setFilterState(prev => ({ ...prev, scoreThreshold: threshold62 }));
      setPresetValue(threshold67);
      setThresholdAutoSet(true);

      console.log(`[RefinePageContent] Auto-set threshold=${threshold62}, preset=${threshold67} (${scores.length} scores)`);
    }
  }, [scoreData, filterState.scoreMetric, thresholdAutoSet]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-14 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="h-14 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="h-96 bg-white/5 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // No session
  if (!sessionId) {
    return (
      <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
        <p className="text-white/60 text-lg">No session selected.</p>
        <p className="text-white/40 text-sm mt-2">
          Please start from Step 1 to generate phrases.
        </p>
        <button
          onClick={() => router.push("/members/build/seed")}
          className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go to Step 1
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Unified Toolbar Container */}
      <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl">
        {/* Filter Toolbar */}
        <FilterToolbar
          totalCount={nonHiddenPhrases.length}
          visibleCount={visiblePhrases.length}
          filterState={filterState}
          onFilterChange={setFilterState}
          selectedCount={selectedIds.size}
          onSelectFiltered={handleSelectFiltered}
          onHideSelected={handleHideSelected}
          presetValue={presetValue}
          scoreData={scoreData}
        />

        {/* Divider */}
        <div className="border-t border-white/[0.03]" />

        {/* Action Toolbar */}
        <ActionToolbar
          selectedCount={selectedIds.size}
          totalCount={visiblePhrases.length}
          starredCount={starredCount}
          sessionName={sessionName}
          onRunTopicScoring={handleRunTopicScoring}
          onRunFitScoring={handleRunAudienceFitScoring}
          onRunDemandScoring={handleRunDemandScoring}
          onRunOpportunityScoring={handleRunOpportunityScoring}
          onAutoPick={handleAutoPick}
          onContinue={handleContinue}
          onJumpToTitle={handleJumpToTitle}
          canContinue={canContinue}
          isScoring={isScoring}
          scoringProgress={scoringProgress}
          topicStrengthComplete={topicStrengthComplete}
          audienceFitComplete={audienceFitComplete}
          demandComplete={demandComplete}
          opportunityComplete={opportunityComplete}
          visiblePhraseCount={visiblePhrases.length}
        />
      </div>

      {/* Table */}
      <div className="pt-8">
        <RefineTable
          phrases={visiblePhrases}
          allScores={scoreData}
          onToggleStar={handleToggleStar}
          onToggleReject={handleToggleReject}
          onToggleSelect={handleToggleSelect}
          onPhraseClick={(phrase) => {
            // Only open modal if all scoring is complete
            const allScoringComplete = topicStrengthComplete && audienceFitComplete && demandComplete && opportunityComplete;
            if (allScoringComplete) {
              setOpportunityPhrase(phrase);
            } else {
              console.log("[RefinePageContent] Modal blocked - scoring not complete");
            }
          }}
          selectedIds={selectedIds}
          starredCount={starredCount}
          sortColumn={tableSortColumn}
          sortDirection={tableSortDirection}
          onSortChange={(col, dir) => {
            setTableSortColumn(col);
            setTableSortDirection(dir);
          }}
        />
      </div>

      {/* Jump to Title Modal */}
      <JumpToTitleModal
        isOpen={isJumpModalOpen}
        onClose={() => setIsJumpModalOpen(false)}
        starredPhrases={starredPhrases.map(p => ({ id: p.id, phrase: p.phrase }))}
        onGo={handleJumpModalGo}
      />

      {/* Opportunity Modal */}
      <OpportunityModal
        isOpen={opportunityPhrase !== null}
        onClose={() => setOpportunityPhrase(null)}
        phrase={opportunityPhrase ? {
          id: opportunityPhrase.id,
          phrase: opportunityPhrase.phrase,
          demand: opportunityPhrase.demand,
          suggestionCount: opportunityPhrase.suggestionCount,
          exactMatchCount: opportunityPhrase.exactMatchCount,
          topicMatchCount: opportunityPhrase.topicMatchCount,
          generationMethod: opportunityPhrase.generationMethod,
        } : null}
        sessionPhrases={phrases.map(p => ({ phrase: p.phrase, demand: p.demand }))}
        seedPhrase={seedPhrase}
        isStarred={opportunityPhrase?.isStarred ?? false}
        onToggleStar={(id) => handleToggleStar(id)}
      />
    </div>
  );
}
