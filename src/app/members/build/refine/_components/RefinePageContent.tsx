"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefineTable } from "./RefineTable";
import { FilterToolbar } from "./FilterToolbar";
import { ActionToolbar } from "./ActionToolbar";
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
  
  // Fetch phrases and their analysis from database
  const fetchPhrases = useCallback(async () => {
    if (!sessionId) {
      setPhrases([]);
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch seeds
      const seeds = await getSeedsBySession(sessionId);
      
      // Fetch analysis for all seeds
      const seedIds = seeds.map(s => s.id);
      const { data: analyses } = await supabase
        .from("seed_analysis")
        .select("seed_id, topic_strength, audience_fit, popularity, competition")
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
    
    setIsScoring(true);
    setScoringProgress({ current: 0, total: phrases.length });
    
    try {
      console.log(`[RefinePageContent] Starting Topic Strength scoring for session ${sessionId}`);
      
      const response = await fetch(`/api/sessions/${sessionId}/score-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
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
      console.error("[RefinePageContent] Topic scoring failed:", error);
      // TODO: Show error toast
    } finally {
      setIsScoring(false);
      setScoringProgress(undefined);
    }
  }, [sessionId, isScoring, phrases.length]);
  
  const handleAutoPick = useCallback(() => {
    // TODO: Implement auto-pick logic
    console.log("Auto-Pick clicked");
  }, []);
  
  const handleDeleteSelected = useCallback(() => {
    setPhrases(prev => prev.map(p => 
      selectedIds.has(p.id) ? { ...p, isRejected: true } : p
    ));
    setSelectedIds(new Set());
    // TODO: Persist to database
  }, [selectedIds]);
  
  const handleContinue = useCallback(() => {
    if (sessionId) {
      router.push(`/members/build/super?session_id=${sessionId}`);
    }
  }, [sessionId, router]);
  
  // Computed values
  const visiblePhrases = phrases.filter(p => !p.isRejected);
  const starredCount = phrases.filter(p => p.isStarred && !p.isRejected).length;
  const canContinue = starredCount >= 10; // Require at least 10 starred phrases
  
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
    <div className="space-y-8">
      {/* Filter Toolbar */}
      <FilterToolbar
        totalCount={phrases.length}
        visibleCount={visiblePhrases.length}
      />
      
      {/* Action Toolbar */}
      <ActionToolbar
        selectedCount={selectedIds.size}
        onRunTopicScoring={handleRunTopicScoring}
        onAutoPick={handleAutoPick}
        onDeleteSelected={handleDeleteSelected}
        onContinue={handleContinue}
        canContinue={canContinue}
        isScoring={isScoring}
        scoringProgress={scoringProgress}
      />
      
      {/* Table - extra spacing above */}
      <div className="pt-4">
        <RefineTable
          phrases={visiblePhrases}
          onToggleStar={handleToggleStar}
          onToggleReject={handleToggleReject}
          onToggleSelect={handleToggleSelect}
          selectedIds={selectedIds}
          starredCount={starredCount}
        />
      </div>
    </div>
  );
}
