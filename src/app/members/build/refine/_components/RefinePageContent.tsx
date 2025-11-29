"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefineTable } from "./RefineTable";
import { FilterToolbar } from "./FilterToolbar";
import { ActionToolbar } from "./ActionToolbar";
import { getSeedsBySession } from "@/hooks/useSeedPhrases";
import type { Seed } from "@/types/database";

// =============================================================================
// TYPES
// =============================================================================

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

function mapSeedToRefinePhrase(seed: Seed): RefinePhrase {
  // Map generation_method to source type
  const sourceMap: Record<string, RefinePhrase["source"]> = {
    seed: "seed",
    top10: "top10",
    child: "child",
    az: "az",
    prefix: "prefix",
  };
  
  return {
    id: seed.id,
    phrase: seed.phrase,
    source: sourceMap[seed.generation_method || "seed"] || "seed",
    topic: null, // Will be populated after scoring
    fit: null,
    pop: null,
    comp: null,
    spread: null,
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
  
  // Fetch phrases from database
  const fetchPhrases = useCallback(async () => {
    if (!sessionId) {
      setPhrases([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const seeds = await getSeedsBySession(sessionId);
      const refinePhrases = seeds.map(mapSeedToRefinePhrase);
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
  
  const handleRunAnalysis = useCallback(() => {
    // TODO: Implement scoring rounds
    console.log("Run Analysis clicked");
  }, []);
  
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
        onRunAnalysis={handleRunAnalysis}
        onAutoPick={handleAutoPick}
        onDeleteSelected={handleDeleteSelected}
        onContinue={handleContinue}
        canContinue={canContinue}
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
