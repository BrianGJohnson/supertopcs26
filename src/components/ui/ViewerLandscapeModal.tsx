"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { IconX, IconChevronLeft, IconTargetArrow, IconPencil } from "@tabler/icons-react";
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

  // New phrase modal state
  const [showNewPhraseModal, setShowNewPhraseModal] = useState(false);
  const [newPhraseInput, setNewPhraseInput] = useState('');

  // Current phrase
  const currentPhrase = currentSeed;
  const currentLevel = 0; // Always top level in Simple View

  // Calculate display mode based on word count
  const wordCount = useMemo(() => getWordCount(currentPhrase), [currentPhrase]);
  const isOpportunityMode = wordCount >= 3;

  // Reset when seed prop changes
  useEffect(() => {
    setCurrentSeed(seed);
  }, [seed]);





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

        // Simple request for top-level analysis
        const requestBody = {
          seed: currentPhrase.trim(),
        };

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
            <div />

            <div className="flex items-center gap-1">
              {/* ViewModeToggle hidden to enforce simple view */}
              {/* <ViewModeToggle mode={mode} onModeChange={setMode} /> */}
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
                {/* Traffic Light Header */}
                <div className="flex flex-col gap-4">
                  {/* Badge & Title Row */}
                  <div className="flex items-center gap-5">
                    {(() => {
                      const score = landscape.demandScore;
                      // Traffic Light Logic
                      let badgeConfig = { icon: '🛑', label: 'LOW SIGNAL', color: 'text-white/50', bg: 'bg-white/5 border-white/10' };

                      if (score >= 60) {
                        // Traffic Light Green (True Green)
                        badgeConfig = { icon: '🟢', label: 'GO SIGNAL', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/15 border-[#22C55E]/30' };
                      } else if (score >= 40) {
                        badgeConfig = { icon: '🟡', label: 'CAUTION', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/15 border-[#F59E0B]/30' };
                      }

                      return (
                        <div className={`px-4 py-2 rounded-full border flex items-center gap-2.5 shrink-0 ${badgeConfig.bg}`}>
                          <span className="text-xl leading-none">{badgeConfig.icon}</span>
                          <span className={`text-base font-extrabold tracking-wide leading-none ${badgeConfig.color}`}>{badgeConfig.label}</span>
                        </div>
                      );
                    })()}

                    <h2 className="text-4xl font-bold text-white leading-none pt-1">
                      {capitalizePhrase(currentPhrase)}
                    </h2>
                  </div>

                  {/* Human-Centric Copy (One Sentence) */}
                  <p className="text-xl text-white/80 leading-relaxed font-medium">
                    {(() => {
                      const s = landscape.demandScore;
                      if (s >= 80) return "This topic is on fire. Viewers are actively looking for this right now.";
                      if (s >= 60) return "Fantastic demand. A large audience is waiting for this content.";
                      if (s >= 40) return "Good volume, but lots of competition. You'll need a unique angle.";
                      return "This is a quieter topic. It connects with a specific, smaller audience.";
                    })()}
                  </p>
                </div>

                {/* Divider */}
                <div className="my-8 border-t border-white/10" />

                {/* Who's Watching (The Vibe) */}
                <div>
                  <h3 className="text-lg font-bold text-white/60 mb-6 uppercase tracking-wider">Who is Watching?</h3>
                  <div className="space-y-5">
                    {getDisplayVibes().slice(0, 3).map(({ vibe, percent }) => (
                      <div key={vibe} className="flex items-center gap-4">
                        <span className="text-3xl w-10 text-center">{getVibeIcon(vibe)}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <span className="text-white text-lg font-medium">{getVibeLabel(vibe)}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getVibeBgClass(vibe)}`}
                              style={{ width: `${Math.max(percent, 10)}%` }} /* Minimum visual width */
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-8 border-t border-white/10" />
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
                className="flex-1 px-6 py-4 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#2BD899] font-bold text-xl rounded-xl transition-all border-2 border-[#2BD899]/30 shadow-[0_0_15px_rgba(43,216,153,0.15)] hover:shadow-[0_0_25px_rgba(43,216,153,0.25)] flex items-center justify-center gap-2"
              >
                <IconTargetArrow size={24} />
                Start Session
              </button>
              <button
                onClick={() => {
                  setShowNewPhraseModal(true);
                  setNewPhraseInput('');
                }}
                className="flex-1 px-6 py-4 bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15 hover:from-[#5AACFF]/25 hover:to-[#4A9CFF]/25 text-[#5AACFF] font-bold text-xl rounded-xl transition-all border-2 border-[#5AACFF]/30 shadow-[0_0_15px_rgba(90,172,255,0.15)] hover:shadow-[0_0_25px_rgba(90,172,255,0.25)] flex items-center justify-center gap-2"
              >
                <IconPencil size={24} />
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

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
