"use client";

import React, { useState } from "react";
import { 
  IconTarget,
  IconTrendingUp,
  IconCash,
  IconShoppingCart,
  IconAward,
  IconBrandYoutube,
  IconLink,
  IconCheck,
  IconUsers,
  IconSpeakerphone,
  IconQuestionMark,
} from "@tabler/icons-react";
import { HeroModule } from "@/components/layout/HeroModule";

interface Step2GoalChannelProps {
  onContinue: (data: Step2Data) => void;
  onBack: () => void;
}

export interface Step2Data {
  // Monetization methods in priority order (first = most important)
  monetizationMethods: string[];
  // Secondary goals (optional, up to 2)
  secondaryGoals: string[];
  // Channel info
  hasChannel: boolean;
  channelUrl: string;
  // Follow-up answers based on selections
  monetizationDetails: {
    productsDescription?: string;
    affiliateProducts?: string;
    sponsorshipNiche?: string;
    adsenseStatus?: string; // "monetized", "not_yet", "working_towards"
  };
}

// Monetization options - users can select multiple, order matters (first = most important)
const MONETIZATION_OPTIONS = [
  {
    id: "adsense",
    label: "YouTube Ads",
    description: "Earn ad revenue from views",
    icon: IconCash,
    color: "#2BD899",
    bgColor: "rgba(43, 216, 153, 0.12)",
    hoverBg: "rgba(43, 216, 153, 0.18)",
    row: 1,
  },
  {
    id: "sell_products",
    label: "Sell Products",
    description: "Courses, coaching, software & more",
    icon: IconShoppingCart,
    color: "#7A5CFA",
    bgColor: "rgba(122, 92, 250, 0.12)",
    hoverBg: "rgba(122, 92, 250, 0.18)",
    row: 1,
  },
  {
    id: "affiliate",
    label: "Affiliate Sales",
    description: "Earn commissions promoting products",
    icon: IconLink,
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.12)",
    hoverBg: "rgba(245, 158, 11, 0.18)",
    row: 1,
  },
  {
    id: "sponsorships",
    label: "Sponsorships",
    description: "Brand deals & partnerships",
    icon: IconSpeakerphone,
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.12)",
    hoverBg: "rgba(236, 72, 153, 0.18)",
    row: 2,
  },
  {
    id: "not_sure",
    label: "Not Sure Yet",
    description: "I'll figure it out as I grow",
    icon: IconQuestionMark,
    color: "#8B95A5",
    bgColor: "rgba(139, 149, 165, 0.10)",
    hoverBg: "rgba(139, 149, 165, 0.16)",
    row: 2,
  },
];

// Secondary goals - optional, up to 2
const SECONDARY_GOALS = [
  {
    id: "growth",
    label: "Grow Audience",
    description: "Views & subscribers",
    icon: IconTrendingUp,
    color: "#2BD899",
  },
  {
    id: "authority",
    label: "Build Authority",
    description: "Expertise & credibility",
    icon: IconAward,
    color: "#4A90D9",
  },
  {
    id: "community",
    label: "Build Community",
    description: "Engagement & connection",
    icon: IconUsers,
    color: "#06B6D4",
  },
];

// AdSense monetization status options
const ADSENSE_STATUS_OPTIONS = [
  { id: "monetized", label: "Yes, I'm monetized" },
  { id: "working_towards", label: "Working towards it" },
  { id: "not_yet", label: "Not yet" },
];

const MAX_SECONDARY = 2;

