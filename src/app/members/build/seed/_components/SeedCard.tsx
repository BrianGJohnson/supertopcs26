"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SeedIconGreen } from "@/components/icons";
import { getSessionById } from "@/hooks/useSessions";
import { addSeeds, getSeedsByMethod } from "@/hooks/useSeedPhrases";
import { PhraseSelectModal } from "./PhraseSelectModal";
import { IconCheck } from "@tabler/icons-react";
import { toTitleCase } from "@/lib/utils";

// Module completion state type
type ModuleStatus = "idle" | "loading" | "complete";

interface ModuleState {
  top10: ModuleStatus;
  child: ModuleStatus;
  az: ModuleStatus;
  prefix: ModuleStatus;
}

// Progress state for streaming methods
interface ProgressState {
  current: number;
  total: number;
}

// Progress messages for each method (Brand Voice: viewer-focused, educational)
const PROGRESS_MESSAGES: Record<string, string[]> = {
  top10: [
    "These Are The Most Popular Topics With Viewers",
    "High Popularity Means More Competition",
    "Orange Signals Strong Interest But Crowded Space",
    "The Foundation — Popular Topics Viewers Love",
    "Starting With What Viewers Want Most",
  ],
  child: [
    "Derived From Your Top 10 — Still Popular",
    "Same Viewer Interest With Less Competition",
    "The Sweet Spot — Popular But Less Crowded",
    "Green Means Room To Grow And Stand Out",
    "Premium Topics — Popularity Meets Opportunity",
  ],
  az: [
    "Uncovering Every Possible Topic Variation",
    "Discovering Topics Most Creators Miss",
    "Diving Deep Into Your Topic Landscape",
    "Finding The Topics Others Overlook",
    "Hidden Gems Waiting For Your Channel",
  ],
  prefix: [
    "Identifying Question-Based Topic Angles",
    "Questions Reveal What Viewers Wonder",
    "These Topics Often Drive Evergreen Views",
    "How, What, Why — Powerful Title Starters",
    "Question Topics Attract Long-Term Traffic",
  ],
};

// Method colors for progress bar
const METHOD_COLORS: Record<string, string> = {
  top10: "#FF8A3D",
  child: "#D4E882",
  az: "#4DD68A",
  prefix: "#39C7D8",
};

interface SeedCardProps {
  onPhrasesAdded?: () => void;
}

