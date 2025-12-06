"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { IconX, IconChevronLeft } from "@tabler/icons-react";
import { authFetch } from "@/lib/supabase";
import { ViewModeToggle } from "@/components/ui/ViewModeToggle";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import {
  type ViewerLandscape,
  type VibeCategory,
  type SignalLevel,
  getVibeIcon,
  getVibeLabel,
  getVibeBgClass,
} from "@/lib/viewer-landscape";

// =============================================================================
// TYPES
// =============================================================================

interface ViewerLandscapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed: string;
  onCreateSession?: (seed: string) => void;
  onPass?: () => void;
  onQuickStart?: (seed: string) => void;
}

interface ApiResponse {
  landscape: ViewerLandscape;
}

/**
 * Drill-down context - tracks navigation through Popular Topics
 * Includes parent demand scores for inheritance
 */
interface DrillDownContext {
  phrase: string;
  position: number;
  parentPhrase: string;
  level: number;
  fullPath: string[];
  parentDemandScore?: number;       // Parent's demand score (for inheritance)
  parentExactMatchPercent?: number; // Parent's exact match % (for context)
}

// =============================================================================
// HELPER FUNCTIONS (UI only, no scoring)
// =============================================================================

/**
 * Capitalize each word in a phrase
 */
function capitalizePhrase(phrase: string): string {
  return phrase
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get word count from a phrase
 */
function getWordCount(phrase: string): number {
  return phrase.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Get badge styling based on demand score and SuperTopic status
 *
 * ALWAYS shows a badge:
 * 1. SuperTopic (demand ≥ 50 AND opportunity ≥ 90) → Logo
 * 2. Otherwise based on demandScore level
 */
function getSignalBadge(
  demandScore: number,
  isSuperTopic?: boolean
): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
} {
  // Top priority: SuperTopic
  if (isSuperTopic) {
    return {
      icon: 'logo',
      label: 'SuperTopic',
      color: 'text-[#FFD700]',
      bgColor: 'bg-[#FFD700]/15 border-[#FFD700]/40'
    };
  }

  // Demand-based badges (recalibrated thresholds)
  if (demandScore >= 95) {
    return { icon: '🔥', label: 'Extreme Demand', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
  } else if (demandScore >= 85) {
    return { icon: '⚡', label: 'Very High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (demandScore >= 77) {
    return { icon: '📊', label: 'High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (demandScore >= 67) {
    return { icon: '💪', label: 'Strong Demand', color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
  } else if (demandScore >= 57) {
    return { icon: '✓', label: 'Good Opportunity', color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
  } else if (demandScore >= 47) {
    return { icon: '💡', label: 'Moderate Interest', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  } else if (demandScore >= 37) {
    return { icon: '🔍', label: 'Some Interest', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  } else {
    return { icon: '❄️', label: 'Limited Interest', color: 'text-[#94A3B8]', bgColor: 'bg-[#94A3B8]/15 border-[#94A3B8]/40' };
  }
}

/**
 * Get color classes based on signal score
 */
function getScoreColorClasses(score: number): { color: string; bgColor: string } {
  if (score >= 70) {
    return { color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (score >= 50) {
    return { color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
  } else if (score >= 35) {
    return { color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  }
  return { color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
}

/**
 * Get score label text
 */
function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Strong';
  if (score >= 35) return 'Good';
  if (score >= 20) return 'Moderate';
  return 'Low';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ViewerLandscapeModal
 * 
 * Displays viewer landscape analysis for a phrase.
 * All scoring comes from the /api/seed-signal endpoint (viewer-landscape.ts).
 * This modal only handles UI and drill-down navigation.
 * 
 * Two modes:
 * - Discovery Mode (2 words): Simple Go/Caution/Stop with Viewer Vibe
 * - Opportunity Mode (3+ words): Full analysis with score breakdown
 */
export function ViewerLandscapeModal({
  isOpen,
  onClose,
  seed,
  onCreateSession,
  onPass,
  onQuickStart,
}: ViewerLandscapeModalProps) {
  const [landscape, setLandscape] = useState<ViewerLandscape | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Current seed for testing different phrases
  const [currentSeed, setCurrentSeed] = useState(seed);

  // Display mode (Simple vs Detailed)
  const { mode, isFull, setMode } = useDisplayMode();

  // Navigation stack for drill-down
  const [drillDownStack, setDrillDownStack] = useState<DrillDownContext[]>([]);

  // New phrase modal state
  const [showNewPhraseModal, setShowNewPhraseModal] = useState(false);
  const [newPhraseInput, setNewPhraseInput] = useState('');

  // Tooltip state for Popular Topics hover with delay
  const [hoveredPhrase, setHoveredPhrase] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTooltipVisibleRef = React.useRef(false);

  // Current context
  const currentContext = drillDownStack.length > 0 ? drillDownStack[drillDownStack.length - 1] : null;
  const currentPhrase = currentContext ? currentContext.phrase : currentSeed;
  const currentLevel = currentContext?.level || 0;
  const canGoBack = drillDownStack.length > 0;

  // Calculate display mode based on word count
  const wordCount = useMemo(() => getWordCount(currentPhrase), [currentPhrase]);
  const isOpportunityMode = wordCount >= 3;

  // Reset when seed prop changes
  useEffect(() => {
    setCurrentSeed(seed);
  }, [seed]);

  // Reset navigation when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDrillDownStack([]);
      // Clear tooltip when modal closes
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      setHoveredPhrase(null);
    }
  }, [isOpen, seed]);

  // Clear tooltip when loading starts (safety net)
  useEffect(() => {
    if (isLoading) {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      setHoveredPhrase(null);
    }
  }, [isLoading]);

  // Client-side mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key handler
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Lock scroll and escape listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Fetch landscape data from API
  useEffect(() => {
    if (!isOpen || !currentPhrase) return;

    const fetchLandscape = async () => {
      setIsLoading(true);
      setError(null);
      const startTime = Date.now();

      try {
        console.log(`[ViewerLandscapeModal] Fetching analysis for "${currentPhrase}"...`);

        // Include parent context for demand inheritance (Level 2+)
        const requestBody: { seed: string; parentDemandScore?: number; level?: number } = {
          seed: currentPhrase.trim(),
        };
        if (currentContext) {
          requestBody.parentDemandScore = currentContext.parentDemandScore;
          requestBody.level = currentContext.level;
        }

        const response = await authFetch("/api/seed-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const elapsed = Date.now() - startTime;
        console.log(`[ViewerLandscapeModal] Response received in ${elapsed}ms, status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[ViewerLandscapeModal] API error:", errorText);
          throw new Error("Failed to analyze seed phrase");
        }

        const data: ApiResponse = await response.json();
        console.log(`[ViewerLandscapeModal] Success! Demand: ${data.landscape?.demandScore}, Opportunity: ${data.landscape?.opportunityScore}`);
        setLandscape(data.landscape);
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[ViewerLandscapeModal] Error after ${elapsed}ms:`, err);
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandscape();
  }, [isOpen, currentPhrase]);

  /**
   * Navigate to a child phrase (drill down)
   * Captures parent demand score for inheritance
   */
  const handleDrillDown = useCallback((phrase: string, position: number) => {
    if (phrase.toLowerCase().trim() === currentPhrase.toLowerCase().trim()) return;

    // Clear tooltip immediately when navigating
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setHoveredPhrase(null);

    const fullPath = currentContext
      ? [...currentContext.fullPath, phrase]
      : [seed, phrase];

    const context: DrillDownContext = {
      phrase,
      position,
      parentPhrase: currentPhrase,
      level: (currentContext?.level || 0) + 1,
      fullPath,
      // Capture parent demand score for inheritance
      parentDemandScore: landscape?.demandScore,
      parentExactMatchPercent: landscape?.exactMatchPercent,
    };

    setDrillDownStack(prev => [...prev, context]);
  }, [currentPhrase, currentContext, seed, landscape]);

  /**
   * Navigate back to parent phrase
   */
  const handleGoBack = useCallback(() => {
    // Clear tooltip immediately when navigating
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setHoveredPhrase(null);
    setDrillDownStack(prev => prev.slice(0, -1));
  }, []);

  /**
   * Get vibes to display (filtered and sorted)
   */
  const getDisplayVibes = useCallback((): { vibe: VibeCategory; percent: number }[] => {
    if (!landscape) return [];

    const vibes: { vibe: VibeCategory; percent: number }[] = [
      { vibe: 'learning', percent: landscape.vibeDistribution.learning },
      { vibe: 'frustrated', percent: landscape.vibeDistribution.frustrated },
      { vibe: 'current', percent: landscape.vibeDistribution.current },
      { vibe: 'problem-solving', percent: landscape.vibeDistribution.problemSolving },
      { vibe: 'curious', percent: landscape.vibeDistribution.curious },
      { vibe: 'action-ready', percent: landscape.vibeDistribution.actionReady },
      { vibe: 'comparing', percent: landscape.vibeDistribution.comparing },
    ];

    return vibes
      .filter(v => v.percent > 0)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, isOpportunityMode ? 3 : 4);
  }, [landscape, isOpportunityMode]);

  // Don't render on server or when closed
  if (!mounted || !isOpen) return null;

  // Use portal to render at document.body level
  return createPortal(
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Centering container */}
      <div className="relative z-[10001] flex min-h-full items-center justify-center p-4">
        {/* Modal Card - Responsive width based on view mode */}
        <div className={`relative w-full ${isFull ? 'max-w-4xl' : 'max-w-3xl'} bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col my-8`}>
          {/* Navigation bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            {canGoBack ? (
              <button
                onClick={handleGoBack}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <IconChevronLeft size={20} />
                <span className="text-sm">Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1">
              <ViewModeToggle mode={mode} onModeChange={setMode} />
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <IconX size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-10 pb-10 pt-4">
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <svg className="w-14 h-14 animate-spin text-[#6B9BD1]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="mt-5 text-white/50 text-xl">
                  {isOpportunityMode ? "Analyzing opportunity..." : "Analyzing viewer landscape..."}
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-16">
                <p className="text-red-400 text-xl">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-3 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 text-lg"
                >
                  Close
                </button>
              </div>
            )}

            {/* Success state */}
            {landscape && !isLoading && (
              <>
                {/* HEADER: Badge + Phrase */}
                {(() => {
                  const badge = getSignalBadge(
                    landscape.demandScore,
                    landscape.isSuperTopic
                  );
                  return (
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Badge */}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${badge.bgColor}`}>
                        {badge.icon === 'logo' ? (
                          <img src="/logo-supertopics.svg" alt="SuperTopic" className="h-6 w-6" />
                        ) : (
                          <span className="text-xl">{badge.icon}</span>
                        )}
                        <span className={`font-bold text-base ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      {/* Phrase */}
                      <h2 className="text-2xl font-semibold text-white">
                        {capitalizePhrase(currentPhrase)}
                      </h2>
                      {/* Level indicator when drilled down */}
                      {currentLevel > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                          <span className="text-white/50 text-xs">Level {currentLevel + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Summary message from API */}
                <p className="mt-4 text-white/70 text-lg leading-relaxed">
                  {landscape.signalMessage}
                </p>

                {/* YouTube Competition Check Link */}
                <div className="mt-3">
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentPhrase)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#5AACFF] hover:text-[#7BC0FF] transition-colors text-base"
                  >
                    <span>Check Competition on YouTube</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* OPPORTUNITY MODE: Score breakdown (3+ words) */}
                {isOpportunityMode && (
                  <>
                    {/* Dual Score Cards - Compact */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      {/* Demand Score Card */}
                      {(() => {
                        const demandColors = getScoreColorClasses(landscape.demandScore);
                        return (
                          <div className={`p-4 rounded-2xl border ${demandColors.bgColor}`}>
                            <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-2">
                              Demand Score
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className={`text-lg font-bold ${demandColors.color}`}>
                                {landscape.demandLabel}
                              </span>
                              <span className={`text-3xl font-bold ${demandColors.color}`}>
                                {landscape.demandScore}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Opportunity Score Card */}
                      {(() => {
                        const oppColors = getScoreColorClasses(landscape.opportunityScore);
                        return (
                          <div className={`p-4 rounded-2xl border ${oppColors.bgColor}`}>
                            <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-2">
                              Opportunity Score
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className={`text-lg font-bold ${oppColors.color}`}>
                                {landscape.opportunityLabel}
                              </span>
                              <span className={`text-3xl font-bold ${oppColors.color}`}>
                                {landscape.opportunityScore}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Pattern Badges - Against dark background for better contrast */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      {/* Suggestion count */}
                      <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-sm font-medium">
                        📊 {landscape.suggestionCount} suggestion{landscape.suggestionCount !== 1 ? 's' : ''}
                      </span>

                      {/* Topic Match - Only in Detailed Mode */}
                      {isFull && (
                        <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-sm font-medium">
                          📊 Topic Match {landscape.topicMatchPercent}%
                        </span>
                      )}

                      {/* Exact Match - Only in Detailed Mode */}
                      {isFull && (
                        <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-sm font-medium">
                          📊 Exact Match {landscape.exactMatchPercent}%
                        </span>
                      )}

                      {/* Single Viewer Intent pill - shows when any intent detected */}
                      {landscape.intentMatches && landscape.intentMatches.length > 0 && (
                        <span className="px-3 py-1.5 rounded-full bg-[#6BB6FF]/20 text-[#6BB6FF] text-sm font-medium">
                          🎯 Viewer Intent
                        </span>
                      )}

                      {/* Long-Term Views badge - shows for evergreen content */}
                      {landscape.hasEvergreenIntent && (
                        <span className="px-3 py-1.5 rounded-full bg-[#B794F6]/20 text-[#B794F6] text-sm font-medium">
                          ♾️ Long-Term Views
                        </span>
                      )}

                      {/* Low Comp Signal */}
                      {landscape.isLowCompetition && (
                        <span className="px-3 py-1.5 rounded-full bg-[#2BD899]/20 text-[#2BD899] text-sm font-medium">
                          📈 Low Comp Signal
                        </span>
                      )}
                    </div>

                    {/* Data context message - only show when truly problematic */}
                    {(() => {
                      // Don't show warning if:
                      // 1. At Level 2+ (drill-down context - low suggestions are expected)
                      // 2. Opportunity score is good (≥65) - low suggestions + high opportunity = valuable long-tail phrase
                      // 3. Demand score is decent (≥45) - has demand from inheritance or autocomplete
                      // 4. Already 4+ words (5 words is solid, specific phrases naturally have fewer suggestions)
                      const shouldShowWarning =
                        landscape.suggestionCount < 5 &&
                        currentLevel === 0 &&
                        landscape.opportunityScore < 65 &&
                        landscape.demandScore < 45 &&
                        wordCount < 4;

                      if (!shouldShowWarning) return null;

                      return (
                        <div className="mt-4 p-4 rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10">
                          <h4 className="text-sm font-semibold text-[#F59E0B] uppercase tracking-wide mb-2">
                            Limited Data
                          </h4>
                          <p className="text-white/70 text-base">
                            Only <span className="text-white font-medium">{landscape.suggestionCount}</span> suggestion{landscape.suggestionCount !== 1 ? 's' : ''} found.
                            Try a broader phrase for better analysis.
                          </p>
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* DISCOVERY MODE: Match stats only in detailed view */}
                {!isOpportunityMode && isFull && (
                  <div className="mt-4 space-y-1">
                    <p className="text-white/50 text-lg">
                      <span className="text-white/70 font-medium">{landscape.exactMatchCount} of {landscape.suggestionCount}</span> exact match
                      {" • "}
                      <span className="text-white/70 font-medium">{landscape.topicMatchCount} of {landscape.suggestionCount}</span> topic match
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="my-8 border-t border-white/10" />

                {/* Who's Watching - only in discovery mode */}
                {!isOpportunityMode && (
                  <div>
                    <h3 className="text-2xl font-bold text-white/80 mb-4">Who's Watching</h3>
                    <div className="space-y-4">
                      {getDisplayVibes().map(({ vibe, percent }) => (
                        <div key={vibe} className="flex items-center gap-4">
                          <span className="text-2xl w-9">{getVibeIcon(vibe)}</span>
                          <span className="text-white/80 text-lg w-36">{getVibeLabel(vibe)}</span>
                          <div className="flex-1 h-3.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getVibeBgClass(vibe)}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Viewer Landscape Insight */}
                <div className={isOpportunityMode ? "mt-8 pt-8 border-t border-white/10" : "mt-6"}>
                  <h3 className="text-2xl font-bold text-white/80 mb-3">Viewer Landscape</h3>
                  <p className="text-white/80 text-lg leading-relaxed">
                    {landscape.insight}
                  </p>
                </div>

                {/* Popular Topics - Only in Detailed mode */}
                {isFull && (
                  <>
                    <div className="my-6 border-t border-white/10" />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-2xl font-bold text-white/80">Popular Topics</h3>
                        {currentLevel > 0 && (
                          <span className="text-sm text-white/40 bg-white/5 px-3 py-1 rounded-full">
                            Level {currentLevel + 1}
                          </span>
                        )}
                      </div>
                      <p className="text-white/50 text-base mb-5">Click a topic to explore its opportunity</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(landscape.topFourteen || landscape.topFive)
                          .filter((item) => item.phrase.toLowerCase().trim() !== currentPhrase.toLowerCase().trim())
                          .slice(0, 14)
                          .map((item, index) => (
                            <button
                              key={item.position}
                              onClick={() => handleDrillDown(item.phrase, item.position)}
                              onMouseEnter={(e) => {
                                // Capture rect immediately before setTimeout
                                const rect = e.currentTarget.getBoundingClientRect();
                                // Clear any existing timeout
                                if (tooltipTimeoutRef.current) {
                                  clearTimeout(tooltipTimeoutRef.current);
                                }

                                // If tooltip is already visible, switch with shorter delay (300ms)
                                // If not, use longer initial delay (400ms)
                                const delay = isTooltipVisibleRef.current ? 300 : 400;

                                // Set new timeout for delayed switch
                                tooltipTimeoutRef.current = setTimeout(() => {
                                  setTooltipPos({ x: rect.left, y: rect.top });
                                  setHoveredPhrase(item.phrase);
                                  isTooltipVisibleRef.current = true;
                                }, delay);
                              }}
                              onMouseLeave={() => {
                                // Clear timeout if mouse leaves before delay
                                if (tooltipTimeoutRef.current) {
                                  clearTimeout(tooltipTimeoutRef.current);
                                }
                                setHoveredPhrase(null);
                                isTooltipVisibleRef.current = false;
                              }}
                              className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left group relative"
                            >
                              <span className="text-white/40 text-base font-bold w-6 shrink-0">
                                {index + 1}.
                              </span>
                              <span className="flex-1 text-white text-base truncate group-hover:text-[#2BD899] transition-colors">
                                {capitalizePhrase(item.phrase)}
                              </span>
                              <span className="text-xl shrink-0" title={getVibeLabel(item.vibe)}>
                                {item.vibeIcon}
                              </span>
                              <svg className="w-4 h-4 text-white/30 group-hover:text-[#2BD899] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Anchor Words - only in discovery mode AND detailed view */}
                {isFull && !isOpportunityMode && landscape.anchorWords.length > 0 && (
                  <>
                    <div className="my-6 border-t border-white/10" />
                    <div>
                      <h3 className="text-xl font-bold text-white/80 mb-4">Words Viewers Use</h3>
                      <div className="flex flex-wrap gap-3">
                        {landscape.anchorWords.map((word) => (
                          <span
                            key={word}
                            className="px-4 py-2 bg-[#2BD899]/15 border border-[#2BD899]/40 rounded-full text-[#2BD899] text-base font-medium"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons - Two equal columns */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => {
                      if (onQuickStart) {
                        onQuickStart(currentPhrase);
                      } else {
                        onCreateSession?.(currentPhrase);
                      }
                    }}
                    className="flex-1 px-6 py-4 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#2BD899] font-bold text-base rounded-xl transition-all border-2 border-[#2BD899]/30 shadow-[0_0_15px_rgba(43,216,153,0.15)]"
                  >
                    Start Session
                  </button>
                  <button
                    onClick={() => {
                      setShowNewPhraseModal(true);
                      setNewPhraseInput('');
                    }}
                    className="flex-1 px-6 py-4 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#2BD899] font-bold text-base rounded-xl transition-all border-2 border-[#2BD899]/30 shadow-[0_0_15px_rgba(43,216,153,0.15)]"
                  >
                    New Phrase
                  </button>
                </div>

                {/* Custom New Phrase Modal */}
                {showNewPhraseModal && (
                  <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
                    {/* Backdrop - matches main modal */}
                    <div
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                      onClick={() => setShowNewPhraseModal(false)}
                    />

                    {/* Modal Card - matches main modal style */}
                    <div className="relative bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-md">
                      <h3 className="text-2xl font-semibold text-white mb-2">Enter a phrase to test</h3>
                      <p className="text-white/70 text-lg mb-6">Type a topic phrase and press Enter</p>

                      <input
                        type="text"
                        value={newPhraseInput}
                        onChange={(e) => setNewPhraseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPhraseInput.trim().length >= 2) {
                            setDrillDownStack([]);
                            setCurrentSeed(newPhraseInput.trim());
                            setShowNewPhraseModal(false);
                          } else if (e.key === 'Escape') {
                            setShowNewPhraseModal(false);
                          }
                        }}
                        autoFocus
                        placeholder="e.g., how to start a podcast"
                        className="w-full px-8 py-5 bg-black/40 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/30 rounded-2xl text-xl text-white text-center placeholder:text-white/25 focus:border-[#2BD899]/50 focus:ring-2 focus:ring-[#2BD899]/20 outline-none transition-all"
                      />

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => setShowNewPhraseModal(false)}
                          className="flex-1 px-4 py-4 bg-white/5 text-white/80 font-bold text-base rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (newPhraseInput.trim().length >= 2) {
                              setDrillDownStack([]);
                              setCurrentSeed(newPhraseInput.trim());
                              setShowNewPhraseModal(false);
                            }
                          }}
                          disabled={newPhraseInput.trim().length < 2}
                          className="flex-1 px-4 py-4 bg-gradient-to-b from-[#1E8B63] to-[#167A52] text-white font-bold text-base rounded-xl hover:from-[#2BD899] hover:to-[#1E8B63] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(30,139,99,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
                        >
                          Analyze
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Large Tooltip for Popular Topics - appears on hover */}
            {hoveredPhrase && (
              <div
                className="fixed z-[15000] pointer-events-none"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y - 100}px`,
                }}
              >
                <div className="bg-gradient-to-b from-[#2A3A4A] to-[#1A2A3A] border-2 border-[#2BD899]/50 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-sm whitespace-nowrap">
                  <p className="text-white text-lg font-bold">
                    {capitalizePhrase(hoveredPhrase)}
                  </p>
                  {/* Small arrow pointing down */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#2A3A4A]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
