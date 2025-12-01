"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IconRocket, IconUserCheck, IconBrandYoutube, IconTrendingUp } from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { FeatureCard, FeatureCardGrid, FEATURE_CARD_COLORS } from "@/components/ui/FeatureCard";

/**
 * Step 1: Welcome
 * 
 * Purpose: Set expectations, build excitement, explain why SuperTopics is different.
 * This is the first thing users see after signing up.
 */

export default function OnboardingStep1() {
  const router = useRouter();

  const handleContinue = () => {
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
          title="Personalized, Not Generic"
          description="Most tools give everyone the same numbers, the same recommendations. We tailor everything to your niche, your audience, and your goals."
          highlight="everything"
        />

        <FeatureCard
          icon={IconBrandYoutube}
          color={FEATURE_CARD_COLORS.red}
          title="Data Direct from YouTube"
          description="Our metrics aren't third-party guesses. They come straight from YouTube, enhanced with AI, and scored based on your specific channel context."
          highlight="your specific channel context"
        />

        <FeatureCard
          icon={IconTrendingUp}
          color={FEATURE_CARD_COLORS.green}
          title="A System That Learns"
          description="The more you use Super Topics, the smarter it gets. We learn from your uploads, what's working, and what's not. This isn't static — it grows with your channel."
          highlight="it grows with your channel"
        />
      </FeatureCardGrid>

      {/* Divider */}
      <div className="w-full max-w-2xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-8" />

      {/* CTA Section */}
      <div className="text-center space-y-6 pt-6 max-w-2xl mx-auto">
        <p className="text-white/50 text-lg">
          Spend 2-3 minutes telling us about your channel, and we'll start
          <br />
          delivering <span className="text-white/70">personalized topic recommendations</span> immediately.
        </p>

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