export function SeedCard({ onPhrasesAdded }: SeedCardProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const seedFromUrl = searchParams.get("seed");
  
  const [seedPhrase, setSeedPhrase] = useState("");
  
  // Modal state (only for Top 10)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhrases, setModalPhrases] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Module completion tracking
  const [modules, setModules] = useState<ModuleState>({
    top10: "idle",
    child: "idle",
    az: "idle",
    prefix: "idle",
  });

  // Progress tracking for streaming methods
  const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0 });
  const [activeStreamMethod, setActiveStreamMethod] = useState<keyof ModuleState | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Polling interval ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const messageRef = useRef<NodeJS.Timeout | null>(null);

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

  // Load existing module completion state from database on mount
  useEffect(() => {
    async function loadModuleStates() {
      if (!sessionId) return;
      
      try {
        // Check which methods already have phrases saved
        const [top10Seeds, childSeeds, azSeeds, prefixSeeds] = await Promise.all([
          getSeedsByMethod(sessionId, "top10"),
          getSeedsByMethod(sessionId, "child"),
          getSeedsByMethod(sessionId, "az"),
          getSeedsByMethod(sessionId, "prefix"),
        ]);
        
        setModules({
          top10: top10Seeds.length > 0 ? "complete" : "idle",
          child: childSeeds.length > 0 ? "complete" : "idle",
          az: azSeeds.length > 0 ? "complete" : "idle",
          prefix: prefixSeeds.length > 0 ? "complete" : "idle",
        });
      } catch (error) {
        console.error("Failed to load module states:", error);
      }
    }
    loadModuleStates();
  }, [sessionId]);

  // Start polling when streaming is active
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    
    // Immediately trigger first refresh
    onPhrasesAdded?.();
    
    pollingRef.current = setInterval(() => {
      onPhrasesAdded?.(); // Trigger table refresh
    }, 3000); // Every 3 seconds
  }, [onPhrasesAdded]);

  // Start progress simulation (estimates based on ~5 seconds per item)
  const startProgressSimulation = useCallback((total: number) => {
    if (progressRef.current) return;
    
    let current = 0;
    progressRef.current = setInterval(() => {
      current += 1;
      if (current <= total) {
        setProgress({ current, total });
      }
    }, 5000); // Increment every 5 seconds (roughly matches API timing)
  }, []);

  // Start message rotation
  const startMessageRotation = useCallback(() => {
    if (messageRef.current) return;
    setMessageIndex(0);
    
    messageRef.current = setInterval(() => {
      setMessageIndex((prev) => prev + 1);
    }, 8000); // Rotate every 8 seconds
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    if (messageRef.current) {
      clearInterval(messageRef.current);
      messageRef.current = null;
    }
    setMessageIndex(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Fetch Top 10 suggestions (uses modal for selection)
  const fetchTop10 = async () => {
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

  // Stream suggestions for Child, A-Z, Prefix (saves directly to DB)
  const streamSuggestions = async (method: "child" | "az" | "prefix") => {
    if (!seedPhrase || !sessionId) return;
    
    setModules((prev) => ({ ...prev, [method]: "loading" }));
    setActiveStreamMethod(method);
    setProgress({ current: 0, total: 0 });
    
    // Start polling to refresh table
    startPolling();
    // Start message rotation
    startMessageRotation();
    
    try {
      // Build request body
      const requestBody: { sessionId: string; seed: string; method: string; parentPhrases?: string[] } = {
        sessionId,
        seed: seedPhrase,
        method,
      };
      
      // For child method, get the existing Top 10 phrases
      if (method === "child") {
        const top10Seeds = await getSeedsByMethod(sessionId, "top10");
        if (top10Seeds.length === 0) {
          console.error("No Top 10 phrases found to expand");
          setModules((prev) => ({ ...prev, [method]: "idle" }));
          stopPolling();
          setActiveStreamMethod(null);
          return;
        }
        requestBody.parentPhrases = top10Seeds.map((s) => s.phrase);
        setProgress({ current: 0, total: top10Seeds.length });
        startProgressSimulation(top10Seeds.length);
      } else if (method === "az") {
        setProgress({ current: 0, total: 26 });
        startProgressSimulation(26);
      } else if (method === "prefix") {
        setProgress({ current: 0, total: 25 });
        startProgressSimulation(25);
      }
      
      const response = await fetch("/api/autocomplete/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) throw new Error("Failed to stream suggestions");
      
      const data = await response.json();
      
      // Mark as complete
      setModules((prev) => ({ ...prev, [method]: "complete" }));
      setProgress(data.progress || { current: 0, total: 0 });
      
      // Final refresh
      onPhrasesAdded?.();
    } catch (error) {
      console.error(`Failed to stream ${method} suggestions:`, error);
      setModules((prev) => ({ ...prev, [method]: "idle" }));
    } finally {
      stopPolling();
      setActiveStreamMethod(null);
    }
  };

  // Handle button click based on method
  const handleExpansionClick = (method: keyof ModuleState) => {
    if (method === "top10") {
      fetchTop10();
    } else {
      streamSuggestions(method);
    }
  };

  // Save selected phrases (Top 10 only)
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
      setModalOpen(false);
      
      // Notify parent to refresh table
      onPhrasesAdded?.();
    } catch (error) {
      console.error("Failed to save phrases:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Determine which modules are unlocked based on sequential completion (left to right)
  const isModuleUnlocked = (method: keyof ModuleState): boolean => {
    // Top 10 is always unlocked first (if not complete)
    if (method === "top10") return modules.top10 !== "complete";
    
    // Child unlocks only after Top 10 is complete (and Child isn't complete)
    if (method === "child") {
      return modules.top10 === "complete" && modules.child !== "complete";
    }
    
    // A-Z unlocks only after Child is complete (and A-Z isn't complete)
    if (method === "az") {
      return modules.top10 === "complete" && 
             modules.child === "complete" && 
             modules.az !== "complete";
    }
    
    // Prefix unlocks only after A-Z is complete (and Prefix isn't complete)
    if (method === "prefix") {
      return modules.top10 === "complete" && 
             modules.child === "complete" && 
             modules.az === "complete" &&
             modules.prefix !== "complete";
    }
    
    return false;
  };

  // Get button label based on state
  const getButtonLabel = (method: keyof ModuleState, defaultLabel: string): string => {
    const status = modules[method];
    
    if (status === "loading") {
      // Show progress for streaming methods
      if (activeStreamMethod === method && progress.total > 0) {
        return `${progress.current}/${progress.total}...`;
      }
      return "Loading...";
    }
    
    return defaultLabel;
  };

  // Button component with states
  const ExpansionButton = ({
    method,
    label,
    colorClass,
    borderColor,
    shadowColor,
  }: {
    method: keyof ModuleState;
    label: string;
    colorClass: string;
    borderColor: string;
    shadowColor: string;
  }) => {
    const status = modules[method];
    const isComplete = status === "complete";
    const isLoading = status === "loading";
    const isUnlocked = isModuleUnlocked(method);
    const isClickable = isUnlocked && !isLoading;
    const displayLabel = getButtonLabel(method, label);
    
    return (
      <button
        onClick={() => isClickable && handleExpansionClick(method)}
        disabled={!isClickable}
        className={`
          px-4 py-4 rounded-xl font-semibold text-[17px] leading-tight transition-all
          flex items-center justify-center gap-2
          ${isComplete
            ? "bg-white/5 border border-white/10 text-white/40 cursor-default"
            : isLoading
            ? "bg-white/10 border border-white/20 text-white/70 cursor-wait"
            : isUnlocked
            ? `${colorClass} border ${borderColor} text-inherit hover:opacity-90 shadow-[0_0_15px_${shadowColor}] cursor-pointer`
            : "bg-white/[0.05] border border-white/15 text-white/45 cursor-default"
          }
        `}
      >
        {isComplete && <IconCheck size={18} className="text-white/40" />}
        {displayLabel}
      </button>
    );
  };

  return (
    <>
      <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group -mt-4">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-25"></div>
        <div className="max-w-2xl mx-auto flex flex-col gap-8 relative z-10">
          {/* Locked Seed Display */}
          <div className="flex items-center justify-center gap-3 bg-black/40 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/20 rounded-2xl px-8 py-5">
            <span className="opacity-80">
              <SeedIconGreen size={28} />
            </span>
            <span className="text-xl text-white font-medium">
              {seedPhrase ? toTitleCase(seedPhrase) : "No seed phrase"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ExpansionButton
              method="top10"
              label="Top 10"
              colorClass="bg-[#FF8A3D]/10 hover:bg-[#FF8A3D]/20 text-[#FF8A3D]"
              borderColor="border-[#FF8A3D]/30"
              shadowColor="rgba(255,138,61,0.1)"
            />
            <ExpansionButton
              method="child"
              label="Child"
              colorClass="bg-[#D4E882]/10 hover:bg-[#D4E882]/20 text-[#D4E882]"
              borderColor="border-[#D4E882]/30"
              shadowColor="rgba(212,232,130,0.1)"
            />
            <ExpansionButton
              method="az"
              label="A–Z"
              colorClass="bg-[#4DD68A]/10 hover:bg-[#4DD68A]/20 text-[#4DD68A]"
              borderColor="border-[#4DD68A]/30"
              shadowColor="rgba(77,214,138,0.1)"
            />
            <ExpansionButton
              method="prefix"
              label="Prefix"
              colorClass="bg-[#39C7D8]/10 hover:bg-[#39C7D8]/20 text-[#39C7D8]"
              borderColor="border-[#39C7D8]/30"
              shadowColor="rgba(57,199,216,0.1)"
            />
          </div>

          {/* Progress Bar - Only visible during streaming */}
          {activeStreamMethod && (
            <div className="flex flex-col mt-2 animate-in fade-in duration-300">
              {/* Message */}
              <p 
                className="text-center text-xl font-semibold mb-4 transition-opacity duration-500"
                style={{ color: METHOD_COLORS[activeStreamMethod] }}
              >
                {PROGRESS_MESSAGES[activeStreamMethod]?.[messageIndex % PROGRESS_MESSAGES[activeStreamMethod].length]}
              </p>
              
              {/* Progress Bar Container */}
              <div className="relative h-7 bg-black/40 rounded-full border border-white/10 overflow-hidden">
                {/* Fill */}
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
                    backgroundColor: METHOD_COLORS[activeStreamMethod],
                    opacity: 0.3,
                  }}
                />
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-y-0 left-0 rounded-full animate-pulse"
                  style={{ 
                    width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
                    background: `linear-gradient(90deg, transparent, ${METHOD_COLORS[activeStreamMethod]}40, transparent)`,
                  }}
                />
                {/* Progress text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white/70">
                    {progress.current} / {progress.total}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phrase Selection Modal (Top 10 only) */}
      <PhraseSelectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModules((prev) => ({ ...prev, top10: "idle" }));
        }}
        title="Select Top 10 Topics"
        phrases={modalPhrases}
        onSave={handleSavePhrases}
        isLoading={isSaving}
      />
    </>
  );
}
