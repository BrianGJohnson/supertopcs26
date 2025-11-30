"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefineTable } from "./RefineTable";
import { FilterToolbar, FilterState, phraseMatchesFilter, phraseBelowThreshold, PhraseScores } from "./FilterToolbar";
import { ActionToolbar } from "./ActionToolbar";
import { JumpToTitleModal } from "./JumpToTitleModal";
import { getSeedsBySession } from "@/hooks/useSeedPhrases";
import { supabase } from "@/lib/supabase";
import type { Seed } from "@/types/database";

// =============================================================================
// TYPES
// =============================================================================

interface SeedAnalysis {
  seed_id: string;
  topic_strength: number | null;
  audience_fit: number | null;
  popularity: number | null;
  competition: number | null;
  is_hidden?: boolean;
}

interface RefinePhrase {
  id: string;
  phrase: string;
  source: "seed" | "top10" | "child" | "az" | "prefix";
  topic: number | null;
  fit: number | null;
  pop: number | null;
  comp: number | null;
  spread: number | null;
  isStarred: boolean;
  isRejected: boolean;
  isHidden: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function mapSeedToRefinePhrase(seed: Seed, analysis?: SeedAnalysis): RefinePhrase {
  // Map generation_method to source type
  const sourceMap: Record<string, RefinePhrase["source"]> = {
    seed: "seed",
    top10: "top10",
    child: "child",
    az: "az",
    prefix: "prefix",
  };
  
  // Calculate spread (if we have all scores)
  let spread: number | null = null;
  if (analysis?.topic_strength != null && 
      analysis?.audience_fit != null && 
      analysis?.popularity != null && 
      analysis?.competition != null) {
    const scores = [
      analysis.topic_strength,
      analysis.audience_fit,
      analysis.popularity,
      analysis.competition,
    ];
    spread = Math.max(...scores) - Math.min(...scores);
  }
  
  return {
    id: seed.id,
    phrase: seed.phrase,
    source: sourceMap[seed.generation_method || "seed"] || "seed",
    topic: analysis?.topic_strength ?? null,
    fit: analysis?.audience_fit ?? null,
    pop: analysis?.popularity ?? null,
    comp: analysis?.competition ?? null,
    spread,
    isStarred: seed.is_selected || false,
    isRejected: false,
    isHidden: analysis?.is_hidden ?? false,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringProgress, setScoringProgress] = useState<{ current: number; total: number } | undefined>();
  const [sessionName, setSessionName] = useState("Session");
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  
  // Filter state with defaults: Medium + Long, English only, Topic metric
  // scoreThreshold starts at 0 and will be auto-set when scores load
  const [filterState, setFilterState] = useState<FilterState>({
    lengths: new Set(["medium", "long"]),
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
      // Fetch session name
      const { data: session } = await supabase
        .from("sessions")
        .select("name")
        .eq("id", sessionId)
        .single();
      
      if (session?.name) {
        setSessionName(session.name);
      }
      
      // Fetch seeds
      const seeds = await getSeedsBySession(sessionId);
      
      // Fetch analysis for all seeds
      const seedIds = seeds.map(s => s.id);
      const { data: analyses } = await supabase
        .from("seed_analysis")
        .select("seed_id, topic_strength, audience_fit, popularity, competition, is_hidden")
        .in("seed_id", seedIds);
      
      // Create lookup map
      const analysisMap = new Map<string, SeedAnalysis>();
      analyses?.forEach(a => analysisMap.set(a.seed_id, a));
      
      // Map seeds to RefinePhrase with analysis
      const refinePhrases = seeds.map(seed => 
        mapSeedToRefinePhrase(seed, analysisMap.get(seed.id))
      );
      
      setPhrases(refinePhrases);
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
  const handleToggleStar = useCallback((id: string) => {
    setPhrases(prev => prev.map(p => 
      p.id === id ? { ...p, isStarred: !p.isStarred } : p
    ));
    // TODO: Persist to database
  }, []);
  
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
      const scores: PhraseScores = { topic: p.topic, fit: p.fit, pop: p.pop, comp: p.comp, spread: p.spread };
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
  
  const handleAutoPick = useCallback(() => {
    // TODO: Implement auto-pick logic
    console.log("Auto-Pick clicked");
  }, []);
  
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
        const scores: PhraseScores = { topic: p.topic, fit: p.fit, pop: p.pop, comp: p.comp, spread: p.spread };
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
      const scores: PhraseScores = { topic: p.topic, fit: p.fit, pop: p.pop, comp: p.comp, spread: p.spread };
      return phraseMatchesFilter(p.phrase, filterState, scores);
    })
    .sort((a, b) => {
      const orderA = sourceOrder[a.source] ?? 99;
      const orderB = sourceOrder[b.source] ?? 99;
      return orderA - orderB;
    });
  const starredCount = starredPhrases.length;
  const canContinue = starredCount >= 10; // Require at least 10 starred phrases
  
  // Build score data for threshold calculation
  const scoreData = useMemo(() => {
    const data = {
      topic: [] as number[],
      fit: [] as number[],
      pop: [] as number[],
      comp: [] as number[],
      spread: [] as number[],
    };
    nonHiddenPhrases.forEach(p => {
      if (p.topic !== null) data.topic.push(p.topic);
      if (p.fit !== null) data.fit.push(p.fit);
      if (p.pop !== null) data.pop.push(p.pop);
      if (p.comp !== null) data.comp.push(p.comp);
      if (p.spread !== null) data.spread.push(p.spread);
    });
    return data;
  }, [nonHiddenPhrases]);
  
  // Auto-set threshold (53%) and preset button (58%) ONCE when scores become available
  // After this, we never touch these values again - user is in control
  useEffect(() => {
    if (thresholdAutoSet) return; // Already set, never change again
    
    const scores = scoreData[filterState.scoreMetric];
    if (!scores || scores.length === 0) return;
    
    // Only auto-set if we have meaningful scores
    if (scores.length >= 10) {
      const sorted = [...scores].sort((a, b) => a - b);
      
      // Calculate 53rd percentile for stepper
      const index53 = Math.floor(sorted.length * 0.53);
      const threshold53 = sorted[index53] ?? 65;
      
      // Calculate 58th percentile for preset button
      const index58 = Math.floor(sorted.length * 0.58);
      const threshold58 = sorted[index58] ?? 70;
      
      setFilterState(prev => ({ ...prev, scoreThreshold: threshold53 }));
      setPresetValue(threshold58);
      setThresholdAutoSet(true);
      
      console.log(`[RefinePageContent] Auto-set threshold=${threshold53}, preset=${threshold58} (${scores.length} scores)`);
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
          onAutoPick={handleAutoPick}
          onContinue={handleContinue}
          onJumpToTitle={handleJumpToTitle}
          canContinue={canContinue}
          isScoring={isScoring}
          scoringProgress={scoringProgress}
        />
      </div>
      
      {/* Table */}
      <div className="pt-8">
        <RefineTable
          phrases={visiblePhrases}
          onToggleStar={handleToggleStar}
          onToggleReject={handleToggleReject}
          onToggleSelect={handleToggleSelect}
          selectedIds={selectedIds}
          starredCount={starredCount}
        />
      </div>
      
      {/* Jump to Title Modal */}
      <JumpToTitleModal
        isOpen={isJumpModalOpen}
        onClose={() => setIsJumpModalOpen(false)}
        starredPhrases={starredPhrases.map(p => ({ id: p.id, phrase: p.phrase }))}
        onGo={handleJumpModalGo}
      />
    </div>
  );
}