export function Step2GoalChannel({ onContinue, onBack }: Step2GoalChannelProps) {
  // Monetization methods in priority order (can select multiple)
  const [monetizationMethods, setMonetizationMethods] = useState<string[]>([]);
  // Secondary goals (optional)
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>([]);
  // Channel info
  const [hasChannel, setHasChannel] = useState<boolean | null>(null);
  const [channelUrl, setChannelUrl] = useState("");
  // Follow-up inputs
  const [productsDescription, setProductsDescription] = useState("");
  const [affiliateProducts, setAffiliateProducts] = useState("");
  const [sponsorshipNiche, setSponsorshipNiche] = useState("");
  const [adsenseStatus, setAdsenseStatus] = useState("");
  // Track if details section is complete
  const [detailsComplete, setDetailsComplete] = useState(false);

  // Check which follow-up inputs are needed based on selections
  const needsAdsenseInput = monetizationMethods.includes('adsense');
  const needsProductsInput = monetizationMethods.includes('sell_products');
  const needsAffiliateInput = monetizationMethods.includes('affiliate');
  const needsSponsorshipInput = monetizationMethods.includes('sponsorships');
  const needsNotSureInput = monetizationMethods.includes('not_sure');
  const hasAnyFollowUp = needsAdsenseInput || needsProductsInput || needsAffiliateInput || needsSponsorshipInput;

  // Check if all required details are filled
  const allDetailsFilled = () => {
    if (needsAdsenseInput && !adsenseStatus) return false;
    if (needsProductsInput && !productsDescription.trim()) return false;
    if (needsAffiliateInput && !affiliateProducts.trim()) return false;
    if (needsSponsorshipInput && !sponsorshipNiche.trim()) return false;
    return true;
  };

  // Must have: at least one monetization + channel question answered + (if has channel, URL provided)
  const canContinue = 
    monetizationMethods.length > 0 && 
    hasChannel !== null && 
    (hasChannel === false || channelUrl.trim().length > 0);

  // Toggle monetization selection - maintains order (first selected = most important)
  const toggleMonetization = (optionId: string) => {
    setMonetizationMethods(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      }
      return [...prev, optionId];
    });
    // Reset details complete when changing selections
    setDetailsComplete(false);
  };

  // Get the priority number for a selected option (1 = most important)
  const getPriority = (optionId: string) => {
    const index = monetizationMethods.indexOf(optionId);
    return index >= 0 ? index + 1 : null;
  };

  const toggleSecondaryGoal = (goalId: string) => {
    setSecondaryGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      }
      if (prev.length >= MAX_SECONDARY) {
        return prev;
      }
      return [...prev, goalId];
    });
  };

  const handleDetailsComplete = () => {
    if (allDetailsFilled() || needsNotSureInput) {
      setDetailsComplete(true);
    }
  };

  const handleContinue = () => {
    if (canContinue) {
      onContinue({
        monetizationMethods,
        secondaryGoals,
        hasChannel: hasChannel ?? false,
        channelUrl: channelUrl.trim(),
        monetizationDetails: {
          productsDescription: needsProductsInput ? productsDescription.trim() : undefined,
          affiliateProducts: needsAffiliateInput ? affiliateProducts.trim() : undefined,
          sponsorshipNiche: needsSponsorshipInput ? sponsorshipNiche.trim() : undefined,
          adsenseStatus: needsAdsenseInput ? adsenseStatus : undefined,
        },
      });
    }
  };

  // Split monetization options by row
  const row1Options = MONETIZATION_OPTIONS.filter(o => o.row === 1);
  const row2Options = MONETIZATION_OPTIONS.filter(o => o.row === 2);

  // Has user made at least one selection? (for progressive reveal)
  const hasSelection = monetizationMethods.length > 0;

  // Should show secondary goals? (after details are complete OR if "not sure" is only selection)
  const showSecondaryGoals = hasSelection && (detailsComplete || (needsNotSureInput && !hasAnyFollowUp));

  // Should show channel question? (after secondary goals section is visible)
  const showChannelQuestion = showSecondaryGoals;

  return (
    <div className="flex flex-col gap-10">
      {/* Hero Section */}
      <HeroModule
        icon={IconTarget}
        line1="Tell Us About Your"
        line2="Goals & Channel"
        description="Understanding your objectives helps us personalize every recommendation to your unique path."
      />

      {/* Section 1: Monetization Selection (Multi-select with priority) */}
      <div className="space-y-12 text-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            How Do You Want To Make Money?
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Choose all that apply — your first selection is your primary revenue source
          </p>
        </div>

        {/* Monetization Cards - 3x2 grid with large gaps */}
        <div className="space-y-16 max-w-4xl mx-auto pb-8">
          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-3 gap-8">
            {row1Options.map((option) => {
              const isSelected = monetizationMethods.includes(option.id);
              const priority = getPriority(option.id);
              const Icon = option.icon;
              
              return (
                <button
                  key={option.id}
                  onClick={() => toggleMonetization(option.id)}
                  className={`
                    group relative flex flex-col items-center gap-5 p-9 rounded-2xl text-center
                    transition-all duration-300 ease-out
                    ${isSelected
                      ? "border-2 scale-[1.02] shadow-lg"
                      : "border border-white/[0.08] hover:scale-[1.02] hover:shadow-lg"
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? option.hoverBg : option.bgColor,
                    borderColor: isSelected ? option.color : undefined,
                    boxShadow: isSelected ? `0 8px 32px ${option.color}25` : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = option.hoverBg;
                      e.currentTarget.style.borderColor = `${option.color}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = option.bgColor;
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }
                  }}
                >
                  {/* Priority badge */}
                  {isSelected && (
                    <div 
                      className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: option.color, color: '#0B1220' }}
                    >
                      {priority}
                    </div>
                  )}

                  {/* Icon */}
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${option.color}25` }}
                  >
                    <Icon size={52} style={{ color: option.color }} />
                  </div>

                  {/* Text */}
                  <div>
                    <div className={`text-2xl font-bold ${isSelected ? "text-white" : "text-white/90"}`}>
                      {option.label}
                    </div>
                    <div className="text-lg text-white/60 mt-2 leading-snug">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Row 2: 2 cards centered */}
          <div className="flex justify-center gap-8">
            {row2Options.map((option) => {
              const isSelected = monetizationMethods.includes(option.id);
              const priority = getPriority(option.id);
              const Icon = option.icon;
              
              return (
                <button
                  key={option.id}
                  onClick={() => toggleMonetization(option.id)}
                  className={`
                    group relative flex flex-col items-center gap-5 p-9 rounded-2xl text-center
                    transition-all duration-300 ease-out w-[calc(33.333%-1rem)]
                    ${isSelected
                      ? "border-2 scale-[1.02] shadow-lg"
                      : "border border-white/[0.08] hover:scale-[1.02] hover:shadow-lg"
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? option.hoverBg : option.bgColor,
                    borderColor: isSelected ? option.color : undefined,
                    boxShadow: isSelected ? `0 8px 32px ${option.color}25` : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = option.hoverBg;
                      e.currentTarget.style.borderColor = `${option.color}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = option.bgColor;
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }
                  }}
                >
                  {/* Priority badge */}
                  {isSelected && (
                    <div 
                      className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: option.color, color: '#0B1220' }}
                    >
                      {priority}
                    </div>
                  )}

                  {/* Icon */}
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${option.color}25` }}
                  >
                    <Icon size={52} style={{ color: option.color }} />
                  </div>

                  {/* Text */}
                  <div>
                    <div className={`text-2xl font-bold ${isSelected ? "text-white" : "text-white/90"}`}>
                      {option.label}
                    </div>
                    <div className="text-lg text-white/60 mt-2 leading-snug">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progressive Reveal Section 2: Tell Us More About Revenue */}
      {hasSelection && hasAnyFollowUp && !detailsComplete && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />
          
          <div className="space-y-10 text-center">
            {/* Section Header */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">
                Tell Us More About Your Revenue
              </h3>
              <p className="text-lg text-white/50 max-w-xl mx-auto">
                Give us some details so we can personalize your experience. Not sure yet? That's okay — just type "not sure" and we'll help you figure it out.
              </p>
            </div>

            {/* Input Fields - Clean layout with proper spacing */}
            <div className="space-y-10 max-w-xl mx-auto">
              {/* YouTube Ads Status */}
              {needsAdsenseInput && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xl text-white/80 font-medium">
                    Are you currently monetized on YouTube?
                  </label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {ADSENSE_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setAdsenseStatus(option.id)}
                        className={`
                          px-5 py-3 rounded-xl text-base font-medium transition-all
                          ${adsenseStatus === option.id
                            ? "bg-[#2BD899]/20 border-2 border-[#2BD899] text-white"
                            : "bg-white/[0.05] border border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/20"
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Input */}
              {needsProductsInput && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xl text-white/80 font-medium">
                    What do you sell (or plan to sell)?
                  </label>
                  <input
                    type="text"
                    value={productsDescription}
                    onChange={(e) => setProductsDescription(e.target.value)}
                    placeholder="e.g., Online courses, coaching, templates, software"
                    className="
                      w-full px-5 py-4 rounded-xl text-lg text-center
                      bg-white/[0.06] border border-white/15
                      text-white placeholder:text-white/30
                      focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-1 focus:ring-[#7A5CFA]/30
                      transition-all
                    "
                  />
                </div>
              )}

              {/* Affiliate Input */}
              {needsAffiliateInput && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xl text-white/80 font-medium">
                    What kind of products do you promote?
                  </label>
                  <input
                    type="text"
                    value={affiliateProducts}
                    onChange={(e) => setAffiliateProducts(e.target.value)}
                    placeholder="e.g., Software, cameras, courses, Amazon products"
                    className="
                      w-full px-5 py-4 rounded-xl text-lg text-center
                      bg-white/[0.06] border border-white/15
                      text-white placeholder:text-white/30
                      focus:outline-none focus:border-[#F59E0B]/60 focus:ring-1 focus:ring-[#F59E0B]/30
                      transition-all
                    "
                  />
                </div>
              )}

              {/* Sponsorship Input */}
              {needsSponsorshipInput && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xl text-white/80 font-medium">
                    What's your niche for attracting sponsors?
                  </label>
                  <input
                    type="text"
                    value={sponsorshipNiche}
                    onChange={(e) => setSponsorshipNiche(e.target.value)}
                    placeholder="e.g., Tech reviews, lifestyle, gaming, fitness"
                    className="
                      w-full px-5 py-4 rounded-xl text-lg text-center
                      bg-white/[0.06] border border-white/15
                      text-white placeholder:text-white/30
                      focus:outline-none focus:border-[#EC4899]/60 focus:ring-1 focus:ring-[#EC4899]/30
                      transition-all
                    "
                  />
                </div>
              )}

              {/* Continue Button for Details Section */}
              <div className="pt-4">
                <button
                  onClick={handleDetailsComplete}
                  disabled={!allDetailsFilled()}
                  className={`
                    inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-base
                    transition-all duration-200
                    ${allDetailsFilled()
                      ? "bg-white/10 text-white hover:bg-white/15 border border-white/20"
                      : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                    }
                  `}
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progressive Reveal Section 3: Secondary Goals */}
      {showSecondaryGoals && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

          <div className="space-y-8 text-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">
                What Else Matters To You?
                <span className="ml-3 text-base font-normal text-white/40">
                  Optional • {secondaryGoals.length}/{MAX_SECONDARY}
                </span>
              </h3>
              <p className="text-lg text-white/50">
                Select up to {MAX_SECONDARY} additional goals
              </p>
            </div>

            {/* Secondary Goal Cards */}
            <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
              {SECONDARY_GOALS.map((goal) => {
                const isSelected = secondaryGoals.includes(goal.id);
                const isDisabled = !isSelected && secondaryGoals.length >= MAX_SECONDARY;
                const Icon = goal.icon;
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleSecondaryGoal(goal.id)}
                    disabled={isDisabled}
                    className={`
                      relative flex items-center gap-4 px-6 py-4 rounded-xl transition-all
                      ${isSelected
                        ? "bg-white/[0.08] border-2 border-white/30"
                        : isDisabled
                          ? "bg-black/20 border border-white/[0.03] opacity-50 cursor-not-allowed"
                          : "bg-black/30 border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
                      }
                    `}
                  >
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      <Icon size={26} style={{ color: goal.color }} />
                    </div>

                    {/* Text */}
                    <div className="text-left">
                      <div className={`text-lg font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>
                        {goal.label}
                      </div>
                      <div className="text-base text-white/50">
                        {goal.description}
                      </div>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#2BD899] flex items-center justify-center ml-2">
                        <IconCheck size={14} className="text-[#0B1220]" stroke={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progressive Reveal Section 4: Channel Question */}
      {showChannelQuestion && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

          <div className="space-y-8 text-center">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
              <IconBrandYoutube size={32} className="text-[#FF0000]" />
              Do You Have A YouTube Channel?
            </h3>

            <div className="flex gap-5 justify-center max-w-md mx-auto">
              <button
                onClick={() => setHasChannel(true)}
                className={`
                  flex-1 flex flex-col items-center gap-3 px-6 py-5 rounded-xl transition-all
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
                  flex-1 flex flex-col items-center gap-3 px-6 py-5 rounded-xl transition-all
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
              <div className="space-y-4 max-w-md mx-auto animate-in fade-in slide-in-from-top-2 duration-200">
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
                <p className="text-base text-white/40">
                  We'll use this to personalize your experience.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Continue Button */}
      {showChannelQuestion && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col items-center gap-4 pt-6">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`
                inline-flex items-center gap-2 px-12 py-5 rounded-xl font-semibold text-xl
                transition-all duration-200
                ${canContinue
                  ? "bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
                }
              `}
            >
              Continue
              <svg 
                className="w-6 h-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            
            {!canContinue && hasChannel === null && (
              <p className="text-base text-white/40">
                Let us know if you have a channel to continue
              </p>
            )}
            
            {!canContinue && hasChannel === true && !channelUrl.trim() && (
              <p className="text-base text-white/40">
                Enter your channel URL to continue
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
