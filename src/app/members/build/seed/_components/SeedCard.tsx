"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SeedIconGreen } from "@/components/icons";
import { getSessionById } from "@/hooks/useSessions";
import { addSeeds } from "@/hooks/useSeedPhrases";
import { authFetch } from "@/lib/supabase";
import type { Seed } from "@/types/database";
import { PhraseSelectModal, ExpansionProgress } from "./PhraseSelectModal";
import { IconCheck, IconSparkles, IconArrowRight, IconLoader2 } from "@tabler/icons-react";
import { toTitleCase } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

// Module completion state type
type ModuleStatus = "idle" | "loading" | "complete";

interface ModuleState {
  top10: ModuleStatus;
  child: ModuleStatus;
  az: ModuleStatus;
  prefix: ModuleStatus;
}

// SSE Progress event type (matches API)
interface StreamProgressEvent {
  type: "progress" | "complete" | "error";
  method: string;
  current: number;
  total: number;
  added: number;
  totalAdded: number;
  query?: string;
}

// Progress messages for each method (Brand Voice: viewer-focused, educational)
const PROGRESS_MESSAGES: Record<string, string[]> = {
  top10: [
    "Finding The Most Popular Topics",
    "Identifying What Viewers Want Most",
    "Building Your Foundation Topics",
  ],
  child: [
    "Expanding Your Top Picks Into Related Topics",
    "Finding Variations With Less Competition",
    "Discovering Low Comp Signal Topics",
  ],
  az: [
    "Exploring Every Topic Variation A to Z",
    "Uncovering Hidden Topic Opportunities",
    "Finding What Other Creators Miss",
  ],
  prefix: [
    "Adding Question-Based Topic Angles",
    "Finding How, What, Why Variations",
    "Discovering Evergreen Topic Ideas",
  ],
};

// Neutral color for progress bar and messages (cream white with hint of blue)
const PROGRESS_NEUTRAL_COLOR = "#E0E7EF";
const PROGRESS_BAR_COLOR = "#6B9BD1"; // Electric blue - consistent, professional

interface SeedCardProps {
  onPhrasesAdded?: () => void;
  sourceCounts: {
    top10: number;
    child: number;
    az: number;
    prefix: number;
  };
  seeds: Seed[];
  isExpanding: boolean;
  setIsExpanding: (value: boolean) => void;
  isFull?: boolean;
}

