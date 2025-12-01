"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  IconTarget,
  IconCash,
  IconBuildingStore,
  IconUsers,
  IconPalette,
} from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";

/**
 * Step 2: Goals (Pick Your Top Two Goals)
 * 
 * Purpose: Understand their PRIMARY motivation to shape recommendations.
 * Limited to 2 choices to force real prioritization.
 * First selection = primary focus.
 */

const GOAL_OPTIONS = [
  {
    id: "money",
    label: "To Make Money",
    description: "YouTube is part of my income plan",
    icon: IconCash,
    color: "#2BD899",
    bgColor: "rgba(43, 216, 153, 0.12)",
    hoverBg: "rgba(43, 216, 153, 0.20)",
  },
  {
    id: "brand",
    label: "To Build a Brand",
    description: "Establish authority in my field",
    icon: IconBuildingStore,
    color: "#7A5CFA",
    bgColor: "rgba(122, 92, 250, 0.12)",
    hoverBg: "rgba(122, 92, 250, 0.20)",
  },
  {
    id: "community",
    label: "To Build Community",
    description: "Connect with like-minded people",
    icon: IconUsers,
    color: "#4A90D9",
    bgColor: "rgba(74, 144, 217, 0.12)",
    hoverBg: "rgba(74, 144, 217, 0.20)",
  },
  {
    id: "freedom",
    label: "To Have Creative Freedom",
    description: "Make content on my own terms",
    icon: IconPalette,
    color: "#FFB020",
    bgColor: "rgba(255, 176, 32, 0.12)",
    hoverBg: "rgba(255, 176, 32, 0.20)",
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const MAX_SELECTIONS = 2;

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      }
      // Limit to max selections
      if (prev.length >= MAX_SELECTIONS) {
        return prev;
      }
      return [...prev, goalId];
    });
  };

  const getPriority = (goalId: string) => {
    const index = selectedGoals.indexOf(goalId);
    return index >= 0 ? index + 1 : null;
  };

  const canContinue = selectedGoals.length > 0;

  const handleContinue = () => {
    // TODO: Save selectedGoals to state/database
    // First selection = primary motivation
    router.push("/members/onboarding/step-3");
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-1");
  };

  return (
    <OnboardingPageLayout
      currentStep={2}
      completedSteps={[1]}
      icon={IconTarget}
      heroLine1="Important! Pick Your"
      heroLine2="Two Goals"
      heroDescription="This shapes your recommendations. First choice = primary focus."
    >
      {/* Goal Selection */}
      <div className="space-y-6 text-center max-w-xl mx-auto">
        {/* Goal Cards - Vertical Stack */}
        <div className="flex flex-col gap-5">
          {GOAL_OPTIONS.map((option) => {
            const isSelected = selectedGoals.includes(option.id);
            const priority = getPriority(option.id);
            const Icon = option.icon;
            
            return (
              <button
                key={option.id}
                onClick={() => toggleGoal(option.id)}
                className={`
                  group relative flex items-center gap-5 p-5 rounded-2xl text-left
                  transition-all duration-300 ease-out
                  ${isSelected
                    ? "border-2 scale-[1.01]"
                    : "border hover:scale-[1.01]"
                  }
                `}
                style={{
                  backgroundColor: isSelected ? option.hoverBg : option.bgColor,
                  borderColor: isSelected ? option.color : `${option.color}70`,
                  boxShadow: isSelected ? `0 4px 24px ${option.color}25` : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = option.hoverBg;
                    e.currentTarget.style.borderColor = `${option.color}99`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = option.bgColor;
                    e.currentTarget.style.borderColor = `${option.color}70`;
                  }
                }}
              >
                {/* Icon */}
                <div 
                  className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${option.color}30` }}
                >
                  <Icon size={28} style={{ color: option.color }} />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className={`text-lg font-bold ${isSelected ? "text-white" : "text-white/90"}`}>
                    {option.label}
                  </div>
                  <div className="text-base text-white/60 leading-snug">
                    {option.description}
                  </div>
                </div>

                {/* Priority badge */}
                {isSelected && (
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold animate-[badgePop_0.3s_ease-out]"
                    style={{ backgroundColor: option.color, color: '#0B1220' }}
                  >
                    {priority}
                  </div>
                )}
              </button>
            );
          })}
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
          <p className="text-sm text-white/50">
            Select up to two goals to continue
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
