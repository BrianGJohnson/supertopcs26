"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBulb } from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";

/**
 * Step 4: Niche & Topics
 * 
 * Purpose: Capture their niche description and 3 example topic ideas.
 * These feed into the AI-generated pillars in Step 5.
 */

export default function OnboardingStep4() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [topics, setTopics] = useState(["", "", ""]);

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  // Need niche and at least 1 topic
  const filledTopics = topics.filter(t => t.trim().length > 0);
  const canContinue = niche.trim().length >= 2 && filledTopics.length >= 1;

  const handleContinue = () => {
    // TODO: Save niche and topics to state/database
    router.push("/members/onboarding/step-5");
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-3");
  };

  return (
    <OnboardingPageLayout
      currentStep={4}
      completedSteps={[1, 2, 3]}
      icon={IconBulb}
      heroLine1="What's Your Channel"
      heroLine2="All About?"
      heroDescription="Help us understand your niche so we can find the very best SuperTopics for you."
    >
      <div className="space-y-10 max-w-2xl mx-auto">
        {/* Niche Input */}
        <div className="space-y-4 text-center">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Describe Your Niche
            </h3>
            <p className="text-white/50">
              What's the main theme of your channel? (2-5 words)
            </p>
          </div>

          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g., YouTube Education, Vibe Coding, Budget Travel"
            className="
              w-full px-6 py-5 rounded-xl text-xl text-center
              bg-white/[0.06] border-2 border-white/20
              text-white placeholder:text-white/30
              focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-2 focus:ring-[#7A5CFA]/20
              transition-all
            "
          />
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Topics Section */}
        <div className="space-y-5 text-center">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              List 3 Topics You'd Like To Cover
            </h3>
            <p className="text-white/50">
              These help us understand your content angles
            </p>
          </div>

          {/* Topic Input Fields */}
          <div className="flex flex-col gap-4">
            {topics.map((topic, index) => (
              <div key={index} className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-medium">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  placeholder={
                    index === 0 ? "e.g., Algorithm tips and growth strategies" :
                    index === 1 ? "e.g., AI tools for content creators" :
                    "e.g., YouTube Shorts strategy"
                  }
                  className="
                    w-full pl-12 pr-5 py-4 rounded-xl text-lg
                    bg-white/[0.06] border-2 border-white/20
                    text-white placeholder:text-white/30
                    focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-2 focus:ring-[#7A5CFA]/20
                    transition-all
                  "
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-4 pt-10">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`
            inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
            transition-all duration-200
            ${canContinue
              ? "bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]"
              : "bg-white/10 text-white/40 cursor-not-allowed"
            }
          `}
        >
          Continue
          <svg 
            className="w-5 h-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        
        {!canContinue && (
          <p className="text-sm text-white/40">
            {niche.trim().length < 2 
              ? "Enter your niche to continue" 
              : "Add at least one topic to continue"
            }
          </p>
        )}

        <button
          onClick={handleBack}
          className="text-white/40 hover:text-white/60 text-sm mt-2"
        >
          ← Back
        </button>
      </div>
    </OnboardingPageLayout>
  );
}