export function SeedCard({ onPhrasesAdded, sourceCounts, isExpanding, setIsExpanding, isFull = true }: SeedCardProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const seedFromUrl = searchParams.get("seed");
  const { showToast } = useToast();
  const router = useRouter(); // Initialize router

  const [seedPhrase, setSeedPhrase] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // State for proceed button

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhrases, setModalPhrases] = useState<string[]>([]);
  const [modalMode, setModalMode] = useState<"selection" | "expanding">("selection");
  const [isSaving, setIsSaving] = useState(false);

  // Auto-expansion state
  const [expansionProgress, setExpansionProgress] = useState<ExpansionProgress | null>(null);
  const [isAutoExpanding, setIsAutoExpanding] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0); // 0-100 percentage
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFullyFinished, setIsFullyFinished] = useState(false); // Gate: only true when toast fires
  const expansionAbortRef = useRef(false);
  const messageRef = useRef<NodeJS.Timeout | null>(null);
  const userNavigatedAwayRef = useRef(false); // Track if user closed modal to continue browsing

  // Module completion tracking
  const [modules, setModules] = useState<ModuleState>({
    top10: "idle",
    child: "idle",
    az: "idle",
    prefix: "idle",
  });

  // Check if all modules are complete (data exists)
  const modulesAllComplete = modules.top10 === "complete" &&
    modules.child === "complete" &&
    modules.az === "complete" &&
    modules.prefix === "complete";

  // Calculate total topics for Essential View display
  const totalTopics = sourceCounts.top10 + sourceCounts.child + sourceCounts.az + sourceCounts.prefix;

  // GATE: Only show "complete" UI if:
  // 1. We're not currently expanding AND all modules have data, OR
  // 2. We explicitly finished (isFullyFinished is true)
  // This prevents the "complete" message from showing during active expansion
  const allComplete = isFullyFinished || (!isAutoExpanding && !isExpanding && modulesAllComplete);

  // Check if any expansion has started
  const hasStarted = modules.top10 !== "idle";

  // Load seed phrase from URL param or fetch from session
  useEffect(() => {
    async function loadSeedPhrase() {
      if (seedFromUrl) {
        setSeedPhrase(decodeURIComponent(seedFromUrl));
        return;
      }

      if (sessionId) {
        try {
          const session = await getSessionById(sessionId);
          if (session?.seed_phrase) {
            setSeedPhrase(session.seed_phrase);
          }
        } catch (error) {
          console.error("Failed to load session:", error);
        }
      }
    }
    loadSeedPhrase();
  }, [sessionId, seedFromUrl]);

  // Load existing module completion state from props
  useEffect(() => {
    setModules({
      top10: sourceCounts.top10 > 0 ? "complete" : "idle",
      child: sourceCounts.child > 0 ? "complete" : "idle",
      az: sourceCounts.az > 0 ? "complete" : "idle",
      prefix: sourceCounts.prefix > 0 ? "complete" : "idle",
    });
  }, [sourceCounts]);

  // Start message rotation - 10 seconds per message for proper reading time
  const startMessageRotation = useCallback(() => {
    if (messageRef.current) return;
    setMessageIndex(0);
    messageRef.current = setInterval(() => {
      setMessageIndex((prev) => prev + 1);
    }, 10000);
  }, []);

  // Stop all timers
  const stopAllTimers = useCallback(() => {
    if (messageRef.current) {
      clearInterval(messageRef.current);
      messageRef.current = null;
    }
    setMessageIndex(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAllTimers();
  }, [stopAllTimers]);

  // Handle the main "Generate Topic Ideas" button click
  const handleGenerateClick = async () => {
    if (!seedPhrase || !sessionId) return;

    setModules((prev) => ({ ...prev, top10: "loading" }));

    try {
      const response = await authFetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: seedPhrase, method: "top10" }),
      });

      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      setModalPhrases(data.suggestions);
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch Top 10 suggestions:", error);
      setModules((prev) => ({ ...prev, top10: "idle" }));
    }
  };

  // Save selected phrases and trigger auto-expansion
  const handleSavePhrases = async (selectedPhrases: string[]) => {
    if (!sessionId || selectedPhrases.length === 0) {
      setModalOpen(false);
      return;
    }

    setIsSaving(true);

    try {
      const seedInputs = selectedPhrases.map((phrase, index) => ({
        phrase,
        generationMethod: "top10",
        position: index,
      }));

      await addSeeds(sessionId, seedInputs);
      setModules((prev) => ({ ...prev, top10: "complete" }));
      onPhrasesAdded?.();

      // Switch modal to expansion mode and start auto-expansion
      setModalMode("expanding");
      setIsAutoExpanding(true);
      setIsExpanding(true); // Sync with parent
      setIsFullyFinished(false); // Reset the finished flag
      setOverallProgress(10); // Top 10 selection = 10%
      expansionAbortRef.current = false;

      runAutoExpansion(selectedPhrases);

    } catch (error) {
      console.error("Failed to save phrases:", error);
      setModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle "Proceed to Refine" click - runs Data Intake (copied from Step1Card)
  const handleProceed = async () => {
    if (!sessionId || isProcessing) return;

    setIsProcessing(true);

    try {
      // Run Data Intake API
      const response = await authFetch(`/api/sessions/${sessionId}/intake`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Data Intake failed');
      }

      // Navigate to Refine page
      router.push(`/members/build/refine?session_id=${sessionId}`);
    } catch (error) {
      console.error('Failed to run Data Intake:', error);
      setIsProcessing(false);
      showToast({
        type: "error",
        title: "Processing Failed",
        message: "Could not proceed to next step. Please try again.",
      });
    }
  };

  /**
   * Stream SSE events from the topics API
   * Updates progress in real-time as each query completes
   */
  const streamExpansion = async (
    method: string,
    seed: string,
    parentPhrases?: string[]
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const body: Record<string, unknown> = { sessionId, seed, method };
      if (parentPhrases) {
        body.parentPhrases = parentPhrases;
      }

      authFetch("/api/topics/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (response) => {
        if (!response.ok || !response.body) {
          console.error(`Stream failed for ${method}`);
          resolve(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events (separated by double newlines)
            const events = buffer.split("\n\n");
            buffer = events.pop() || ""; // Keep incomplete event in buffer

            for (const eventStr of events) {
              if (!eventStr.startsWith("data: ")) continue;

              try {
                const event: StreamProgressEvent = JSON.parse(eventStr.slice(6));

                if (event.type === "progress") {
                  // Update expansion progress for modal
                  setExpansionProgress({
                    phase: method as "child" | "az" | "prefix",
                    current: event.current,
                    total: event.total,
                  });

                  // Refresh the seeds table immediately when new phrases are added
                  if (event.added > 0) {
                    onPhrasesAdded?.();
                  }
                } else if (event.type === "complete") {
                  // Phase complete - refresh table one final time
                  onPhrasesAdded?.();
                  resolve(true);
                  return;
                } else if (event.type === "error") {
                  console.error(`Error in ${method} stream`);
                  resolve(false);
                  return;
                }
              } catch {
                console.warn("Failed to parse SSE event:", eventStr);
              }
            }
          }

          // Stream ended without explicit complete event
          onPhrasesAdded?.();
          resolve(true);
        } catch (streamError) {
          console.error("Stream reading error:", streamError);
          resolve(false);
        }
      }).catch((fetchError) => {
        console.error("Fetch error:", fetchError);
        resolve(false);
      });
    });
  };

  // Run the full auto-expansion sequence with SSE streaming
  const runAutoExpansion = async (parentPhrases: string[]) => {
    if (!sessionId || !seedPhrase) return;

    startMessageRotation();

    try {
      // Phase 1: Child (10% → 40%)
      if (!expansionAbortRef.current) {
        setExpansionProgress({ phase: "child", current: 0, total: parentPhrases.length * 3 });
        setModules((prev) => ({ ...prev, child: "loading" }));

        const childSuccess = await streamExpansion("child", seedPhrase, parentPhrases);

        if (childSuccess) {
          setModules((prev) => ({ ...prev, child: "complete" }));
          setOverallProgress(40);
        }
      }

      // Phase 2: A-Z (40% → 70%)
      if (!expansionAbortRef.current) {
        setExpansionProgress({ phase: "az", current: 0, total: 26 });
        setModules((prev) => ({ ...prev, az: "loading" }));

        const azSuccess = await streamExpansion("az", seedPhrase);

        if (azSuccess) {
          setModules((prev) => ({ ...prev, az: "complete" }));
          setOverallProgress(70);
        }
      }

      // Phase 3: Prefix (70% → 100%)
      if (!expansionAbortRef.current) {
        setExpansionProgress({ phase: "prefix", current: 0, total: 25 });
        setModules((prev) => ({ ...prev, prefix: "loading" }));

        const prefixSuccess = await streamExpansion("prefix", seedPhrase);

        if (prefixSuccess) {
          // Don't set to "complete" yet - wait for final sync
          setOverallProgress(100);
        }
      }

      // Final refresh to ensure all phrases are in the database and displayed
      // Wait longer to ensure all async database writes have completed
      await new Promise(resolve => setTimeout(resolve, 2000));
      onPhrasesAdded?.();

      // Wait for the table to actually render the new data
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clean up expansion state
      stopAllTimers();
      setExpansionProgress(null);
      setModalOpen(false);
      setModalMode("selection");

      // Set prefix to complete in module state
      setModules((prev) => ({ ...prev, prefix: "complete" }));

      // NOW set the finished flag - this is the GATE that allows "complete" UI to show
      setIsFullyFinished(true);
      setIsAutoExpanding(false);
      setIsExpanding(false);

      // Only show toast if user navigated away (closed modal during expansion)
      // If they stayed on the page, they already see the "complete" UI
      if (userNavigatedAwayRef.current) {
        userNavigatedAwayRef.current = false; // Reset for next expansion
      }

    } catch (error) {
      console.error("Auto-expansion failed:", error);
      stopAllTimers();
      setIsAutoExpanding(false);
      setIsExpanding(false);
      setExpansionProgress(null);
      setModalOpen(false);
      setModalMode("selection");

      showToast({
        type: "error",
        title: "Expansion Failed",
        message: "Something went wrong. Please try again.",
        duration: 0,
      });
    }
  };

  // Handle closing modal during expansion
  const handleContinueBrowsing = () => {
    userNavigatedAwayRef.current = true; // User chose to leave, show toast when done
    setModalOpen(false);
  };

  // Get current phase for display
  const getCurrentPhase = (): keyof ModuleState | null => {
    if (modules.child === "loading") return "child";
    if (modules.az === "loading") return "az";
    if (modules.prefix === "loading") return "prefix";
    if (modules.top10 === "loading") return "top10";
    return expansionProgress?.phase || null;
  };

  const currentPhase = getCurrentPhase();

  // Calculate real progress based on current phase progress
  const getRealProgress = (): number => {
    if (!expansionProgress || !currentPhase) return overallProgress;

    const { current, total } = expansionProgress;
    if (total === 0) return overallProgress;

    const phaseProgress = (current / total) * 100;

    // Map phase progress to overall progress ranges
    switch (currentPhase) {
      case "child":
        return Math.round(10 + (phaseProgress * 0.3)); // 10% → 40%
      case "az":
        return Math.round(40 + (phaseProgress * 0.3)); // 40% → 70%
      case "prefix":
        return Math.round(70 + (phaseProgress * 0.3)); // 70% → 100%
      default:
        return overallProgress;
    }
  };

  const displayProgress = getRealProgress();

  return (
    <>
      <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group -mt-4">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-25"></div>
        <div className="flex flex-col items-center gap-8 pt-2 relative z-10">
          {/* Locked Seed Display */}
          <div className="inline-flex items-center justify-center gap-2.5 bg-white/[0.18] border border-white/25 rounded-xl px-8 py-3">
            <span className="opacity-80">
              <SeedIconGreen size={18} />
            </span>
            <span className="text-sm text-white/90 font-normal tracking-wide">
              {seedPhrase ? toTitleCase(seedPhrase) : "No seed phrase"}
            </span>
          </div>

          {/* Main Action Button OR Progress Display */}
          {!hasStarted ? (
            // Initial state: Show expand button
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={handleGenerateClick}
                disabled={!seedPhrase || !sessionId}
                className="px-14 py-6 bg-gradient-to-r from-[#7C3AED] via-[#4F46E5] to-[#0891B2] hover:from-[#8B5CF6] hover:via-[#6366F1] hover:to-[#06B6D4] text-white rounded-2xl font-bold text-3xl transition-all flex items-center gap-3 shadow-[0_0_35px_rgba(124,58,237,0.5)] hover:shadow-[0_0_45px_rgba(124,58,237,0.7)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <IconSparkles size={28} />
                Start Expansion
              </button>
              <p className="text-white/80 text-xl text-center font-medium">
                {seedPhrase
                  ? "From Seed to Super Topic — One Click to Find Yours."
                  : "Create a session with a topic to get started."
                }
              </p>
            </div>
          ) : allComplete ? (
            // Completed state: Show success message
            <div className="flex flex-col items-center gap-8 py-2">
              <div className="flex items-center gap-3 text-white">
                <IconCheck size={24} className="text-white/70" />
                <span className="text-lg font-semibold">Topic Expansion Complete</span>
              </div>
              {/* Completion badges - neutral cream/white color for consistency - Only show in Detailed mode */}
              {isFull && (
                <div className="flex items-center justify-center gap-3">
                  {(["top10", "child", "az", "prefix"] as const).map((method) => (
                    <div
                      key={method}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 text-[#E0E7EF] border border-white/20"
                    >
                      <IconCheck size={14} className="text-white/60" />
                      {method === "top10" ? "Top 10" : method === "az" ? "A-Z" : toTitleCase(method)}
                    </div>
                  ))}
                </div>
              )}

              {/* Proceed Button & Stats - ONLY for Essential View (Simple Mode) */}
              {!isFull && (
                <div className="flex flex-col items-center gap-4 mt-2">
                  {/* Topic Count Pill */}
                  <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm font-medium">
                    Total Topics: <span className="text-white font-bold ml-1">{totalTopics}</span>
                  </div>

                  <button
                    onClick={handleProceed}
                    disabled={isProcessing}
                    className="px-10 py-5 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#2BD899] font-bold text-xl rounded-xl transition-all border-2 border-[#2BD899]/30 shadow-[0_0_15px_rgba(43,216,153,0.15)] hover:shadow-[0_0_25px_rgba(43,216,153,0.25)] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <IconLoader2 size={24} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Refine
                        <IconArrowRight size={24} />
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          ) : (
            // In progress state: Show progress bar and status
            <div className="flex flex-col gap-5 pt-2 w-full self-stretch">
              {/* Rotating Message - neutral cream/white color */}
              {currentPhase && (
                <p
                  className="text-center text-lg font-normal transition-opacity duration-500"
                  style={{ color: PROGRESS_NEUTRAL_COLOR }}
                >
                  {PROGRESS_MESSAGES[currentPhase]?.[messageIndex % PROGRESS_MESSAGES[currentPhase].length]}
                </p>
              )}

              {/* Progress Bar - 78% width, centered */}
              <div
                className="relative h-5 bg-black/30 rounded-full border border-white/10 overflow-hidden mx-auto"
                style={{ width: '78%' }}
              >
                {/* Fill - neutral electric blue */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${displayProgress}%`,
                    backgroundColor: PROGRESS_BAR_COLOR,
                    opacity: 0.7,
                  }}
                />
                {/* Shimmer effect */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full animate-pulse"
                  style={{
                    width: `${displayProgress}%`,
                    background: `linear-gradient(90deg, transparent, ${PROGRESS_BAR_COLOR}50, transparent)`,
                  }}
                />
              </div>

              {/* Phase Status Dots - neutral cream color for all - Only show in Detailed mode */}
              {isFull && (
                <div className="flex items-center justify-center gap-5">
                  {(["top10", "child", "az", "prefix"] as const).map((method) => {
                    const status = modules[method];
                    const isComplete = status === "complete";
                    const isActive = status === "loading";

                    return (
                      <div key={method} className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full transition-all ${isComplete
                            ? "bg-[#E0E7EF]"
                            : isActive
                              ? "bg-[#E0E7EF] animate-pulse"
                              : "bg-white/20"
                            }`}
                        />
                        <span
                          className={`text-base font-medium transition-colors ${isComplete || isActive
                            ? "text-[#E0E7EF]"
                            : "text-white/40"
                            }`}
                        >
                          {method === "top10" ? "Top 10" : method === "az" ? "A-Z" : toTitleCase(method)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phrase Selection Modal */}
      <PhraseSelectModal
        isOpen={modalOpen}
        onClose={() => {
          if (!isAutoExpanding) {
            setModalOpen(false);
            setModules((prev) => ({ ...prev, top10: "idle" }));
            setModalMode("selection");
          }
        }}
        title="Select Your Top Topics"
        phrases={modalPhrases}
        onSave={handleSavePhrases}
        isLoading={isSaving}
        mode={modalMode}
        expansionProgress={expansionProgress}
        seedPhrase={seedPhrase}
        onContinueBrowsing={handleContinueBrowsing}
        isFull={isFull}
      />
    </>
  );
}
