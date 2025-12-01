"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  IconChartBar, 
  IconCash, 
  IconTrendingUp, 
  IconLeaf,
  IconSparkles,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";

/**
 * Step 5: Pillars & Purpose
 * 
 * Purpose: AI-generated strategic pillars based on all previous onboarding data.
 * Shows Monetization, Trending, and Evergreen pillars with seed phrase suggestions.
 */

// Mock data - In production, this would come from API
const MOCK_PILLARS = {
  monetization: {
    label: "YouTube Coaching Offers",
    description: "Videos that promote your courses and coaching directly",
    seeds: ["YouTube Coaching", "Channel Review", "Content Strategy", "Growth Consulting"],
    demandScore: 8,
  },
  trending: {
    label: "YouTube Updates & News",
    description: "Timely content that rides algorithm waves and gets discovered",
    seeds: ["YouTube Updates", "MrBeast Analysis", "Algorithm Changes", "Creator News"],
    demandScore: 9,
  },
  evergreen: {
    label: "YouTube Basics & Foundations",
    description: "Durable content that ranks in search and compounds over time",
    seeds: ["How to Start", "YouTube Basics", "Gear Setup", "Beginner Guide"],
    demandScore: 7,
  },
};

interface Pillar {
  label: string;
  description: string;
  seeds: string[];
  demandScore: number;
}

interface Pillars {
  monetization: Pillar;
  trending: Pillar;
  evergreen: Pillar;
}

const PILLAR_CONFIG = {
  monetization: {
    icon: IconCash,
    color: "#7A5CFA",
    bgColor: "rgba(122, 92, 250, 0.12)",
    title: "💰 Make Money",
    subtitle: "Monetization Pillar",
  },
  trending: {
    icon: IconTrendingUp,
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.12)",
    title: "🚀 Ride Trends",
    subtitle: "Trending Pillar",
  },
  evergreen: {
    icon: IconLeaf,
    color: "#2BD899",
    bgColor: "rgba(43, 216, 153, 0.12)",
    title: "🌲 Build Evergreen Views",
    subtitle: "Evergreen Pillar",
  },
};

export default function OnboardingStep5() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pillars, setPillars] = useState<Pillars | null>(null);

  // Simulate AI generation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPillars(MOCK_PILLARS);
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleRegenerate = () => {
    setIsLoading(true);
    // Simulate regeneration
    setTimeout(() => {
      setPillars(MOCK_PILLARS);
      setIsLoading(false);
    }, 2000);
  };

  const handleContinue = () => {
    // TODO: Save pillars to database
    router.push("/members/onboarding/step-6");
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-4");
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "#2BD899";
    if (score >= 5) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <OnboardingPageLayout
      currentStep={5}
      completedSteps={[1, 2, 3, 4]}
      icon={IconChartBar}
      heroLine1="Your Strategic Content"
      heroLine2="Pillars"
      heroDescription="Based on your goals and niche, here's your personalized content strategy."
    >
      {isLoading ? (
        // Loading State
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            <div className="w-20 h-20 rounded-full bg-[#1A2754] flex items-center justify-center relative">
              <IconSparkles size={40} className="text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-white">Generating Your Pillars...</p>
            <p className="text-white/50">Our AI is analyzing your niche and goals</p>
          </div>
          <IconLoader2 size={32} className="text-primary animate-spin" />
        </div>
      ) : (
        // Pillars Display
        <div className="space-y-6 max-w-4xl mx-auto">
          {pillars && Object.entries(PILLAR_CONFIG).map(([key, config]) => {
            const pillar = pillars[key as keyof Pillars];
            const Icon = config.icon;
            
            return (
              <div
                key={key}
                className="rounded-2xl border border-white/10 overflow-hidden"
                style={{ backgroundColor: config.bgColor }}
              >
                {/* Pillar Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}25` }}
                      >
                        <Icon size={28} style={{ color: config.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{config.title}</h3>
                        <p className="text-white/60 text-sm">{config.subtitle}</p>
                      </div>
                    </div>
                    
                    {/* Demand Score */}
                    <div className="text-right">
                      <p className="text-xs text-white/40 uppercase tracking-wider">Demand</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: getScoreColor(pillar.demandScore) }}
                      >
                        {pillar.demandScore}/10
                      </p>
                    </div>
                  </div>
                  
                  {/* Pillar Label & Description */}
                  <div className="mt-4">
                    <p className="text-lg font-semibold text-white">"{pillar.label}"</p>
                    <p className="text-white/60 mt-1">{pillar.description}</p>
                  </div>
                </div>
                
                {/* Seed Phrases */}
                <div className="p-6">
                  <p className="text-sm text-white/50 mb-3">Suggested seed phrases:</p>
                  <div className="flex flex-wrap gap-2">
                    {pillar.seeds.map((seed, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:scale-105 cursor-pointer"
                        style={{ 
                          backgroundColor: `${config.color}15`,
                          borderColor: `${config.color}30`,
                          color: config.color,
                        }}
                      >
                        {seed}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Regenerate Button */}
          <div className="text-center pt-2">
            <button
              onClick={handleRegenerate}
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/70 text-sm transition-colors"
            >
              <IconRefresh size={16} />
              Regenerate pillars
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!isLoading && (
        <div className="flex flex-col items-center gap-4 pt-8">
          <button
            onClick={handleContinue}
            className="
              inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
              bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] 
              shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]
              transition-all duration-200
            "
          >
            Save Pillars & Continue
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <button
            onClick={handleBack}
            className="text-white/40 hover:text-white/60 text-sm mt-2"
          >
            ← Back
          </button>
        </div>
      )}
    </OnboardingPageLayout>
  );
}
