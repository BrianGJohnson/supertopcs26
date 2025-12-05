"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconRocket, IconUserCheck, IconBrandYoutube, IconTrendingUp, IconLayoutList, IconChartBar } from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { FeatureCard, FeatureCardGrid, FEATURE_CARD_COLORS } from "@/components/ui/FeatureCard";
import { authFetch } from "@/lib/supabase";

/**
 * Step 1: Welcome
 * 
 * Purpose: Set expectations, build excitement, explain why SuperTopics is different.
 * This is the first thing users see after signing up.
 */

export default function OnboardingStep1() {
  const router = useRouter();
  const [displayMode, setDisplayMode] = useState<"essentials" | "full">("essentials");

  const handleContinue = async () => {
    // Save display mode preference
    try {
      await authFetch("/api/onboarding/save", {
        method: "POST",
        body: JSON.stringify({
          step: 1,
          data: {
            display_mode: displayMode,
          },
        }),
      });
    } catch (error) {
      console.error("Error saving display mode:", error);
    }
    router.push("/members/onboarding/step-2");
  };

  return (
    <OnboardingPageLayout
      currentStep={1}
      icon={IconRocket}
      heroLine1="Welcome, Let's Identify Some"
      heroLine2="Super Topics"
      heroDescription="This isn't just another topic tool. Super Topics is your personal system that learns and grows with your channel."
    >
      {/* Feature Cards */}
      <FeatureCardGrid>
        <FeatureCard
          icon={IconUserCheck}
          color={FEATURE_CARD_COLORS.cyan}
          title="Built Around You"
          description="No generic lists. Everything is tailored to your niche and goals."
          highlight="your niche"
        />

        <FeatureCard
          icon={IconBrandYoutube}
          color={FEATURE_CARD_COLORS.red}
          title="Real YouTube Data"
          description="Straight from YouTube — discover topics viewers actually want to watch."
          highlight="actually want to watch"
        />

        <FeatureCard
          icon={IconTrendingUp}
          color={FEATURE_CARD_COLORS.green}
          title="Gets Smarter Over Time"
          description="The more you use it, the better it knows what works for your channel."
          highlight="your channel"
        />
      </FeatureCardGrid>

      {/* Divider */}
      <div className="w-full max-w-xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4" />

      {/* Display Mode Selection */}
      <div className="max-w-xl mx-auto pt-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white/90 mb-2">
            How much detail do you want to see?
          </h3>
          <p className="text-white/50 text-base">
            You can change this anytime in settings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Keep it simple option */}
          <button
            onClick={() => setDisplayMode("essentials")}
            className={`
              flex-1 flex items-start gap-4 p-5 rounded-2xl text-left
              transition-all duration-200
              ${displayMode === "essentials"
                ? "bg-[#2BD899]/15 border-2 border-[#2BD899]/60"
                : "bg-white/[0.04] border-2 border-white/10 hover:border-white/20"
              }
            `}
          >
            <div 
              className={`
                flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                ${displayMode === "essentials" ? "bg-[#2BD899]/20" : "bg-white/10"}
              `}
            >
              <IconLayoutList 
                size={24} 
                className={displayMode === "essentials" ? "text-[#2BD899]" : "text-white/50"} 
              />
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-lg ${displayMode === "essentials" ? "text-white/90" : "text-white/70"}`}>
                Keep it simple
              </div>
              <div className="text-white/50 text-sm leading-snug mt-1">
                Just what I need to make decisions
              </div>
            </div>
            {displayMode === "essentials" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2BD899] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#0B1220]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          {/* Show me everything option */}
          <button
            onClick={() => setDisplayMode("full")}
            className={`
              flex-1 flex items-start gap-4 p-5 rounded-2xl text-left
              transition-all duration-200
              ${displayMode === "full"
                ? "bg-[#7A5CFA]/15 border-2 border-[#7A5CFA]/60"
                : "bg-white/[0.04] border-2 border-white/10 hover:border-white/20"
              }
            `}
          >
            <div 
              className={`
                flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                ${displayMode === "full" ? "bg-[#7A5CFA]/20" : "bg-white/10"}
              `}
            >
              <IconChartBar 
                size={24} 
                className={displayMode === "full" ? "text-[#7A5CFA]" : "text-white/50"} 
              />
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-lg ${displayMode === "full" ? "text-white/90" : "text-white/70"}`}>
                Show me everything
              </div>
              <div className="text-white/50 text-sm leading-snug mt-1">
                All the metrics and details
              </div>
            </div>
            {displayMode === "full" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7A5CFA] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center pt-10 max-w-2xl mx-auto">
        <button
          onClick={handleContinue}
          className="
            inline-flex items-center gap-3 px-8 py-4 rounded-xl
            bg-gradient-to-b from-[#2BD899] to-[#25C78A] 
            text-[#0B1220] font-bold text-lg
            shadow-[0_4px_20px_rgba(43,216,153,0.3)]
            hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]
            hover:from-[#3DE0A6] hover:to-[#2BD899]
            transition-all duration-200
            group
          "
        >
          Let's Get Started
          <svg 
            className="w-5 h-5 transition-transform group-hover:translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </OnboardingPageLayout>
  );
}
