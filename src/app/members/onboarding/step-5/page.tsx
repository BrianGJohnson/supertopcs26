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
  IconFlame,
  IconConfetti,
  IconRocket,
  IconSparkles,
} from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { authFetch } from "@/lib/supabase";

/**
 * Step 5: Pillars & Purpose
 * 
 * OPTION B Implementation:
 * - No numeric demand bars (removed for clarity)
 * - Selectable cards with "Proven Demand" badges (demand >= 7)
 * - Large, readable text throughout (text-xl minimum for content)
 * - GPT incorporates user's topic ideas from Step 4
 * 
 * Progressive reveal:
 * 1. Niche Validation (first view)
 * 2. Strategy Introduction
 * 3. Evergreen Pillar with selectable sub-niches
 * 4. Trending Pillar (view only)
 * 5. Monetization Pillar with selectable sub-niches
 */

interface NicheValidation {
  nicheName: string;
  demandScore: number;
  demandLabel: string;
  summary: string;
  topChannels: string[];
}

interface SubNiche {
  name: string;
  demand: number;
}

interface Pillar {
  label: string;
  teachingMoment: string;
  subNiches: SubNiche[];
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

  const toggleEvergreenSeed = (subNiche: SubNiche) => {
    setSelectedEvergreen(prev => 
      prev.includes(subNiche.name) 
        ? prev.filter(s => s !== subNiche.name)
        : [...prev, subNiche.name]
    );
  };

