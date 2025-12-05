"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconUsers, IconCheck, IconSparkles, IconSeedling, IconBook, IconTrophy } from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { authFetch } from "@/lib/supabase";

/**
 * Step 6: Audience
 * 
 * Purpose: Define who their ideal viewer is.
 * Simplified to reduce friction - new creators don't know their audience yet.
 * Focus on WHO THEY WANT TO HELP, not analytics they don't have.
 * 
 * Multi-select expertise: pick 2 adjacent levels (beginner+intermediate OR intermediate+advanced)
 * 
 * NO GPT call - just saving data.
 */

const EXPERTISE_OPTIONS = [
  { id: "beginner", label: "Beginners", description: "Just getting started", icon: IconSeedling, color: "#2BD899", bgGlow: "rgba(43, 216, 153, 0.12)" },
  { id: "intermediate", label: "Intermediate", description: "Know the basics", icon: IconBook, color: "#FBBF24", bgGlow: "rgba(251, 191, 36, 0.12)" },
  { id: "advanced", label: "Advanced", description: "Want deeper insights", icon: IconTrophy, color: "#7A5CFA", bgGlow: "rgba(122, 92, 250, 0.12)" },
];

export default function OnboardingStep6() {
  const router = useRouter();
  const [whoHelp, setWhoHelp] = useState("");
  const [struggle, setStruggle] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);

  // Toggle expertise selection (max 2, must be adjacent)
  const toggleExpertise = (id: string) => {
    setSelectedExpertise(prev => {
      if (prev.includes(id)) {
        // Deselect
        return prev.filter(e => e !== id);
      } else if (prev.length < 2) {
        // Add if under limit
        const newSelection = [...prev, id];
        // Check if adjacent (beginner+intermediate or intermediate+advanced)
        const sorted = newSelection.sort((a, b) => {
          const order = ["beginner", "intermediate", "advanced"];
          return order.indexOf(a) - order.indexOf(b);
        });
        if (sorted.length === 2) {
          const first = EXPERTISE_OPTIONS.findIndex(o => o.id === sorted[0]);
          const second = EXPERTISE_OPTIONS.findIndex(o => o.id === sorted[1]);
          if (second - first !== 1) {
            // Not adjacent, replace with just this one
            return [id];
          }
        }
        return newSelection;
      } else {
        // Already 2 selected, replace with just this one
        return [id];
      }
    });
  };

  // Need core 3 + at least 1 expertise selected
  const canContinue = 
    whoHelp.trim().length > 3 &&
    struggle.trim().length > 3 && 
    goal.trim().length > 3 && 
    selectedExpertise.length > 0;

  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 6,
          data: {
            audienceWhoHelp: whoHelp,
            audienceStruggle: struggle,
            audienceGoal: goal,
            audienceExpertise: selectedExpertise,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Save failed:", error);
        throw new Error(error.message || "Failed to save");
      }

      router.push("/members/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-5");
  };

  return (
    <OnboardingPageLayout
      currentStep={6}
      completedSteps={[1, 2, 3, 4, 5]}
      icon={IconUsers}
      heroLine1="Who Do You"
      heroLine2="Want To Help?"
      heroDescription="Think about the person you're making videos for."
    >
      <div className="space-y-10 max-w-2xl mx-auto">
        {/* Who Do You Want To Help */}
        <div className="space-y-4 text-center">
          <h3 className="text-2xl font-bold text-white/90">
            Describe Your Ideal Viewer
          </h3>

          <input
            type="text"
            value={whoHelp}
            onChange={(e) => setWhoHelp(e.target.value)}
            placeholder="e.g., Busy parents who want to cook healthy meals"
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

        {/* Their Problem & Dream */}
        <div className="space-y-5 text-center">
          <h3 className="text-2xl font-bold text-white/90">
            Their Problem & Dream
          </h3>

          <div className="flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-medium text-lg">
                1.
              </span>
              <input
                type="text"
                value={struggle}
                onChange={(e) => setStruggle(e.target.value)}
                placeholder="They're struggling with..."
                className="
                  w-full pl-12 pr-5 py-4 rounded-xl text-lg
                  bg-white/[0.06] border-2 border-white/20
                  text-white placeholder:text-white/30
                  focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-2 focus:ring-[#7A5CFA]/20
                  transition-all
                "
              />
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-medium text-lg">
                2.
              </span>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="They want to..."
                className="
                  w-full pl-12 pr-5 py-4 rounded-xl text-lg
                  bg-white/[0.06] border-2 border-white/20
                  text-white placeholder:text-white/30
                  focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-2 focus:ring-[#7A5CFA]/20
                  transition-all
                "
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Expertise Level - 2x2 Grid with Colors */}
        <div className="space-y-5 text-center">
          <div>
            <h3 className="text-2xl font-bold text-white/90 mb-2">
              Their Experience Level
            </h3>
            <p className="text-lg text-white/50">
              Choose up to 2 adjacent levels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXPERTISE_OPTIONS.map((option) => {
              const isSelected = selectedExpertise.includes(option.id);
              const IconComponent = option.icon;
              
              return (
                <button
                  key={option.id}
                  onClick={() => toggleExpertise(option.id)}
                  className={`
                    relative flex flex-col items-center p-8 rounded-2xl text-center transition-all
                    ${isSelected
                      ? `border-2`
                      : "border-2 border-white/20 hover:border-white/30"
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? `${option.color}15` : option.bgGlow,
                    borderColor: isSelected ? `${option.color}60` : undefined,
                  }}
                >
                  {isSelected && (
                    <div 
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: option.color }}
                    >
                      <IconCheck size={16} className="text-white" stroke={3} />
                    </div>
                  )}

                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ 
                      backgroundColor: isSelected ? `${option.color}30` : `${option.color}15`,
                    }}
                  >
                    <IconComponent 
                      size={28} 
                      style={{ color: option.color }}
                    />
                  </div>

                  <span 
                    className="font-bold text-2xl mb-1"
                    style={{ color: isSelected ? "white" : "rgba(255,255,255,0.8)" }}
                  >
                    {option.label}
                  </span>
                  <span className="text-lg text-white/50">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedExpertise.length > 0 && (
            <p className="text-white/40 text-base">
              {selectedExpertise.length === 1 
                ? "You can select one more adjacent level" 
                : `Selected: ${selectedExpertise.map(id => EXPERTISE_OPTIONS.find(o => o.id === id)?.label).join(" + ")}`
              }
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-4 pt-10">
        <button
          onClick={handleComplete}
          disabled={!canContinue || isSaving}
          className={`
            inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
            transition-all duration-200
            ${canContinue && !isSaving
              ? "bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]"
              : "bg-white/10 text-white/40 cursor-not-allowed"
            }
          `}
        >
          {isSaving ? "Saving..." : "Complete Setup"}
          <IconSparkles size={20} />
        </button>

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
