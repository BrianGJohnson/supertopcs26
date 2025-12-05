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
}

interface ApiResponse {
  landscape: ViewerLandscape;
}

/**
 * Drill-down context - tracks navigation through Popular Topics
 * This is UI state, not scoring logic
 */
interface DrillDownContext {
  phrase: string;
  position: number;
  parentPhrase: string;
  level: number;
  fullPath: string[];
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
 * Get badge styling based on API signal
 * Uses the signal from viewer-landscape.ts API response
 * 
 * Signal levels (from API):
 * - 'go' with isOpportunity = Hidden Gem (💎)
 * - 'go' with high score = Extreme/High Demand
 * - 'caution' = Moderate Interest
 * - 'stop' = Low Interest
 */
function getSignalBadge(
  signal: SignalLevel,
  signalScore: number,
  isOpportunity: boolean
): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
} {
  // Special case: Low Comp Opportunity pattern detected
  if (signal === 'go' && isOpportunity) {
    return { 
      icon: '💎', 
      label: 'Hidden Gem', 
      color: 'text-[#6B9BD1]', 
      bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' 
    };
  }
  
  // Signal-based labels
  if (signal === 'go') {
    if (signalScore >= 85) {
      return { icon: '🔥', label: 'Extreme Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
    } else if (signalScore >= 70) {
      return { icon: '⚡', label: 'High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
    } else {
      return { icon: '✓', label: 'Good Opportunity', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
    }
  } else if (signal === 'caution') {
    return { icon: '💡', label: 'Moderate Interest', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  } else {
    return { icon: '❄️', label: 'Low Interest', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
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
}: ViewerLandscapeModalProps) {
  const [landscape, setLandscape] = useState<ViewerLandscape | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Display mode (Simple vs Detailed)
  const { mode, isFull, setMode } = useDisplayMode();
  
  // Navigation stack for drill-down
  const [drillDownStack, setDrillDownStack] = useState<DrillDownContext[]>([]);
  
  // Current context
  const currentContext = drillDownStack.length > 0 ? drillDownStack[drillDownStack.length - 1] : null;
  const currentPhrase = currentContext ? currentContext.phrase : seed;
  const currentLevel = currentContext?.level || 0;
  const canGoBack = drillDownStack.length > 0;

  // Calculate display mode based on word count
  const wordCount = useMemo(() => getWordCount(currentPhrase), [currentPhrase]);
  const isOpportunityMode = wordCount >= 3;

  // Reset navigation when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDrillDownStack([]);
    }
  }, [isOpen, seed]);

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

      try {
        const response = await authFetch("/api/seed-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seed: currentPhrase.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze seed phrase");
        }

        const data: ApiResponse = await response.json();
        setLandscape(data.landscape);
      } catch (err) {
        console.error("[ViewerLandscapeModal] Error:", err);
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandscape();
  }, [isOpen, currentPhrase]);

  /**
   * Navigate to a child phrase (drill down)
   */
  const handleDrillDown = useCallback((phrase: string, position: number) => {
    if (phrase.toLowerCase().trim() === currentPhrase.toLowerCase().trim()) return;
    
    const fullPath = currentContext 
      ? [...currentContext.fullPath, phrase]
      : [seed, phrase];
    
    const context: DrillDownContext = {
      phrase,
      position,
      parentPhrase: currentPhrase,
      level: (currentContext?.level || 0) + 1,
      fullPath,
    };
    
    setDrillDownStack(prev => [...prev, context]);
  }, [currentPhrase, currentContext, seed]);

  /**
   * Navigate back to parent phrase
   */
  const handleGoBack = useCallback(() => {
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
        {/* Modal Card */}
        <div className="relative w-full max-w-5xl bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col my-8">
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
                    landscape.signal, 
                    landscape.signalScore, 
                    landscape.isOpportunity
                  );
                  return (
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Badge */}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${badge.bgColor}`}>
                        <span className="text-xl">{badge.icon}</span>
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

                {/* OPPORTUNITY MODE: Score breakdown (3+ words) */}
                {isOpportunityMode && (
                  <>
                    {/* Score Cards */}
                    <div className="grid grid-cols-2 gap-6 mt-8">
                      {/* Signal Score Card */}
                      {(() => {
                        const scoreColors = getScoreColorClasses(landscape.signalScore);
                        return (
                          <div className={`p-6 rounded-2xl border ${scoreColors.bgColor}`}>
                            <h4 className="text-base font-semibold text-white/50 uppercase tracking-wide mb-4">
                              Opportunity Score
                            </h4>
                            <div className="flex items-center justify-between mb-4">
                              <span className={`text-xl font-bold ${scoreColors.color}`}>
                                {getScoreLabel(landscape.signalScore)}
                              </span>
                              <span className={`text-3xl font-bold ${scoreColors.color}`}>
                                {landscape.signalScore}
                              </span>
                            </div>
                            {/* Pattern badges */}
                            <div className="flex flex-wrap gap-2">
                              {landscape.isOpportunity && (
                                <span className="px-3 py-1.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-sm font-medium">
                                  🎯 Low Comp Signal
                                </span>
                              )}
                              {landscape.isLowCompetition && !landscape.isOpportunity && (
                                <span className="px-3 py-1.5 rounded-full bg-[#2BD899]/20 text-[#2BD899] text-sm font-medium">
                                  📈 Room to Rank
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Match Stats Card */}
                      <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h4 className="text-base font-semibold text-white/50 uppercase tracking-wide mb-4">
                          Match Analysis
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Topic Match</span>
                            <span className="text-white font-bold">
                              {landscape.topicMatchPercent}%
                              <span className="text-white/50 font-normal ml-2">
                                ({landscape.topicMatchCount}/{landscape.suggestionCount})
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Exact Match</span>
                            <span className="text-white font-bold">
                              {landscape.exactMatchPercent}%
                              <span className="text-white/50 font-normal ml-2">
                                ({landscape.exactMatchCount}/{landscape.suggestionCount})
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Suggestions</span>
                            <span className="text-white font-bold">{landscape.suggestionCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sparse data warning */}
                    {landscape.suggestionCount < 5 && (
                      <div className="mt-6 p-5 rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10">
                        <h4 className="text-base font-semibold text-[#F59E0B] uppercase tracking-wide mb-2">
                          Limited Data
                        </h4>
                        <p className="text-white/70 text-lg">
                          Only <span className="text-white font-medium">{landscape.suggestionCount}</span> suggestion{landscape.suggestionCount !== 1 ? 's' : ''} found.
                          Try a shorter phrase for better analysis.
                        </p>
                      </div>
                    )}
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
                <div className={isOpportunityMode ? "" : "mt-6"}>
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
                            className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left group"
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

                {/* YouTube Link - Only in Detailed mode */}
                {isFull && (
                  <div className="mt-6">
                    <a
                      href={landscape.youtubeSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#6B9BD1] hover:text-[#8BB5E0] text-lg transition-colors"
                    >
                      <span>Check competition on YouTube</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-5 mt-8">
                  <button
                    onClick={() => onCreateSession?.(currentPhrase)}
                    className="flex-1 px-8 py-5 bg-gradient-to-b from-[#4A7BB5] to-[#3A6195] text-white font-bold text-xl rounded-xl hover:from-[#5588C2] hover:to-[#4A7BB5] transition-all shadow-[0_4px_20px_rgba(74,123,181,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
                  >
                    Create Session
                  </button>
                  <button
                    onClick={onPass || onClose}
                    className="flex-1 px-8 py-5 bg-white/5 text-white/80 font-bold text-xl rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10"
                  >
                    Pass
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
