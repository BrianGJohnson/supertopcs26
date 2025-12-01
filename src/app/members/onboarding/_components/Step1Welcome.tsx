"use client";

import React from "react";
import { 
  IconSparkles, 
  IconChartBar, 
  IconTrendingUp,
  IconRocket
} from "@tabler/icons-react";
import { HeroModule } from "@/components/layout/HeroModule";

interface Step1WelcomeProps {
  onContinue: () => void;
}

export function Step1Welcome({ onContinue }: Step1WelcomeProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section - Using standard HeroModule */}
      <HeroModule
        icon={IconRocket}
        line1="Welcome, Let's Identify Some"
        line2="SuperTopics"
        description="This isn't just another topic tool. SuperTopics is your personal system that learns and grows with your channel."
      />

      {/* Feature Cards */}
      <div className="space-y-4">
        {/* Card 1: Personalized */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-6 transition-all hover:border-white/10">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#7A5CFA]/15 flex items-center justify-center">
              <IconSparkles size={24} className="text-[#7A5CFA]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Personalized, Not Generic
              </h3>
              <p className="text-white/50 leading-relaxed">
                Most tools give everyone the same numbers, the same recommendations. 
                We tailor <span className="text-white/70">everything</span> to your niche, your audience, and your goals.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Data from YouTube */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-6 transition-all hover:border-white/10">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#4A90D9]/15 flex items-center justify-center">
              <IconChartBar size={24} className="text-[#4A90D9]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Data Direct from YouTube
              </h3>
              <p className="text-white/50 leading-relaxed">
                Our metrics aren't third-party guesses. They come straight from YouTube, 
                enhanced with AI, and scored based on <span className="text-white/70">your specific channel context</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Learning System */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-6 transition-all hover:border-white/10">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#2BD899]/15 flex items-center justify-center">
              <IconTrendingUp size={24} className="text-[#2BD899]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                A System That Learns
              </h3>
              <p className="text-white/50 leading-relaxed">
                The more you use SuperTopics, the smarter it gets. We learn from your uploads, 
                what's working, and what's not. This isn't static — <span className="text-white/70">it grows with your channel</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* CTA Section */}
      <div className="text-center space-y-6 pt-2">
        <p className="text-white/50 text-lg">
          Spend 2-3 minutes telling us about your channel, and we'll start
          <br />
          delivering <span className="text-white/70">personalized topic recommendations</span> immediately.
        </p>

        <button
          onClick={onContinue}
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
    </div>
  );
}
