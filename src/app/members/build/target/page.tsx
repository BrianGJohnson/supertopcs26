"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { Modal } from "@/components/ui/Modal";
import {
  IconTarget,
  IconLeaf,
  IconTrendingUp,
  IconCash,
  IconChevronRight,
  IconPencil,
  IconLoader2,
  IconRefresh,
  IconX,
  IconPlus,
  IconArrowsExchange,
  IconSettingsCog,
  IconTargetArrow,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { authFetch } from "@/lib/supabase";
import { createSession, listSessions } from "@/hooks/useSessions";
import { addSeeds } from "@/hooks/useSeedPhrases";
import { ViewerLandscapeModal } from "@/components/ui/ViewerLandscapeModal";
import type { Session } from "@/types/database";

/**
 * Step 1: Target - Pillar Selection
 * 
 * Purpose: Let users choose which content pillar they're targeting before entering a seed.
 * This connects their strategic pillars (from onboarding) to every video they plan.
 * 
 * Options:
 * 1. Click a pillar card to see sub-niches, then click a sub-niche to pre-fill seed
 * 2. "I have my own idea" to skip to seed with empty input
 */

interface SubNiche {
  name: string;
  demand: number;
}

interface Pillar {
  label: string;
  teachingMoment: string;
  subNiches: SubNiche[];
  selectedSubNiches?: string[];
}

interface PillarStrategy {
  pillars: {
    evergreen: Pillar;
    trending: Pillar;
    monetization: Pillar;
  };
}

type PillarType = "evergreen" | "trending" | "monetization" | null;

export default function TargetPage() {
  const router = useRouter();
  const [pillarStrategy, setPillarStrategy] = useState<PillarStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<PillarType>(null);
  const [error, setError] = useState<string | null>(null);

  // Phrase modal state
  const [phraseModalOpen, setPhraseModalOpen] = useState(false);
  const [selectedSubNiche, setSelectedSubNiche] = useState<string | null>(null);
  const [allPhrases, setAllPhrases] = useState<string[]>([]);
  const [displayedPhrases, setDisplayedPhrases] = useState<string[]>([]);
  const [usedPhrases, setUsedPhrases] = useState<string[]>([]);
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Viewer Landscape modal state
  const [landscapeModalOpen, setLandscapeModalOpen] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);

  // Quick Start modal state (for "I Have My Own Idea" button)
  const [quickStartModalOpen, setQuickStartModalOpen] = useState(false);
  const [newSeedInput, setNewSeedInput] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showSwitchSessions, setShowSwitchSessions] = useState(false);

  // Fetch pillar strategy from the user's channel data
  useEffect(() => {
    async function fetchPillarStrategy() {
      try {
        const response = await authFetch("/api/onboarding/save", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          // The API returns pillarStrategy in data.data.pillarStrategy
          if (data.data?.pillarStrategy) {
            setPillarStrategy(data.data.pillarStrategy);
          }
        }
      } catch (err) {
        console.error("Error fetching pillar strategy:", err);
        setError("Unable to load your pillars");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPillarStrategy();
  }, []);

  // Fetch phrases for a sub-niche
  const fetchPhrases = useCallback(async (subNiche: string) => {
    if (!selectedPillar) return;

    setIsLoadingPhrases(true);
    try {
      const response = await authFetch(
        `/api/seed-phrases?pillar=${selectedPillar}&subNiche=${encodeURIComponent(subNiche)}`
      );

      if (response.ok) {
        const data = await response.json();
        setAllPhrases(data.phrases || []);
        setUsedPhrases(data.usedPhrases || []);
        setPhraseIndex(0);

        // Show first 3 phrases
        const available = (data.phrases || []).filter(
          (p: string) => !(data.usedPhrases || []).includes(p)
        );
        setDisplayedPhrases(available.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching phrases:", err);
    } finally {
      setIsLoadingPhrases(false);
    }
  }, [selectedPillar]);

  // Handle clicking a sub-niche - open modal
  const handleClickSubNiche = (subNiche: string) => {
    setSelectedSubNiche(subNiche);
    setPhraseModalOpen(true);
    fetchPhrases(subNiche);
  };

  // Refresh to show next 3 phrases
  const handleRefreshPhrases = () => {
    const available = allPhrases.filter(p => !usedPhrases.includes(p));
    const nextIndex = phraseIndex + 3;

    if (nextIndex >= available.length) {
      // Loop back to start
      setPhraseIndex(0);
      setDisplayedPhrases(available.slice(0, 3));
    } else {
      setPhraseIndex(nextIndex);
      setDisplayedPhrases(available.slice(nextIndex, nextIndex + 3));
    }
  };

  // Select a phrase - open Viewer Landscape modal for analysis
  const handleSelectPhrase = (phrase: string) => {
    setPhraseModalOpen(false); // Close the phrase modal first
    setSelectedPhrase(phrase);
    setLandscapeModalOpen(true);
  };

  // Create session after user confirms in Viewer Landscape modal
  const handleCreateSessionFromLandscape = async (phrase: string) => {
    // Mark phrase as used
    if (selectedPillar && selectedSubNiche) {
      try {
        await authFetch("/api/seed-phrases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pillar: selectedPillar,
            subNiche: selectedSubNiche,
            phrase,
          }),
        });
      } catch (err) {
        console.error("Error marking phrase as used:", err);
      }
    }

    // Create a new session with the phrase as the name
    try {
      const newSession = await createSession(phrase, phrase);

      // Save the seed phrase to seeds table
      await addSeeds(newSession.id, [
        {
          phrase: phrase,
          generationMethod: "seed",
        },
      ]);

      // Navigate to seed page with session_id
      router.push(`/members/build/seed?session_id=${newSession.id}&seed=${encodeURIComponent(phrase)}&pillar=${selectedPillar}`);
    } catch (err) {
      console.error("Error creating session:", err);
      // Fallback: navigate without session (existing behavior, though it won't work properly)
      const encodedSeed = encodeURIComponent(phrase);
      router.push(`/members/build/seed?seed=${encodedSeed}&pillar=${selectedPillar}`);
    }
  };

  // Handle "Pass" in landscape modal - close and go back to phrase list
  const handlePassPhrase = () => {
    setLandscapeModalOpen(false);
    setSelectedPhrase(null);
    setPhraseModalOpen(true); // Reopen phrase modal so user can pick another
  };

  // Navigate to seed page with optional pre-filled seed (legacy - now uses modal)
  const handleSelectSubNiche = async (subNiche: string) => {
    // Create a new session with the sub-niche as the name
    try {
      const newSession = await createSession(subNiche, subNiche);

      // Save the seed phrase to seeds table
      await addSeeds(newSession.id, [
        {
          phrase: subNiche,
          generationMethod: "seed",
        },
      ]);

      // Encode the sub-niche for URL
      const encodedSeed = encodeURIComponent(subNiche.toLowerCase());
      router.push(`/members/build/seed?session_id=${newSession.id}&seed=${encodedSeed}&pillar=${selectedPillar}`);
    } catch (err) {
      console.error("Error creating session:", err);
      // Fallback
      const encodedSeed = encodeURIComponent(subNiche.toLowerCase());
      router.push(`/members/build/seed?seed=${encodedSeed}&pillar=${selectedPillar}`);
    }
  };

  // Open Quick Start modal and fetch sessions
  const handleOwnIdea = async () => {
    setQuickStartModalOpen(true);
    try {
      const list = await listSessions();
      setSessions(list);
    } catch (error) {
      console.error("Failed to list sessions", error);
    }
  };

  // Create new session with seed phrase
  const handleCreateNewSession = async () => {
    if (newSeedInput.trim().length < 2) return;

    setIsCreatingSession(true);
    try {
      const name = newSeedInput.trim();
      const newSession = await createSession(name, name);

      await addSeeds(newSession.id, [{
        phrase: name,
        generationMethod: "seed",
      }]);

      router.push(`/members/build/seed?session_id=${newSession.id}&seed=${encodeURIComponent(name)}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Switch to existing session
  const handleSwitchToSession = (sessionId: string) => {
    router.push(`/members/build/seed?session_id=${sessionId}`);
  };

  // Get pillar config (color, icon, etc.)
  const getPillarConfig = (type: PillarType) => {
    switch (type) {
      case "evergreen":
        return {
          color: "#2BD899",
          icon: IconLeaf,
          label: "Evergreen",
          description: "Videos that get views for months or years"
        };
      case "trending":
        return {
          color: "#F59E0B",
          icon: IconTrendingUp,
          label: "Trending",
          description: "Videos that spike when news breaks"
        };
      case "monetization":
        return {
          color: "#9B7DFF",
          icon: IconCash,
          label: "Monetization",
          description: "Videos that drive revenue for your business"
        };
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col gap-8 relative z-10 max-w-5xl mx-auto">
          <MemberHeader />
          <div className="flex items-center justify-center min-h-[400px]">
            <IconLoader2 size={48} className="animate-spin text-primary" />
          </div>
        </div>
      </PageShell>
    );
  }

  // No pillar strategy - prompt to complete onboarding
  if (!pillarStrategy) {
    return (
      <PageShell>
        <div className="flex flex-col gap-8 relative z-10 max-w-5xl mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          <MemberHeader />
          <BuilderStepper activeStep={1} />
          <HeroModule
            icon={IconTarget}
            line1="Choose Your Content"
            line2="Target"
            description="Select a pillar to guide your next video topic."
          />

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/10">
              <p className="text-xl text-white/70 mb-6">
                Complete onboarding to set up your content pillars first.
              </p>
              <button
                onClick={() => router.push("/members/onboarding/step-1")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)] transition-all"
              >
                Complete Onboarding
                <IconChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Selected pillar view - show sub-niches
  if (selectedPillar) {
    const config = getPillarConfig(selectedPillar)!;
    const pillar = pillarStrategy.pillars[selectedPillar];
    const Icon = config.icon;

    // Get the selected sub-niches (user's picks from onboarding) or all sub-niches
    const subNichesToShow = pillar.selectedSubNiches?.length
      ? pillar.subNiches.filter(sn => pillar.selectedSubNiches?.includes(sn.name))
      : pillar.subNiches;

    return (
      <PageShell>
        <div className="flex flex-col gap-8 relative z-10 max-w-5xl mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          <MemberHeader />
          <BuilderStepper activeStep={1} />

          <HeroModule
            icon={Icon}
            line1={`${config.label} Content`}
            line2="Sub-Niches"
            description="Click a topic to use it as your seed phrase."
          />

          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Sub-niche cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subNichesToShow.map((subNiche, index) => (
                <motion.button
                  key={subNiche.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleClickSubNiche(subNiche.name)}
                  className="px-8 py-6 rounded-2xl text-left transition-all duration-200 bg-white/[0.06] border-l-4 border-y-0 border-r-0 hover:bg-white/[0.10] hover:shadow-lg group"
                  style={{
                    borderLeftColor: `${config.color}40`,
                    ["--pillar-color" as string]: config.color,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderLeftColor = config.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderLeftColor = `${config.color}40`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-semibold text-white/90 group-hover:text-white transition-colors">
                      {subNiche.name}
                    </span>
                    <IconChevronRight
                      size={20}
                      className="text-white/30 group-hover:text-[var(--pillar-color)] group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Back + Own Idea buttons */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <button
                onClick={handleOwnIdea}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <IconPencil size={20} />
                I Have My Own Idea
              </button>

              <button
                onClick={() => setSelectedPillar(null)}
                className="text-white/40 hover:text-white/60 text-base"
              >
                ← Back to Pillars
              </button>
            </div>
          </div>

          {/* Phrase Selection Modal - OUTSIDE the grid container */}
          <Modal
            isOpen={phraseModalOpen}
            onClose={() => setPhraseModalOpen(false)}
            title="Pick Your Topic"
            footer={
              <button
                onClick={handleRefreshPhrases}
                disabled={isLoadingPhrases}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#2BD899] hover:text-[#2BD899]/80 transition-colors disabled:opacity-50"
              >
                <IconRefresh size={16} />
                Show Different Phrases
              </button>
            }
          >
            <div className="space-y-4">
              {isLoadingPhrases ? (
                <div className="flex items-center justify-center py-12">
                  <IconLoader2 size={32} className="animate-spin text-[#2BD899]" />
                  <span className="ml-3 text-white/60 text-[1.125rem]">Gathering seed topics...</span>
                </div>
              ) : (
                <>
                  {/* Instruction text */}
                  <p className="text-white/60 text-[1.125rem] leading-relaxed">
                    Click a phrase to use as your video seed.
                  </p>

                  {/* Sub-niche context */}
                  <div className="flex items-center justify-between text-[1.125rem] text-white/60 pb-4 border-b border-white/10">
                    <span className="text-white/80 font-medium">{selectedSubNiche}</span>
                    <span className="text-white/40 text-sm">
                      {allPhrases.filter(p => !usedPhrases.includes(p)).length} available
                    </span>
                  </div>

                  {/* Phrase Options - styled like PhraseSelectModal */}
                  <div className="space-y-2">
                    {displayedPhrases.map((phrase, index) => (
                      <motion.button
                        key={phrase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectPhrase(phrase)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all bg-white/[0.06] border border-white/20 text-white hover:bg-white/10 hover:border-[#2BD899]/60 group"
                      >
                        {/* Arrow indicator */}
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all bg-[#2BD899]/20 border-2 border-[#2BD899]/60 group-hover:bg-[#2BD899]/30 group-hover:border-[#2BD899]">
                          <IconChevronRight size={16} className="text-[#2BD899]" stroke={3} />
                        </div>
                        {/* Phrase text */}
                        <span className="text-[1.125rem] leading-snug capitalize group-hover:text-[#2BD899] transition-colors">
                          {phrase}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Empty state */}
                  {displayedPhrases.length === 0 && (
                    <div className="text-center py-8 text-white/40 text-[1.125rem]">
                      No phrases available. Try refreshing.
                    </div>
                  )}
                </>
              )}
            </div>
          </Modal>

          {/* Quick Start Modal - shown when clicking "I Have My Own Idea" */}
          <Modal
            isOpen={quickStartModalOpen}
            onClose={() => {
              setQuickStartModalOpen(false);
              setNewSeedInput("");
            }}
            title="Quick Start"
          >
            <div className="space-y-6">
              <p className="text-white/80 text-xl font-light leading-snug">
                Start a new session or continue where you left off.
              </p>

              {/* Option 1: Start New Session */}
              <div className="space-y-4">
                <input
                  type="text"
                  value={newSeedInput}
                  onChange={(e) => setNewSeedInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newSeedInput.trim().length >= 2) {
                      handleCreateNewSession();
                    }
                  }}
                  placeholder="Enter your seed phrase (e.g., video editing)"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-xl placeholder:text-white/30 focus:border-[#6B9BD1] focus:outline-none focus:ring-2 focus:ring-[#6B9BD1]/20 transition-all font-medium"
                  autoFocus
                />
                <button
                  onClick={handleCreateNewSession}
                  disabled={newSeedInput.trim().length < 2 || isCreatingSession}
                  className="w-full px-6 py-5 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#2BD899] font-bold text-2xl rounded-xl transition-all border-2 border-[#2BD899]/30 shadow-[0_0_15px_rgba(43,216,153,0.15)] hover:shadow-[0_0_25px_rgba(43,216,153,0.25)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <IconTargetArrow size={28} />
                  {isCreatingSession ? 'Creating...' : 'Create New Session'}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm uppercase tracking-wide">Or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Option 2: Switch to Existing Session */}
              <div className="space-y-3">
                <label className="block text-white/80 font-bold text-xl">Continue Existing Session</label>
                {sessions.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {sessions.slice(0, 10).map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSwitchToSession(session.id)}
                        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#6B9BD1]/40 rounded-xl text-left text-white/80 text-base transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{session.name}</span>
                          <IconChevronRight size={16} className="text-white/30 group-hover:text-[#6B9BD1] transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm text-center py-4">No existing sessions found</p>
                )}
              </div>
            </div>
          </Modal>

          {/* Viewer Landscape Modal - shows when phrase is clicked */}
          {selectedPhrase && (
            <ViewerLandscapeModal
              isOpen={landscapeModalOpen}
              onClose={handlePassPhrase}
              seed={selectedPhrase}
              onCreateSession={handleCreateSessionFromLandscape}
              onQuickStart={(seed) => {
                setLandscapeModalOpen(false); // Close landscape modal
                setNewSeedInput(seed);        // Pre-fill the seed
                setQuickStartModalOpen(true); // Open Quick Start modal
              }}
              onPass={handlePassPhrase}
            />
          )}

          {/* Footer */}
          <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 mt-8">
            SuperTopics.app © 2025 • All Rights Reserved • You Dig?
          </footer>
        </div>
      </PageShell>
    );
  }

  // Main view - show 3 pillar cards
  return (
    <PageShell>
      <div className="flex flex-col gap-8 relative z-10 max-w-5xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <MemberHeader />
        <BuilderStepper activeStep={1} />

        <HeroModule
          icon={IconTarget}
          line1="Choose Your Content"
          line2="Target"
          description="Select a pillar to guide your next video topic."
        />

        <div className="max-w-4xl mx-auto w-full space-y-8">
          {/* Three Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Evergreen - BRIGHT & ACTIVE */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setSelectedPillar("evergreen")}
              className="flex flex-col items-center p-8 rounded-2xl bg-[#2BD899]/15 border-2 border-[#2BD899]/60 hover:border-[#2BD899] hover:bg-[#2BD899]/20 hover:shadow-[0_0_30px_rgba(43,216,153,0.2)] transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#2BD899]/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <IconLeaf size={36} className="text-[#2BD899]" />
              </div>
              <p className="font-bold text-2xl text-white/80 mb-2">Evergreen</p>
              <p className="text-white/60 text-center text-base leading-relaxed">
                Videos that get views for months or even years. We call them Long-Term Views.
              </p>
              <p className="text-[#2BD899] text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {pillarStrategy.pillars.evergreen.selectedSubNiches?.length || pillarStrategy.pillars.evergreen.subNiches.length} sub-niches →
              </p>
            </motion.button>

            {/* Just Born Topics - GRAYED OUT with Coming Soon */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center p-8 rounded-2xl bg-white/[0.03] border-2 border-white/10 opacity-50 cursor-not-allowed"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-5">
                <IconTrendingUp size={36} className="text-white/30" />
              </div>
              <p className="font-bold text-2xl text-white/40 mb-2">Just Born</p>
              <p className="text-white/30 text-center text-base leading-relaxed">
                Topics that just hit the internet
              </p>
              {/* Coming Soon Badge - Centered below */}
              <div className="mt-4 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30">
                <span className="text-[#F59E0B] text-xs font-medium uppercase tracking-wide">Coming Soon</span>
              </div>
            </motion.div>

            {/* Monetization - BRIGHT & ACTIVE */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setSelectedPillar("monetization")}
              className="flex flex-col items-center p-8 rounded-2xl bg-[#9B7DFF]/15 border-2 border-[#9B7DFF]/60 hover:border-[#9B7DFF] hover:bg-[#9B7DFF]/20 hover:shadow-[0_0_30px_rgba(155,125,255,0.2)] transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#9B7DFF]/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <IconCash size={36} className="text-[#9B7DFF]" />
              </div>
              <p className="font-bold text-2xl text-white/80 mb-2">Monetization</p>
              <p className="text-white/60 text-center text-base leading-relaxed">
                Videos that drive your business and convert viewers into customers.
              </p>
              <p className="text-[#9B7DFF] text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {pillarStrategy.pillars.monetization.selectedSubNiches?.length || pillarStrategy.pillars.monetization.subNiches.length} sub-niches →
              </p>
            </motion.button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-white/30 text-sm uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Own Idea Button - BIGGER & MORE PROMINENT */}
          <div className="flex justify-center">
            <button
              onClick={handleOwnIdea}
              className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl font-semibold text-xl bg-white/[0.06] border-2 border-white/20 text-white/80 hover:text-white hover:bg-white/[0.10] hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
            >
              <IconPencil size={26} className="text-white/80" />
              I Have My Own Idea
              <IconChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Quick Start Modal - for main view */}
        <Modal
          isOpen={quickStartModalOpen}
          onClose={() => {
            setQuickStartModalOpen(false);
            setNewSeedInput("");
            setShowSwitchSessions(false);
          }}
          title="Quick Start"
        >
          <div className="space-y-4">
            <p className="text-white/80 text-xl font-light leading-snug">
              Start fresh or continue where you left off.
            </p>

            {/* Option 1: New Session */}
            <div className="space-y-4">
              {/* Label removed as requested */}
              <input
                type="text"
                value={newSeedInput}
                onChange={(e) => setNewSeedInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newSeedInput.trim().length >= 2) {
                    handleCreateNewSession();
                  }
                }}
                placeholder="Enter seed phrase (e.g., video editing)"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-xl placeholder:text-white/30 focus:border-[#2BD899]/50 focus:outline-none focus:ring-2 focus:ring-[#2BD899]/20 transition-all font-medium"
                autoFocus
              />
              <button
                onClick={handleCreateNewSession}
                disabled={newSeedInput.trim().length < 2 || isCreatingSession}
                className="w-full px-6 py-5 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#2BD899] font-bold text-2xl rounded-xl transition-all border-2 border-[#2BD899]/30 shadow-[0_0_15px_rgba(43,216,153,0.15)] hover:shadow-[0_0_25px_rgba(43,216,153,0.25)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <IconTargetArrow size={28} />
                {isCreatingSession ? 'Creating...' : 'Create New Session'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Option 2 & 3: Switch / Manage */}
            <div className="space-y-2">
              <button
                onClick={() => setShowSwitchSessions(!showSwitchSessions)}
                className="w-full px-4 py-3 bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-left text-white/60 hover:text-white/80 text-base transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <IconArrowsExchange size={20} className="text-white/40 group-hover:text-white/60" />
                  <span>Switch Session</span>
                </div>
                <svg
                  className={`w-4 h-4 text-white/40 transition-transform ${showSwitchSessions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Session List - expandable */}
              {showSwitchSessions && (
                <div className="max-h-48 overflow-y-auto space-y-1 pl-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  {sessions.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-3">No sessions yet</p>
                  ) : (
                    sessions.slice(0, 10).map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSwitchToSession(session.id)}
                        className="w-full px-4 py-2.5 bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-[#6B9BD1]/40 rounded-lg text-left text-white/70 hover:text-white text-sm transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{session.name}</span>
                        <IconChevronRight size={14} className="text-white/30" />
                      </button>
                    ))
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setQuickStartModalOpen(false);
                  router.push('/members/sessions');
                }}
                className="w-full px-4 py-3 bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-left text-white/60 hover:text-white/80 text-base transition-all flex items-center gap-3 group"
              >
                <IconSettingsCog size={20} className="text-white/40 group-hover:text-white/60" />
                <span>Manage Sessions</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 mt-8">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
