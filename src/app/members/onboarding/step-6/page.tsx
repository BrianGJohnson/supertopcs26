"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconUsers, IconCheck } from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";

/**
 * Step 6: Audience
 * 
 * Purpose: Define who their ideal viewer is with specificity.
 * This powers Audience Fit scoring throughout the app.
 */

const EXPERTISE_OPTIONS = [
  {
    id: "beginner",
    label: "Beginners",
    description: "Just getting started, need foundational content",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Know the basics, want to level up",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Experienced, looking for edge cases and pro tips",
  },
  {
    id: "mixed",
    label: "Mixed",
    description: "All skill levels watch my content",
  },
];

export default function OnboardingStep6() {
  const router = useRouter();
  const [audienceWho, setAudienceWho] = useState("");
  const [audienceStruggle, setAudienceStruggle] = useState("");
  const [audienceGoal, setAudienceGoal] = useState("");
  const [expertise, setExpertise] = useState("");

  // Generate preview text
  const previewText = audienceWho && audienceStruggle && audienceGoal
    ? `${audienceWho} who are ${audienceStruggle.toLowerCase()}. They want to ${audienceGoal.toLowerCase()}.`
    : "";

  const canContinue = 
    audienceWho.trim().length > 5 && 
    audienceStruggle.trim().length > 5 && 
    audienceGoal.trim().length > 5 && 
    expertise.length > 0;

  const handleComplete = () => {
    // TODO: Save audience data and complete onboarding
    // Redirect to dashboard or builder
    router.push("/members/dashboard");
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-5");
  };

  return (
    <OnboardingPageLayout
      currentStep={6}
      completedSteps={[1, 2, 3, 4, 5]}
      icon={IconUsers}
      heroLine1="Who Is Your"
      heroLine2="Ideal Viewer?"
      heroDescription="The more specific you are, the better we can match topics to YOUR audience."
    >
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Audience Builder Inputs */}
        <div className="space-y-6">
          <p className="text-center text-white/60">
            Complete these sentences to describe your ideal viewer:
          </p>

          {/* Who are they? */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-white">
              My viewers are...
            </label>
            <input
              type="text"
              value={audienceWho}
              onChange={(e) => setAudienceWho(e.target.value)}
              placeholder="e.g., Small YouTubers with under 1,000 subscribers"
              className="
                w-full px-5 py-4 rounded-xl text-lg
                bg-white/[0.06] border-2 border-white/20
                text-white placeholder:text-white/30
                focus:outline-none focus:border-[#4A90D9]/60 focus:ring-2 focus:ring-[#4A90D9]/20
                transition-all
              "
            />
          </div>

          {/* What's their struggle? */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-white">
              ...who are...
            </label>
            <input
              type="text"
              value={audienceStruggle}
              onChange={(e) => setAudienceStruggle(e.target.value)}
              placeholder="e.g., Struggling to get views and grow their channel"
              className="
                w-full px-5 py-4 rounded-xl text-lg
                bg-white/[0.06] border-2 border-white/20
                text-white placeholder:text-white/30
                focus:outline-none focus:border-[#4A90D9]/60 focus:ring-2 focus:ring-[#4A90D9]/20
                transition-all
              "
            />
          </div>

          {/* What do they want? */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-white">
              They want to...
            </label>
            <input
              type="text"
              value={audienceGoal}
              onChange={(e) => setAudienceGoal(e.target.value)}
              placeholder="e.g., Understand how the algorithm works and get discovered"
              className="
                w-full px-5 py-4 rounded-xl text-lg
                bg-white/[0.06] border-2 border-white/20
                text-white placeholder:text-white/30
                focus:outline-none focus:border-[#4A90D9]/60 focus:ring-2 focus:ring-[#4A90D9]/20
                transition-all
              "
            />
          </div>
        </div>

        {/* Preview */}
        {previewText && (
          <div className="p-5 rounded-xl bg-white/[0.04] border border-white/10">
            <p className="text-sm text-white/50 mb-2">Preview of your audience description:</p>
            <p className="text-white leading-relaxed">"{previewText}"</p>
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Expertise Level */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white text-center">
            What's Their Expertise Level?
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {EXPERTISE_OPTIONS.map((option) => {
              const isSelected = expertise === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setExpertise(option.id)}
                  className={`
                    relative flex flex-col items-start p-4 rounded-xl text-left transition-all
                    ${isSelected
                      ? "bg-[#4A90D9]/15 border-2 border-[#4A90D9]/50"
                      : "bg-black/30 border border-white/10 hover:bg-white/[0.04] hover:border-white/20"
                    }
                  `}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#4A90D9] flex items-center justify-center">
                      <IconCheck size={12} className="text-white" stroke={3} />
                    </div>
                  )}

                  <span className={`font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>
                    {option.label}
                  </span>
                  <span className="text-sm text-white/50 mt-1">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-4 pt-10">
        <button
          onClick={handleComplete}
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
          Complete Setup
          <svg 
            className="w-5 h-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        
        {!canContinue && (
          <p className="text-sm text-white/40">
            {!audienceWho.trim() ? "Describe who your viewers are" :
             !audienceStruggle.trim() ? "Describe their main struggle" :
             !audienceGoal.trim() ? "Describe what they want to achieve" :
             "Select an expertise level"}
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