  const toggleMonetizationSeed = (subNiche: SubNiche) => {
    setSelectedMonetization(prev => 
      prev.includes(subNiche.name) 
        ? prev.filter(s => s !== subNiche.name)
        : [...prev, subNiche.name]
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

      // Show celebration screen for 5 seconds before redirecting
      setCurrentSection("complete");
      setTimeout(() => {
        router.push("/members/onboarding/step-6");
      }, 5000);
    } catch (error) {
      console.error("Error saving pillars:", error);
      // Still show celebration even on error, as we want to continue
      setCurrentSection("complete");
      setTimeout(() => {
        router.push("/members/onboarding/step-6");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-4");
  };

  // Utility to get demand color based on score (still used for niche validation display)
  const getDemandColor = (score: number) => {
    if (score >= 7) return "#2BD899"; // Green - high demand
    if (score >= 5) return "#F59E0B"; // Orange - medium demand
    return "#EF4444"; // Red - low demand
  };

  // Simple demand display for niche validation section (non-interactive)
  const NicheDemandDisplay = ({ score }: { score: number }) => {
    return (
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: i < score ? 1 : 0.2, 
              scale: 1,
              backgroundColor: i < score ? getDemandColor(score) : "#374151"
            }}
            transition={{ 
              duration: 0.3, 
              delay: i * 0.1,
              ease: "easeOut"
            }}
            className="h-4 w-8 rounded"
          />
        ))}
      </div>
    );
  };

  // Sub-niche card component with clear checkbox affordance and "Proven Demand" badge
  // Option B: No numeric bars - just visual "Proven Demand" badge for high demand topics
  interface SubNicheCardProps {
    subNiche: { name: string; demand: number };
    isSelected: boolean;
    onToggle: () => void;
    color: string;
  }
  
  const SubNicheCard = ({ subNiche, isSelected, onToggle, color }: SubNicheCardProps) => {
    const highDemand = subNiche.demand >= 7;
    
    return (
      <button
        onClick={onToggle}
        className={`
          w-full p-5 rounded-2xl text-left transition-all duration-200
          ${isSelected 
            ? `bg-[${color}]/20 border-2 shadow-lg` 
            : "bg-white/[0.04] border-2 border-white/10 hover:border-white/30 hover:bg-white/[0.06]"
          }
        `}
        style={{
          borderColor: isSelected ? color : undefined,
          boxShadow: isSelected ? `0 0 20px ${color}30` : undefined,
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left side: Checkbox + Name */}
          <div className="flex items-center gap-4">
            {/* Checkbox circle */}
            <div 
              className={`
                w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all
                ${isSelected 
                  ? "border-transparent" 
                  : "border-white/30"
                }
              `}
              style={{
                backgroundColor: isSelected ? color : "transparent",
              }}
            >
              {isSelected && <IconCheck size={16} className="text-[#0B1220]" />}
            </div>
            
            {/* Name - LARGE TEXT per brand guidelines (minimum text-xl) */}
            <span 
              className={`text-xl font-semibold transition-colors ${isSelected ? "" : "text-white"}`}
              style={{ color: isSelected ? color : undefined }}
            >
              {subNiche.name}
            </span>
          </div>
          
          {/* Right side: Proven Demand badge (only for demand >= 7) */}
          {highDemand && (
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: `${color}20` }}
            >
              <IconFlame size={18} style={{ color }} />
              <span 
                className="text-base font-medium"
                style={{ color }}
              >
                Proven Demand
              </span>
            </div>
          )}
        </div>
      </button>
    );
  };

  // View-only sub-niche card (for Trending section which is not selectable)
  interface ViewOnlyCardProps {
    subNiche: { name: string; demand: number };
    color: string;
  }
  
  const ViewOnlyCard = ({ subNiche, color }: ViewOnlyCardProps) => {
    const highDemand = subNiche.demand >= 7;
    
    return (
      <div
        className="w-full p-5 rounded-2xl bg-white/[0.04] border-2"
        style={{ borderColor: `${color}40` }}
      >
        <div className="flex items-center justify-between">
          {/* Name - LARGE TEXT */}
          <span 
            className="text-xl font-semibold"
            style={{ color }}
          >
            {subNiche.name}
          </span>
          
          {/* Proven Demand badge */}
          {highDemand && (
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: `${color}20` }}
            >
              <IconFlame size={18} style={{ color }} />
              <span 
                className="text-base font-medium"
                style={{ color }}
              >
                Proven Demand
              </span>
            </div>
          )}
        </div>
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
              <NicheDemandDisplay score={nicheValidation.demandScore} />
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
          {/* Instruction - large text per brand guidelines */}
          <div className="text-center space-y-3">
            <p className="text-2xl font-medium text-white/80">
              Choose 3-5 sub-niches to focus on
            </p>
            <p className="text-lg text-white/50">
              Topics with 🔥 <span className="text-[#2BD899]">Proven Demand</span> tend to get more views
            </p>
          </div>

          {/* Pillar Card */}
          <div className="p-8 rounded-2xl bg-[#2BD899]/10 border-2 border-[#2BD899]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2BD899]/20 flex items-center justify-center">
                <IconLeaf size={28} className="text-[#2BD899]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{evergreen.label}</h3>
              </div>
            </div>
            
            <p className="text-xl text-white/70 leading-relaxed mb-6">
              {evergreen.teachingMoment}
            </p>

            {/* Selectable Sub-Niches with SubNicheCard */}
            <div className="space-y-4">
              {evergreen.subNiches.map((subNiche, i) => (
                <SubNicheCard
                  key={i}
                  subNiche={subNiche}
                  isSelected={selectedEvergreen.includes(subNiche.name)}
                  onToggle={() => toggleEvergreenSeed(subNiche)}
                  color="#2BD899"
                />
              ))}
            </div>
          </div>

          {/* Selected Count - larger text */}
          <p className="text-center text-lg text-white/50">
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
              className="text-white/50 hover:text-white/70 text-base"
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
          {/* Instruction - large text per brand guidelines */}
          <div className="text-center space-y-3">
            <p className="text-2xl font-medium text-white/80">
              Trending themes to watch in your space
            </p>
            <p className="text-lg text-white/50">
              Topics with 🔥 <span className="text-[#F59E0B]">Proven Demand</span> are hot right now
            </p>
          </div>

          {/* Pillar Card */}
          <div className="p-8 rounded-2xl bg-[#F59E0B]/10 border-2 border-[#F59E0B]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center">
                <IconTrendingUp size={28} className="text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{trending.label}</h3>
              </div>
            </div>
            
            <p className="text-xl text-white/70 leading-relaxed mb-6">
              {trending.teachingMoment}
            </p>

            {/* Trending Themes with ViewOnlyCard (view only) */}
            <div className="space-y-4">
              {trending.subNiches.map((theme, i) => (
                <ViewOnlyCard
                  key={i}
                  subNiche={theme}
                  color="#F59E0B"
                />
              ))}
            </div>
          </div>

          {/* Info Note - larger text */}
          <div className="p-5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
            <p className="text-white/60 text-lg">
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
              className="text-white/50 hover:text-white/70 text-base"
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
          {/* Instruction - large text per brand guidelines */}
          <div className="text-center space-y-3">
            <p className="text-2xl font-medium text-white/80">
              Choose 3-5 content themes to focus on
            </p>
            <p className="text-lg text-white/50">
              Topics with 🔥 <span className="text-[#9B7DFF]">Proven Demand</span> tend to get more views
            </p>
          </div>

          {/* Pillar Card */}
          <div className="p-8 rounded-2xl bg-[#9B7DFF]/10 border-2 border-[#9B7DFF]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#9B7DFF]/20 flex items-center justify-center">
                <IconCash size={28} className="text-[#9B7DFF]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{monetization.label}</h3>
              </div>
            </div>
            
            <p className="text-xl text-white/70 leading-relaxed mb-6">
              {monetization.teachingMoment}
            </p>

            {/* Selectable Sub-Niches with SubNicheCard */}
            <div className="space-y-4">
              {monetization.subNiches.map((subNiche, i) => (
                <SubNicheCard
                  key={i}
                  subNiche={subNiche}
                  isSelected={selectedMonetization.includes(subNiche.name)}
                  onToggle={() => toggleMonetizationSeed(subNiche)}
                  color="#9B7DFF"
                />
              ))}
            </div>
          </div>

          {/* Selected Count - larger text */}
          <p className="text-center text-lg text-white/50">
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
              className="text-white/50 hover:text-white/70 text-base"
            >
              ← Back
            </button>
          </div>
        </div>
      </OnboardingPageLayout>
    );
  }

  // Section 6: Celebration / Completion
  if (currentSection === "complete") {
    return (
      <OnboardingPageLayout
        currentStep={5}
        completedSteps={[1, 2, 3, 4, 5]}
        icon={IconSparkles}
        heroLine1="You're"
        heroLine2="All Set!"
        heroDescription=""
      >
        <div className="max-w-2xl mx-auto text-center space-y-10">
          {/* Animated Confetti Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2 
            }}
            className="flex justify-center"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2BD899] via-[#7A5CFA] to-[#F59E0B] flex items-center justify-center shadow-[0_0_60px_rgba(43,216,153,0.4)]">
              <IconConfetti size={56} className="text-white" />
            </div>
          </motion.div>

          {/* Main Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Fantastic Work! 🎉
            </h2>
            <p className="text-2xl text-[#2BD899] font-medium">
              Let&apos;s find you some SuperTopics.
            </p>
          </motion.div>

          {/* Redirect Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-3 text-white/50">
              <IconRocket size={24} className="text-[#2BD899] animate-bounce" />
              <span className="text-lg">Taking you to your dashboard...</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full bg-gradient-to-r from-[#2BD899] to-[#7A5CFA] rounded-full"
              />
            </div>
          </motion.div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={() => router.push("/members/onboarding/step-6")}
            className="text-white/40 hover:text-white/60 text-base transition-colors"
          >
            Skip to dashboard →
          </motion.button>
        </div>
      </OnboardingPageLayout>
    );
  }

  return null;
}
