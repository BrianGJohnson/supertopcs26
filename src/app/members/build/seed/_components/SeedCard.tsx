"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SeedIconGreen } from "@/components/icons";
import { getSessionById } from "@/hooks/useSessions";
import { addSeeds } from "@/hooks/useSeedPhrases";
import type { Seed } from "@/types/database";
import { PhraseSelectModal, ExpansionProgress } from "./PhraseSelectModal";
import { IconCheck, IconSparkles } from "@tabler/icons-react";
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

// Progress messages for each method (Brand Voice: viewer-focused, educational)
const PROGRESS_MESSAGES: Record<string, string[]> = {
  top10: [
    "Finding The Most Popular Topics",
    "Identifying What Viewers Search For Most",
    "Building Your Foundation Topics",
  ],
  child: [
    "Expanding Your Top Picks Into Related Topics",
    "Finding Variations With Less Competition",
    "Discovering The Sweet Spot Topics",
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

// Method colors
const METHOD_COLORS: Record<string, string> = {
  top10: "#FF8A3D",
  child: "#D4E882",
  az: "#4DD68A",
  prefix: "#39C7D8",
};

interface SeedCardProps {
  onPhrasesAdded?: () => void;
  sourceCounts: {
    top10: number;
    child: number;
    az: number;
    prefix: number;
  };
  seeds: Seed[];
}

export function SeedCard({ onPhrasesAdded, sourceCounts, seeds }: SeedCardProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const seedFromUrl = searchParams.get("seed");
  const { showToast } = useToast();
  
  const [seedPhrase, setSeedPhrase] = useState("");
  
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
  const expansionAbortRef = useRef(false);
  const messageRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  
  // Module completion tracking
  const [modules, setModules] = useState<ModuleState>({
    top10: "idle",
    child: "idle",
    az: "idle",
    prefix: "idle",
  });
  
  // Polling interval ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check if all modules are complete
  const allComplete = modules.top10 === "complete" && 
                      modules.child === "complete" && 
                      modules.az === "complete" && 
                      modules.prefix === "complete";

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

  // Start polling when streaming is active
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    onPhrasesAdded?.();
    pollingRef.current = setInterval(() => {
      onPhrasesAdded?.();
    }, 3000);
  }, [onPhrasesAdded]);

  // Start message rotation
  const startMessageRotation = useCallback(() => {
    if (messageRef.current) return;
    setMessageIndex(0);
    messageRef.current = setInterval(() => {
      setMessageIndex((prev) => prev + 1);
    }, 6000);
  }, []);

  // Start progress animation (smooth increment)
  const startProgressAnimation = useCallback((startPercent: number, endPercent: number, durationMs: number) => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    
    const steps = 20;
    const increment = (endPercent - startPercent) / steps;
    const intervalMs = durationMs / steps;
    let current = startPercent;
    
    progressRef.current = setInterval(() => {
      current += increment;
      if (current >= endPercent) {
        current = endPercent;
        if (progressRef.current) {
          clearInterval(progressRef.current);
          progressRef.current = null;
        }
      }
      setOverallProgress(Math.round(current));
    }, intervalMs);
  }, []);

  // Stop all timers
  const stopAllTimers = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (messageRef.current) {
      clearInterval(messageRef.current);
      messageRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
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
      const response = await fetch("/api/autocomplete", {
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

  // Run the full auto-expansion sequence
  const runAutoExpansion = async (parentPhrases: string[]) => {
    if (!sessionId || !seedPhrase) return;
    
    startPolling();
    startMessageRotation();
    
    try {
      // Phase 1: Child (10% → 40%)
      if (!expansionAbortRef.current) {
        setExpansionProgress({ phase: "child", current: 0, total: parentPhrases.length });
        setModules((prev) => ({ ...prev, child: "loading" }));
        startProgressAnimation(10, 40, 30000); // Animate over ~30 seconds
        
        const childResponse = await fetch("/api/autocomplete/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            seed: seedPhrase,
            method: "child",
            parentPhrases,
          }),
        });
        
        if (childResponse.ok) {
          setModules((prev) => ({ ...prev, child: "complete" }));
          setOverallProgress(40);
          onPhrasesAdded?.();
        }
      }
      
      // Phase 2: A-Z (40% → 70%)
      if (!expansionAbortRef.current) {
        setExpansionProgress({ phase: "az", current: 0, total: 26 });
        setModules((prev) => ({ ...prev, az: "loading" }));
        startProgressAnimation(40, 70, 60000); // Animate over ~60 seconds
        
        const azResponse = await fetch("/api/autocomplete/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            seed: seedPhrase,
            method: "az",
          }),
        });
        
        if (azResponse.ok) {
          setModules((prev) => ({ ...prev, az: "complete" }));
          setOverallProgress(70);
          onPhrasesAdded?.();
        }
      }
      
      // Phase 3: Prefix (70% → 100%)
      if (!expansionAbortRef.current) {
        setExpansionProgress({ phase: "prefix", current: 0, total: 25 });
        setModules((prev) => ({ ...prev, prefix: "loading" }));
        startProgressAnimation(70, 100, 60000); // Animate over ~60 seconds
        
        const prefixResponse = await fetch("/api/autocomplete/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            seed: seedPhrase,
            method: "prefix",
          }),
        });
        
        if (prefixResponse.ok) {
          setModules((prev) => ({ ...prev, prefix: "complete" }));
          setOverallProgress(100);
          onPhrasesAdded?.();
        }
      }
      
      // All done!
      showToast({
        type: "success",
        title: `${toTitleCase(seedPhrase)} Complete!`,
        message: "Your topic expansion is ready for review.",
        action: {
          label: "View Results",
          href: "/members/build/refine",
        },
        duration: 0,
      });
      
    } catch (error) {
      console.error("Auto-expansion failed:", error);
      showToast({
        type: "error",
        title: "Expansion Failed",
        message: "Something went wrong. Please try again.",
        duration: 0,
      });
    } finally {
      stopAllTimers();
      setIsAutoExpanding(false);
      setExpansionProgress(null);
      setModalOpen(false);
      setModalMode("selection");
    }
  };

  // Handle closing modal during expansion
  const handleContinueBrowsing = () => {
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
                className="px-14 py-6 bg-gradient-to-r from-[#7C3AED] via-[#4F46E5] to-[#0891B2] hover:from-[#8B5CF6] hover:via-[#6366F1] hover:to-[#06B6D4] text-white rounded-2xl font-bold text-3xl transition-all flex items-center gap-3 shadow-[0_0_35px_rgba(124,58,237,0.5)] hover:shadow-[0_0_45px_rgba(124,58,237,0.7)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconSparkles size={28} />
                Expand Topic
              </button>
              <p className="text-white/80 text-xl text-center font-medium">
                From Seed to Super Topic — One Click to Find Yours.
              </p>
            </div>
          ) : allComplete ? (
            // Completed state: Show success message
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="flex items-center gap-3 text-primary">
                <IconCheck size={24} />
                <span className="text-lg font-semibold">Topic Expansion Complete</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                {(["top10", "child", "az", "prefix"] as const).map((method) => (
                  <div
                    key={method}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${METHOD_COLORS[method]}15`,
                      color: METHOD_COLORS[method],
                    }}
                  >
                    <IconCheck size={14} />
                    {method === "top10" ? "Top 10" : method === "az" ? "A-Z" : toTitleCase(method)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // In progress state: Show progress bar and status
            <div className="flex flex-col gap-5 pt-2 w-full self-stretch">
              {/* Rotating Message */}
              {currentPhase && (
                <p 
                  className="text-center text-lg font-normal transition-opacity duration-500 opacity-90"
                  style={{ color: METHOD_COLORS[currentPhase] }}
                >
                  {PROGRESS_MESSAGES[currentPhase]?.[messageIndex % PROGRESS_MESSAGES[currentPhase].length]}
                </p>
              )}
              
              {/* Progress Bar - 78% width, centered */}
              <div 
                className="relative h-5 bg-black/30 rounded-full border border-white/10 overflow-hidden mx-auto"
                style={{ width: '78%' }}
              >
                {/* Fill */}
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${overallProgress}%`,
                    backgroundColor: currentPhase ? METHOD_COLORS[currentPhase] : "#4DD68A",
                    opacity: 0.5,
                  }}
                />
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-y-0 left-0 rounded-full animate-pulse"
                  style={{ 
                    width: `${overallProgress}%`,
                    background: currentPhase 
                      ? `linear-gradient(90deg, transparent, ${METHOD_COLORS[currentPhase]}50, transparent)`
                      : `linear-gradient(90deg, transparent, rgba(77,214,138,0.5), transparent)`,
                  }}
                />
              </div>
              
              {/* Phase Status Dots - brighter labels */}
              <div className="flex items-center justify-center gap-5">
                {(["top10", "child", "az", "prefix"] as const).map((method) => {
                  const status = modules[method];
                  const isComplete = status === "complete";
                  const isActive = status === "loading";
                  
                  return (
                    <div key={method} className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          isComplete 
                            ? "" 
                            : isActive 
                            ? "animate-pulse" 
                            : "bg-white/20"
                        }`}
                        style={isComplete || isActive ? { backgroundColor: METHOD_COLORS[method] } : {}}
                      />
                      <span 
                        className={`text-base font-medium transition-colors ${
                          isComplete 
                            ? "" 
                            : isActive 
                            ? "" 
                            : "text-white/40"
                        }`}
                        style={isComplete || isActive ? { color: METHOD_COLORS[method] } : {}}
                      >
                        {method === "top10" ? "Top 10" : method === "az" ? "A-Z" : toTitleCase(method)}
                      </span>
                    </div>
                  );
                })}
              </div>
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
      />
    </>
  );
}
