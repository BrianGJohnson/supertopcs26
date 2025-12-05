"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  IconCash,
  IconShoppingCart,
  IconLink,
  IconSpeakerphone,
  IconQuestionMark,
  IconBrandYoutube,
  IconChevronDown,
  IconLoader2,
} from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { authFetch } from "@/lib/supabase";

/**
 * Step 3: Money (How do you want to make money?)
 * 
 * Purpose: Understand their monetization strategy with CONTEXT.
 * Each selection reveals a follow-up question to get specific details
 * that GPT can use for personalized pillar recommendations.
 */

interface MonetizationOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
  hoverBg: string;
  followUp?: {
    type: "text" | "dropdown";
    question: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
  };
}

const MONETIZATION_OPTIONS: MonetizationOption[] = [
  {
    id: "adsense",
    label: "YouTube Ads",
    description: "Earn ad revenue from views",
    icon: IconCash,
    color: "#2BD899",
    bgColor: "rgba(43, 216, 153, 0.12)",
    hoverBg: "rgba(43, 216, 153, 0.20)",
    followUp: {
      type: "dropdown",
      question: "What's your current AdSense status?",
      options: [
        { value: "not_eligible", label: "Not eligible yet (under 1K subs)" },
        { value: "eligible_not_applied", label: "Eligible but haven't applied" },
        { value: "just_started", label: "Just got monetized" },
        { value: "earning", label: "Earning consistently" },
      ],
    },
  },
  {
    id: "products",
    label: "Sell My Products",
    description: "Courses, coaching, software & more",
    icon: IconShoppingCart,
    color: "#7A5CFA",
    bgColor: "rgba(122, 92, 250, 0.12)",
    hoverBg: "rgba(122, 92, 250, 0.20)",
    followUp: {
      type: "text",
      question: "What do you sell or plan to sell?",
      placeholder: "e.g., Online course, coaching, SaaS tool, ebooks...",
    },
  },
  {
    id: "affiliate",
    label: "Affiliate Sales",
    description: "Earn commissions promoting products",
    icon: IconLink,
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.12)",
    hoverBg: "rgba(245, 158, 11, 0.20)",
    followUp: {
      type: "text",
      question: "What types of products would you promote?",
      placeholder: "e.g., Camera gear, editing software, courses...",
    },
  },
  {
    id: "sponsorships",
    label: "Sponsorships",
    description: "Brand deals & partnerships",
    icon: IconSpeakerphone,
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.12)",
    hoverBg: "rgba(236, 72, 153, 0.20)",
    followUp: {
      type: "text",
      question: "What brands or products align with your channel?",
      placeholder: "e.g., Tech companies, productivity tools, creator tools...",
    },
  },
  {
    id: "not_sure",
    label: "Not Sure Yet",
    description: "I'll figure it out as I grow",
    icon: IconQuestionMark,
    color: "#8B95A5",
    bgColor: "rgba(139, 149, 165, 0.10)",
    hoverBg: "rgba(139, 149, 165, 0.16)",
    // No follow-up needed
  },
];

interface MonetizationSelection {
  id: string;
  details?: string;
}

