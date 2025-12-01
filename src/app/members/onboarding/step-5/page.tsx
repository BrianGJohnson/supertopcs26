"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  IconChartBar, 
  IconLeaf,
  IconTrendingUp,
  IconCash,
  IconLoader2,
  IconCheck,
  IconChevronRight,
  IconTargetArrow,
} from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { authFetch } from "@/lib/supabase";

/**
 * Step 5: Pillars & Purpose
 * 
 * Progressive reveal:
 * 1. Niche Validation (first view)
 * 2. Strategy Introduction
 * 3. Evergreen Pillar with selectable seeds
 * 4. Trending Pillar (view only)
 * 5. Monetization Pillar with selectable seeds
 */

interface NicheValidation {
  nicheName: string;
  demandScore: number;
  demandLabel: string;
  summary: string;
  topChannels: string[];
}

interface Pillar {
  label: string;
  teachingMoment: string;
  subNiches: string[];
}

interface PillarsData {
  nicheValidation: NicheValidation;
  pillars: {
    evergreen: Pillar;
    trending: Pillar;
    monetization: Pillar;
  };
}

type RevealSection = "loading" | "niche" | "strategy" | "evergreen" | "trending" | "monetization" | "complete";

export default function OnboardingStep5() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<RevealSection>("loading");
  const [pillarsData, setPillarsData] = useState<PillarsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Selected seeds for each pillar (user clicks to add to basket)
  const [selectedEvergreen, setSelectedEvergreen] = useState<string[]>([]);
  const [selectedMonetization, setSelectedMonetization] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch pillars from API on mount
  useEffect(() => {
    async function fetchPillars() {
      try {
        const response = await authFetch("/api/onboarding/generate-pillars", {
          method: "POST",
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate pillars");
        }
        
        const data = await response.json();
        setPillarsData(data);
        setCurrentSection("niche");
      } catch (err) {
        console.error("Error fetching pillars:", err);
        setError(err instanceof Error ? err.message : "Failed to load pillars");
      }
    }
    
    fetchPillars();
  }, []);

  const toggleEvergreenSeed = (seed: string) => {
    setSelectedEvergreen(prev => 
      prev.includes(seed) 
        ? prev.filter(s => s !== seed)
        : [...prev, seed]
    );
  };

  const toggleMonetizationSeed = (seed: string) => {
    setSelectedMonetization(prev => 
      prev.includes(seed) 
        ? prev.filter(s => s !== seed)
        : [...prev, seed]
    );
  };

  const handleSaveAndContinue = async () => {
    if (isSaving || !pillarsData) return;
    setIsSaving(true);

    try {
      // Build the pillar strategy to save
      // This structure will be used by the Builder module later
      const pillarStrategy = {
        nicheValidation: pillarsData.nicheValidation,
        pillars: {
          evergreen: {
            ...pillarsData.pillars.evergreen,
            selectedSubNiches: selectedEvergreen, // User's chosen sub-niches
          },
          trending: {
            ...pillarsData.pillars.trending,
            // Trending sub-niches are view-only, not selected
          },
          monetization: {
            ...pillarsData.pillars.monetization,
            selectedSubNiches: selectedMonetization, // User's chosen sub-niches
          },
        },
        createdAt: new Date().toISOString(),
      };

      const response = await authFetch("/api/onboarding/save", {
        method: "POST",
        body: JSON.stringify({
          step: 5,
          data: {
            pillar_strategy: pillarStrategy,
            niche_demand_score: pillarsData.nicheValidation.demandScore,
            niche_validated: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      router.push("/members/onboarding/step-6");
    } catch (error) {
      console.error("Error saving pillars:", error);
      router.push("/members/onboarding/step-6");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-4");
  };

  const getDemandColor = (score: number) => {
    if (score >= 7) return "#2BD899";
    if (score >= 5) return "#F59E0B";
    return "#EF4444";
  };

  // Animated progress bar component
  const AnimatedProgressBar = ({ score }: { score: number }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    
    useEffect(() => {
      // Animate from 0 to score over 1.5 seconds
      const duration = 1500;
      const steps = 60;
      const increment = score / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(timer);
        } else {
          setAnimatedScore(current);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }, [score]);

    const filled = Math.round(animatedScore);
    
    return (
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: i < filled ? 1 : 0.2, 
              scale: 1,
              backgroundColor: i < filled ? getDemandColor(score) : "#374151"
            }}
            transition={{ 
              duration: 0.3, 
              delay: i * 0.1,
              ease: "easeOut"
            }}
            className="h-3.5 w-7 rounded-sm"
          />
        ))}
      </div>
    );
  };

  // Loading state
  if (currentSection === "loading") {
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4]}
        icon={IconChartBar}
        heroLine1="Building Your"
        heroLine2="Strategy"
        heroDescription="Analyzing your niche and goals..."
      >
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-[#1A2754] flex items-center justify-center relative">
              <IconTargetArrow size={40} className="text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-white">Evaluating Your Niche...</p>
            <p className="text-white/50">This takes about 5-10 seconds</p>
          </div>
          <IconLoader2 size={32} className="text-primary animate-spin" />
        </div>
      </OnboardingPageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4]}
        icon={IconChartBar}
        heroLine1="Something Went"
        heroLine2="Wrong"
        heroDescription={error}
      >
        <div className="flex flex-col items-center gap-4 pt-10">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-xl bg-primary text-white font-semibold"
          >
            Try Again
          </button>
          <button
            onClick={handleBack}
            className="text-white/40 hover:text-white/60 text-sm"
          >
            ← Back to Niche
          </button>
        </div>
      </OnboardingPageLayout>
    );
  }

  if (!pillarsData) return null;

  // Section 1: Niche Validation
  if (currentSection === "niche") {
    const { nicheValidation } = pillarsData;
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4]}
        icon={IconChartBar}
        heroLine1="Your Channel"
        heroLine2="Direction"
        heroDescription=""
      >
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Niche Name */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <p className="text-white/50 text-lg">Your Niche</p>
            <h2 className="text-5xl font-bold text-white">
              {nicheValidation.nicheName}
            </h2>
          </motion.div>

          {/* Demand Score - Animated */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-4">
              <span className="text-white/60 text-lg">Demand:</span>
              <motion.span 
                className="text-3xl font-bold"
                style={{ color: getDemandColor(nicheValidation.demandScore) }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                {nicheValidation.demandScore}/10
              </motion.span>
              <motion.span 
                className="px-4 py-1.5 rounded-full text-sm font-bold"
                style={{ 
                  backgroundColor: `${getDemandColor(nicheValidation.demandScore)}20`,
                  color: getDemandColor(nicheValidation.demandScore),
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.6 }}
              >
                {nicheValidation.demandLabel}
              </motion.span>
            </div>
            <div className="flex justify-center">
              <AnimatedProgressBar score={nicheValidation.demandScore} />
            </div>
          </motion.div>

          {/* Summary - Larger text */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.8 }}
            className="p-6 rounded-2xl bg-white/[0.04] border border-white/10"
          >
            <p className="text-xl text-white/60 leading-relaxed">
              {nicheValidation.summary}
            </p>
          </motion.div>

          {/* Top Channels */}
          {nicheValidation.topChannels.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 2 }}
              className="space-y-3"
            >
              <p className="text-white/40 text-sm">Successful channels in this niche:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {nicheValidation.topChannels.map((channel, i) => (
                  <span 
                    key={i}
                    className="px-4 py-2 rounded-full bg-white/[0.06] text-white/70 text-sm"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Buttons - Back under main button */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="flex flex-col items-center gap-3 pt-4"
          >
            <button
              onClick={() => setCurrentSection("strategy")}
              className="
                inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
                bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] 
                shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]
                transition-all duration-200
              "
            >
              Find Your SuperTopics
              <IconChevronRight size={20} />
            </button>

            <button
              onClick={handleBack}
              className="text-white/40 hover:text-white/60 text-sm mt-1"
            >
              ← Back
            </button>
          </motion.div>
        </div>
      </OnboardingPageLayout>
    );
  }

  // Section 2: Strategy Introduction
  if (currentSection === "strategy") {
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4]}
        icon={IconChartBar}
        heroLine1="Your Personalized"
        heroLine2="Content Strategy"
        heroDescription=""
      >
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
            The most successful YouTubers don&apos;t make random videos.<br />
            They balance <span className="text-white font-semibold">three types of content</span>:
          </p>

          {/* Three Pillars Overview - Horizontal Tall Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Evergreen Card */}
            <div className="flex flex-col items-center p-8 rounded-2xl bg-[#2BD899]/10 border-2 border-[#2BD899]/60 hover:border-[#2BD899] transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-[#2BD899]/20 flex items-center justify-center mb-5">
                <IconLeaf size={36} className="text-[#2BD899]" />
              </div>
              <p className="font-bold text-3xl text-white/80 mb-4">Evergreen</p>
              <p className="text-white/50 text-center text-xl leading-relaxed">
                Videos that get views for months or years
              </p>
            </div>
            
            {/* Trending Card */}
            <div className="flex flex-col items-center p-8 rounded-2xl bg-[#F59E0B]/10 border-2 border-[#F59E0B]/60 hover:border-[#F59E0B] transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/20 flex items-center justify-center mb-5">
                <IconTrendingUp size={36} className="text-[#F59E0B]" />
              </div>
              <p className="font-bold text-3xl text-white/80 mb-4">Trending</p>
              <p className="text-white/50 text-center text-xl leading-relaxed">
                Videos that spike when news breaks
              </p>
            </div>
            
            {/* Monetization Card */}
            <div className="flex flex-col items-center p-8 rounded-2xl bg-[#7A5CFA]/10 border-2 border-[#7A5CFA]/60 hover:border-[#7A5CFA] transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-[#7A5CFA]/20 flex items-center justify-center mb-5">
                <IconCash size={36} className="text-[#7A5CFA]" />
              </div>
              <p className="font-bold text-3xl text-white/80 mb-4">Monetization</p>
              <p className="text-white/50 text-center text-xl leading-relaxed">
                Educational content related to your product or service
              </p>
            </div>
          </div>

          <p className="text-white/70 text-xl leading-relaxed">
            We&apos;ve built your personalized pillars based on your goals.<br />
            Click the seed phrases you want to save to your account.
          </p>

          {/* Continue Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setCurrentSection("evergreen")}
              className="
                inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
                bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] 
                shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]
                transition-all duration-200
              "
            >
              Show My Pillars
              <IconChevronRight size={20} />
            </button>

            <button
              onClick={() => setCurrentSection("niche")}
              className="text-white/50 hover:text-white/70 text-base mt-2"
            >
              ← Back
            </button>
          </div>
        </div>
      </OnboardingPageLayout>
    );
  }

  // Section 3: Evergreen Pillar
  if (currentSection === "evergreen") {
    const { evergreen } = pillarsData.pillars;
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4]}
        icon={IconLeaf}
        heroLine1="Evergreen"
        heroLine2="Content"
        heroDescription=""
      >
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Instruction - prominent above card */}
          <p className="text-xl text-white/70 text-center">
            Choose 3-5 sub-niches to focus on:
          </p>

          {/* Pillar Card */}
          <div className="p-8 rounded-2xl bg-[#2BD899]/10 border-2 border-[#2BD899]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2BD899]/20 flex items-center justify-center">
                <IconLeaf size={28} className="text-[#2BD899]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{evergreen.label}</h3>
              </div>
            </div>
            
            <p className="text-lg text-white/70 leading-relaxed mb-6">
              {evergreen.teachingMoment}
            </p>

            {/* Selectable Sub-Niches */}
            <div className="flex flex-wrap gap-2">
              {evergreen.subNiches.map((subNiche, i) => {
                const isSelected = selectedEvergreen.includes(subNiche);
                return (
                  <button
                    key={i}
                    onClick={() => toggleEvergreenSeed(subNiche)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${isSelected 
                        ? "bg-[#2BD899] text-[#0B1220] shadow-lg" 
                        : "bg-[#2BD899]/15 border border-[#2BD899]/30 text-[#2BD899] hover:bg-[#2BD899]/25"
                      }
                    `}
                  >
                    {isSelected && <IconCheck size={14} className="inline mr-1" />}
                    {subNiche}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Count */}
          <p className="text-center text-white/50">
            {selectedEvergreen.length} sub-niche{selectedEvergreen.length !== 1 ? "s" : ""} selected
          </p>

          {/* Continue Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setCurrentSection("trending")}
              className="
                inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
                bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] 
                shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]
                transition-all duration-200
              "
            >
              Continue to Trending
              <IconChevronRight size={20} />
            </button>

            <button
              onClick={() => setCurrentSection("strategy")}
              className="text-white/40 hover:text-white/60 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </OnboardingPageLayout>
    );
  }

  // Section 4: Trending Pillar
  if (currentSection === "trending") {
    const { trending } = pillarsData.pillars;
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4]}
        icon={IconTrendingUp}
        heroLine1="Trending"
        heroLine2="Content"
        heroDescription=""
      >
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Instruction - prominent above card */}
          <p className="text-xl text-white/70 text-center">
            Trending themes to watch in your space:
          </p>

          {/* Pillar Card */}
          <div className="p-8 rounded-2xl bg-[#F59E0B]/10 border-2 border-[#F59E0B]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center">
                <IconTrendingUp size={28} className="text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{trending.label}</h3>
              </div>
            </div>
            
            <p className="text-lg text-white/70 leading-relaxed mb-6">
              {trending.teachingMoment}
            </p>

            {/* Trending Themes (not selectable) */}
            <div className="flex flex-wrap gap-2">
              {trending.subNiches.map((theme, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center">
            <p className="text-white/60 text-sm">
              💡 <span className="text-[#F59E0B]">Niche Pulse</span> and <span className="text-[#F59E0B]">Just Born Topics</span> are coming soon—<br />
              modules designed to surface real-time trending data in your space.
            </p>
          </div>

          {/* Continue Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setCurrentSection("monetization")}
              className="
                inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
                bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] 
                shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]
                transition-all duration-200
              "
            >
              Continue to Monetization
              <IconChevronRight size={20} />
            </button>

            <button
              onClick={() => setCurrentSection("evergreen")}
              className="text-white/40 hover:text-white/60 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </OnboardingPageLayout>
    );
  }

  // Section 5: Monetization Pillar
  if (currentSection === "monetization") {
    const { monetization } = pillarsData.pillars;
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4]}
        icon={IconCash}
        heroLine1="Monetization"
        heroLine2="Content"
        heroDescription=""
      >
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Instruction - prominent above card (consistent with Evergreen) */}
          <p className="text-xl text-white/70 text-center">
            Choose 3-5 content themes to focus on:
          </p>

          {/* Pillar Card */}
          <div className="p-8 rounded-2xl bg-[#9B7DFF]/10 border-2 border-[#9B7DFF]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#9B7DFF]/20 flex items-center justify-center">
                <IconCash size={28} className="text-[#9B7DFF]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{monetization.label}</h3>
              </div>
            </div>
            
            <p className="text-lg text-white/60 leading-relaxed mb-6">
              {monetization.teachingMoment}
            </p>

            {/* Selectable Sub-Niches */}
            <div className="flex flex-wrap gap-2">
              {monetization.subNiches.map((subNiche, i) => {
                const isSelected = selectedMonetization.includes(subNiche);
                return (
                  <button
                    key={i}
                    onClick={() => toggleMonetizationSeed(subNiche)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${isSelected 
                        ? "bg-[#A78BFA] text-[#0B1220] shadow-lg" 
                        : "bg-[#A78BFA]/20 border border-[#A78BFA]/50 text-[#C4B5FD] hover:bg-[#A78BFA]/30"
                      }
                    `}
                  >
                    {isSelected && <IconCheck size={14} className="inline mr-1" />}
                    {subNiche}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Count */}
          <p className="text-center text-white/50">
            {selectedMonetization.length} sub-niche{selectedMonetization.length !== 1 ? "s" : ""} selected
          </p>

          {/* Save & Continue Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSaveAndContinue}
              disabled={isSaving}
              className={`
                inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
                transition-all duration-200
                ${isSaving 
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]"
                }
              `}
            >
              {isSaving ? (
                <>
                  <IconLoader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Pillars & Continue
                  <IconChevronRight size={20} />
                </>
              )}
            </button>

            <button
              onClick={() => setCurrentSection("trending")}
              className="text-white/40 hover:text-white/60 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </OnboardingPageLayout>
    );
  }

  return null;
}