export default function OnboardingStep3() {
  const router = useRouter();
  const [selections, setSelections] = useState<MonetizationSelection[]>([]);
  const [hasChannel, setHasChannel] = useState<boolean | null>(null);
  const [channelUrl, setChannelUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isSelected = (optionId: string) => 
    selections.some(s => s.id === optionId);

  const getSelection = (optionId: string) => 
    selections.find(s => s.id === optionId);

  const getPriority = (optionId: string) => {
    const index = selections.findIndex(s => s.id === optionId);
    return index >= 0 ? index + 1 : null;
  };

  const toggleSelection = (optionId: string) => {
    setSelections(prev => {
      if (prev.some(s => s.id === optionId)) {
        return prev.filter(s => s.id !== optionId);
      }
      return [...prev, { id: optionId, details: "" }];
    });
  };

  const updateDetails = (optionId: string, details: string) => {
    setSelections(prev => 
      prev.map(s => s.id === optionId ? { ...s, details } : s)
    );
  };

  const hasSelection = selections.length > 0;
  
  // Check if all selected options with follow-ups have details filled
  const allDetailsComplete = selections.every(s => {
    const option = MONETIZATION_OPTIONS.find(o => o.id === s.id);
    if (!option?.followUp) return true;
    return s.details && s.details.trim().length > 0;
  });

  const canContinue = 
    selections.length > 0 && 
    allDetailsComplete &&
    hasChannel !== null && 
    (hasChannel === false || channelUrl.trim().length > 0);

  const handleContinue = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Build the data object for saving
      const monetizationMethods = selections.map(s => s.id);
      const monetizationPriority = [...monetizationMethods]; // Same order = priority

      // Extract specific details based on selection
      const productsSelection = selections.find(s => s.id === "products");
      const affiliateSelection = selections.find(s => s.id === "affiliate");
      const adsenseSelection = selections.find(s => s.id === "adsense");
      const sponsorshipSelection = selections.find(s => s.id === "sponsorships");

      const saveData = {
        monetizationMethods,
        monetizationPriority,
        productsDescription: productsSelection?.details || null,
        affiliateProducts: affiliateSelection?.details || null,
        adsenseStatus: adsenseSelection?.details || null,
        sponsorshipNiche: sponsorshipSelection?.details || null,
        hasChannel: hasChannel,
        channelUrl: hasChannel ? channelUrl : null,
      };

      const response = await authFetch("/api/onboarding/save", {
        method: "POST",
        body: JSON.stringify({
          step: 3,
          data: saveData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Save API error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to save");
      }

      router.push("/members/onboarding/step-4");
    } catch (error) {
      console.error("Error saving monetization data:", error);
      // Still navigate for now, but log the error
      router.push("/members/onboarding/step-4");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/members/onboarding/step-2");
  };

  return (
    <OnboardingPageLayout
      currentStep={3}
      completedSteps={[1, 2]}
      icon={IconCash}
      heroLine1="What's Your Main"
      heroLine2="Money Focus?"
      heroDescription="Select all that apply—your first choice is your top priority."
    >
      {/* Monetization Cards - Vertical Stack */}
      <div className="space-y-4 max-w-xl mx-auto">
        {MONETIZATION_OPTIONS.map((option) => {
          const selected = isSelected(option.id);
          const selection = getSelection(option.id);
          const priority = getPriority(option.id);
          const Icon = option.icon;
          const hasFollowUp = option.followUp && selected;
          
          return (
            <div key={option.id} className="space-y-0">
              {/* Main Card */}
              <button
                onClick={() => toggleSelection(option.id)}
                className={`
                  w-full group relative flex items-center gap-5 p-5 text-left
                  transition-all duration-300 ease-out
                  ${hasFollowUp ? "rounded-t-2xl border-2 border-b-0" : "rounded-2xl border-2"}
                  ${selected ? "scale-[1.01]" : "hover:scale-[1.01]"}
                `}
                style={{
                  backgroundColor: selected ? option.hoverBg : option.bgColor,
                  borderColor: selected ? option.color : `${option.color}40`,
                  boxShadow: selected && !hasFollowUp ? `0 4px 24px ${option.color}25` : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    e.currentTarget.style.backgroundColor = option.hoverBg;
                    e.currentTarget.style.borderColor = `${option.color}70`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    e.currentTarget.style.backgroundColor = option.bgColor;
                    e.currentTarget.style.borderColor = `${option.color}40`;
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
                  <div className={`text-lg font-bold ${selected ? "text-white/90" : "text-white/80"}`}>
                    {option.label}
                  </div>
                  <div className="text-base text-white/50 leading-snug">
                    {option.description}
                  </div>
                </div>

                {/* Priority badge */}
                {selected && (
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold animate-[badgePop_0.3s_ease-out]"
                    style={{ backgroundColor: option.color, color: '#0B1220' }}
                  >
                    {priority}
                  </div>
                )}
              </button>

              {/* Follow-up Input - Expands when selected */}
              {hasFollowUp && option.followUp && (
                <div 
                  className="animate-in slide-in-from-top-2 duration-300 rounded-b-2xl border-2 border-t-0 p-5 pt-4 -mt-[2px]"
                  style={{ 
                    borderColor: option.color,
                    backgroundColor: `${option.color}08`,
                    boxShadow: `0 4px 24px ${option.color}20`,
                  }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    {option.followUp.question}
                  </label>
                  
                  {option.followUp.type === "text" ? (
                    <input
                      type="text"
                      value={selection?.details || ""}
                      onChange={(e) => updateDetails(option.id, e.target.value)}
                      placeholder={option.followUp.placeholder}
                      className="
                        w-full px-4 py-3 rounded-xl text-base
                        bg-black/30 border border-white/20
                        text-white placeholder:text-white/40
                        focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20
                        transition-all
                      "
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={selection?.details || ""}
                        onChange={(e) => updateDetails(option.id, e.target.value)}
                        className="
                          w-full px-4 py-3 rounded-xl text-base appearance-none
                          bg-black/30 border border-white/20
                          text-white
                          focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20
                          transition-all cursor-pointer
                        "
                      >
                        <option value="" className="bg-[#0B1220]">Select an option...</option>
                        {option.followUp.options?.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-[#0B1220]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <IconChevronDown 
                        size={20} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Channel Question - Progressive Reveal */}
      {hasSelection && allDetailsComplete && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 mt-10">
          {/* Divider */}
          <div className="w-full max-w-xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

          <div className="space-y-6 text-center max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
              <IconBrandYoutube size={32} className="text-[#FF0000]" />
              Do You Have A YouTube Channel?
            </h3>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setHasChannel(true)}
                className={`
                  flex-1 max-w-[180px] flex flex-col items-center gap-3 px-6 py-5 rounded-xl transition-all
                  ${hasChannel === true
                    ? "bg-[#FF0000]/10 border-2 border-[#FF0000]/50 text-white"
                    : "bg-black/30 border border-white/10 text-white/60 hover:bg-white/[0.04]"
                  }
                `}
              >
                <IconBrandYoutube size={32} className={hasChannel === true ? "text-[#FF0000]" : "text-white/40"} />
                <span className="font-semibold text-lg">Yes, I do</span>
              </button>

              <button
                onClick={() => {
                  setHasChannel(false);
                  setChannelUrl("");
                }}
                className={`
                  flex-1 max-w-[180px] flex flex-col items-center gap-3 px-6 py-5 rounded-xl transition-all
                  ${hasChannel === false
                    ? "bg-[#FF0000]/10 border-2 border-[#FF0000]/50 text-white"
                    : "bg-black/30 border border-white/10 text-white/60 hover:bg-white/[0.04]"
                  }
                `}
              >
                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-lg">
                  ?
                </div>
                <span className="font-semibold text-lg">Not yet</span>
              </button>
            </div>

            {/* Channel URL Input */}
            {hasChannel === true && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <IconBrandYoutube 
                    size={24} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF0000]" 
                  />
                  <input
                    type="url"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="
                      w-full pl-14 pr-5 py-4 rounded-xl text-lg
                      bg-black/40 border border-white/10
                      text-white placeholder:text-white/30
                      focus:outline-none focus:border-[#FF0000]/50 focus:ring-1 focus:ring-[#FF0000]/20
                      transition-all
                    "
                  />
                </div>
                <p className="text-sm text-white/40">
                  We'll use this to personalize your experience.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      {hasSelection && (
        <div className="flex flex-col items-center gap-4 pt-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={handleContinue}
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
            {isSaving ? (
              <>
                <IconLoader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
          
          {!allDetailsComplete && (
            <p className="text-sm text-white/50">
              Complete the follow-up questions to continue
            </p>
          )}
          
          {allDetailsComplete && hasChannel === null && (
            <p className="text-sm text-white/50">
              Let us know if you have a channel to continue
            </p>
          )}
          
          {allDetailsComplete && hasChannel === true && !channelUrl.trim() && (
            <p className="text-sm text-white/50">
              Enter your channel URL to continue
            </p>
          )}

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
