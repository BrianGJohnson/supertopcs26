"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBulb, IconCheck, IconSchool, IconChalkboard, IconBulbFilled, IconTargetArrow, IconMessageCircle, IconSparkles, IconTheater, IconPlus } from "@tabler/icons-react";
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { authFetch } from "@/lib/supabase";

/**
 * Step 4: Niche, Content Style & Topics
 * 
 * 7 Creator Archetypes with video formats for each.
 * This data feeds into GPT-5 mini for Audience Fit scoring.
 */

const CONTENT_STYLES = [
  {
    id: 1,
    name: "The Scholar",
    vibe: "I go deep into research, data, and thorough analysis. My content is detailed and well-sourced.",
    icon: IconSchool,
    formats: ["Research Videos", "Data Breakdowns", "Case Studies", "Documentaries", "Long-form Essays", "Technical Deep Dives", "White Papers", "Industry Analysis"],
    color: "#818CF8", // Lighter Indigo for better contrast
    textColor: "#C7D2FE", // Even lighter for text
  },
  {
    id: 2,
    name: "The Teacher",
    vibe: "I teach with clear, structured lessons. Step-by-step guidance is my specialty.",
    icon: IconChalkboard,
    formats: ["Tutorials", "How-To Guides", "Courses", "Walkthroughs", "Screen Shares", "Demonstrations", "Beginner Guides", "Skill Building", "Light Documentaries"],
    color: "#A78BFA", // Lighter Purple for better contrast
    textColor: "#DDD6FE", // Even lighter for text
  },
  {
    id: 3,
    name: "The Explainer",
    vibe: "I take complex topics and make them simple to understand. Clarity is everything.",
    icon: IconBulbFilled,
    formats: ["Explainers", "Breakdowns", "What Is Videos", "Comparisons", "First Impressions", "Reviews", "Myth Busting", "Pros & Cons", "Top 10 Lists", "Tutorials"],
    color: "#2BD899", // Green (brand primary)
    textColor: "#2BD899",
  },
  {
    id: 4,
    name: "The Coach",
    vibe: "I guide people with strategies and tips that actually work. Practical advice is my thing.",
    icon: IconTargetArrow,
    formats: ["Tips & Tricks", "Strategy Videos", "Advice", "Frameworks", "Productivity", "Mindset", "Listicles", "Q&A", "Behind-the-Scenes", "Get Ready With Me"],
    color: "#14B8A6", // Teal - distinctly different from green
    textColor: "#5EEAD4",
  },
  {
    id: 5,
    name: "The Commentator",
    vibe: "I share my opinions and takes on what's happening now. Hot takes and reactions are my jam.",
    icon: IconMessageCircle,
    formats: ["Commentary", "Reactions", "News Recaps", "Opinion Pieces", "Rants", "Drama Coverage", "Hot Takes", "Tier Lists", "First Impressions", "Podcasts"],
    color: "#FBBF24", // Amber/Yellow
    textColor: "#FDE68A",
  },
  {
    id: 6,
    name: "The Entertainer",
    vibe: "I bring the energy and good vibes. Personality-driven content that makes people feel good.",
    icon: IconSparkles,
    formats: ["Vlogs", "Challenges", "Collabs", "Unboxings", "Hauls", "Day in the Life", "Trends", "Mukbangs", "Live Streams", "Storytime", "Try-Ons"],
    color: "#FB923C", // Orange
    textColor: "#FDBA74",
  },
  {
    id: 7,
    name: "The Performer",
    vibe: "I put on a show. Scripted, creative, and all about the entertainment value.",
    icon: IconTheater,
    formats: ["Skits", "Comedy", "Shorts", "Parodies", "Memes", "Scripted Series", "Characters", "Music Videos", "Animations", "Pranks", "Game Shows"],
    color: "#F87171", // Lighter Red for better contrast
    textColor: "#FCA5A5",
  },
];

export default function OnboardingStep4() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [contentStyle, setContentStyle] = useState<number | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [customFormat, setCustomFormat] = useState("");
  const [customFormats, setCustomFormats] = useState<string[]>([]);
  const [topics, setTopics] = useState(["", "", ""]);

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleStyleSelect = (styleId: number) => {
    setContentStyle(styleId);
    setSelectedFormats([]);
    setCustomFormats([]);
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => {
      if (prev.includes(format)) {
        return prev.filter(f => f !== format);
      }
      return [...prev, format];
    });
  };

  const addCustomFormat = () => {
    const trimmed = customFormat.trim();
    if (trimmed && !customFormats.includes(trimmed) && !selectedFormats.includes(trimmed)) {
      setCustomFormats(prev => [...prev, trimmed]);
      setSelectedFormats(prev => [...prev, trimmed]);
      setCustomFormat("");
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomFormat();
    }
  };

  // Get current style
  const currentStyle = contentStyle ? CONTENT_STYLES.find(s => s.id === contentStyle) : null;
  const currentFormats = currentStyle?.formats || [];
  const allSelectedFormats = selectedFormats;
  const totalSelected = allSelectedFormats.length;

  // Validation
  const filledTopics = topics.filter(t => t.trim().length > 0);
  const canContinue = 
    niche.trim().length >= 2 && 
    contentStyle !== null &&
    totalSelected >= 4 &&
    filledTopics.length >= 1;

  const handleContinue = async () => {
    try {
      await authFetch("/api/onboarding/save", {
        method: "POST",
        body: JSON.stringify({
          step: 4,
          data: {
            niche: niche.trim(),
            contentStyle: contentStyle,
            contentStyleName: currentStyle?.name,
            videoFormats: allSelectedFormats,
            topicIdeas: filledTopics,
          },
        }),
      });
    } catch (error) {
      console.error("Error saving niche:", error);
    }
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
      heroDescription="Help us understand your niche and content style."
    >
      <div className="space-y-12 max-w-5xl mx-auto">
        {/* Niche Input */}
        <div className="space-y-5 text-center">
          <h3 className="text-3xl font-bold text-white">
            Describe Your Niche
          </h3>

          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g., YouTube Growth, Home Cooking, Tech Reviews"
            className="
              w-full px-6 py-5 rounded-xl text-xl text-center
              bg-white/[0.06] border-2 border-white/20
              text-white placeholder:text-white/40
              focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-2 focus:ring-[#7A5CFA]/20
              transition-all
            "
          />
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Content Style Cards */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-3">
              Your Content Style
            </h3>
            <p className="text-2xl text-white/70">
              How do you connect with your audience?
            </p>
          </div>

          {/* Pyramid Layout: 3 on top, 4 on bottom */}
          <div className="space-y-8">
            {/* Top Row - 3 cards centered */}
            <div className="flex justify-center gap-8">
              {CONTENT_STYLES.slice(0, 3).map((style) => {
                const isSelected = contentStyle === style.id;
                const Icon = style.icon;
                const nameParts = style.name.split(" ");
                const theWord = nameParts[0];
                const restOfName = nameParts.slice(1).join(" ");
                
                return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className={`
                      relative flex flex-col items-center p-7 rounded-2xl text-center transition-all duration-200 w-48
                      ${isSelected 
                        ? "scale-105 shadow-2xl" 
                        : "hover:scale-105"
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? `${style.color}30` : `${style.color}15`,
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: isSelected ? style.color : `${style.color}50`,
                      boxShadow: isSelected ? `0 0 40px ${style.color}40` : `0 0 15px ${style.color}15`,
                    }}
                  >
                    {isSelected && (
                      <div 
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: style.color }}
                      >
                        <IconCheck size={18} className="text-white" stroke={3} />
                      </div>
                    )}
                    
                    <Icon 
                      size={54} 
                      className="mb-3 transition-colors flex-shrink-0"
                      style={{ color: isSelected ? style.textColor : style.color }}
                    />
                    
                    <div className="flex flex-col items-center leading-tight">
                      <span 
                        className="text-xl font-semibold transition-colors"
                        style={{ color: isSelected ? style.textColor : style.color }}
                      >
                        {theWord}
                      </span>
                      <span 
                        className="text-xl font-semibold transition-colors"
                        style={{ color: isSelected ? style.textColor : style.color }}
                      >
                        {restOfName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Bottom Row - 4 cards centered */}
            <div className="flex justify-center gap-8">
              {CONTENT_STYLES.slice(3, 7).map((style) => {
                const isSelected = contentStyle === style.id;
                const Icon = style.icon;
                const nameParts = style.name.split(" ");
                const theWord = nameParts[0];
                const restOfName = nameParts.slice(1).join(" ");
                
                return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className={`
                      relative flex flex-col items-center p-7 rounded-2xl text-center transition-all duration-200 w-48
                      ${isSelected 
                        ? "scale-105 shadow-2xl" 
                        : "hover:scale-105"
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? `${style.color}30` : `${style.color}15`,
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: isSelected ? style.color : `${style.color}50`,
                      boxShadow: isSelected ? `0 0 40px ${style.color}40` : `0 0 15px ${style.color}15`,
                    }}
                  >
                    {isSelected && (
                      <div 
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: style.color }}
                      >
                        <IconCheck size={18} className="text-white" stroke={3} />
                      </div>
                    )}
                    
                    <Icon 
                      size={54} 
                      className="mb-3 transition-colors flex-shrink-0"
                      style={{ color: isSelected ? style.textColor : style.color }}
                    />
                    
                    <div className="flex flex-col items-center leading-tight">
                      <span 
                        className="text-xl font-semibold transition-colors"
                        style={{ color: isSelected ? style.textColor : style.color }}
                      >
                        {theWord}
                      </span>
                      <span 
                        className="text-xl font-semibold transition-colors"
                        style={{ color: isSelected ? style.textColor : style.color }}
                      >
                        {restOfName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Style Description */}
          {currentStyle && (
            <div 
              className="p-6 rounded-2xl border-2 text-center transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${currentStyle.color}20, ${currentStyle.color}08)`,
                borderColor: `${currentStyle.color}60`,
                boxShadow: `0 0 30px ${currentStyle.color}20`,
              }}
            >
              <p 
                className="text-3xl font-bold mb-3"
                style={{ color: currentStyle.textColor }}
              >
                {currentStyle.name}
              </p>
              <p className="text-xl text-white/80 leading-relaxed">
                {currentStyle.vibe}
              </p>
            </div>
          )}
        </div>

        {/* Video Formats */}
        {contentStyle && currentStyle && (
          <>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="space-y-6">
              <div className="text-center">
                <h3 
                  className="text-3xl font-bold mb-3"
                  style={{ color: currentStyle.textColor }}
                >
                  What Formats Do You Create?
                </h3>
                <p className="text-xl text-white/70">
                  Select at least 4 that best describe your content
                </p>
              </div>

              {/* Format Chips */}
              <div className="flex flex-wrap justify-center gap-3">
                {currentFormats.map((format) => {
                  const isSelected = selectedFormats.includes(format);
                  
                  return (
                    <button
                      key={format}
                      onClick={() => toggleFormat(format)}
                      className={`
                        px-6 py-3 rounded-full text-lg font-semibold transition-all duration-200
                        ${isSelected ? "scale-105" : "hover:scale-105"}
                      `}
                      style={{
                        backgroundColor: isSelected ? `${currentStyle.color}30` : `${currentStyle.color}15`,
                        borderWidth: "2px",
                        borderStyle: "solid",
                        borderColor: isSelected ? currentStyle.color : `${currentStyle.color}50`,
                        color: isSelected ? currentStyle.textColor : currentStyle.color,
                        boxShadow: isSelected ? `0 0 20px ${currentStyle.color}30` : "none",
                      }}
                    >
                      {isSelected && <IconCheck size={18} className="inline mr-2" />}
                      {format}
                    </button>
                  );
                })}

                {/* Custom formats */}
                {customFormats.map((format) => {
                  const isSelected = selectedFormats.includes(format);
                  
                  return (
                    <button
                      key={format}
                      onClick={() => toggleFormat(format)}
                      className={`
                        px-6 py-3 rounded-full text-lg font-semibold transition-all duration-200
                        ${isSelected ? "scale-105" : "hover:scale-105"}
                      `}
                      style={{
                        backgroundColor: isSelected ? `${currentStyle.color}30` : `${currentStyle.color}15`,
                        borderWidth: "2px",
                        borderStyle: "solid",
                        borderColor: isSelected ? currentStyle.color : `${currentStyle.color}50`,
                        color: isSelected ? currentStyle.textColor : currentStyle.color,
                        boxShadow: isSelected ? `0 0 20px ${currentStyle.color}30` : "none",
                      }}
                    >
                      {isSelected && <IconCheck size={18} className="inline mr-2" />}
                      {format}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Format - Colored to match */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="Add your own format..."
                    className="
                      px-5 py-3 rounded-full text-lg
                      text-white placeholder:text-white/40
                      focus:outline-none
                      transition-all w-72
                    "
                    style={{
                      backgroundColor: `${currentStyle.color}15`,
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: `${currentStyle.color}50`,
                    }}
                  />
                  <button
                    onClick={addCustomFormat}
                    disabled={!customFormat.trim()}
                    className="p-3 rounded-full transition-all"
                    style={{
                      backgroundColor: customFormat.trim() ? `${currentStyle.color}30` : `${currentStyle.color}10`,
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: customFormat.trim() ? currentStyle.color : `${currentStyle.color}30`,
                      color: customFormat.trim() ? currentStyle.textColor : `${currentStyle.color}50`,
                      cursor: customFormat.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    <IconPlus size={22} />
                  </button>
                </div>
              </div>

              {/* Selection Count */}
              <p className="text-center text-xl">
                <span style={{ color: totalSelected >= 4 ? currentStyle.textColor : "rgba(255,255,255,0.6)" }}>
                  {totalSelected}/4 selected
                </span>
                {totalSelected < 4 && (
                  <span className="text-white/40"> — need {4 - totalSelected} more</span>
                )}
                {totalSelected >= 4 && (
                  <span style={{ color: currentStyle.textColor }}> ✓</span>
                )}
              </p>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Topics Section */}
        <div className="space-y-6 text-center">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">
              Topics You Want To Cover
            </h3>
            <p className="text-lg text-white/50">
              Not sure yet? That's okay — just share what comes to mind
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {topics.map((topic, index) => (
              <div key={index} className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 font-bold text-xl">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  placeholder={
                    index === 0 ? "Your most popular topic or series idea" :
                    index === 1 ? "A topic you're excited to explore" :
                    "Another angle or theme you cover"
                  }
                  className="
                    w-full pl-14 pr-6 py-5 rounded-xl text-lg
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
      <div className="flex flex-col items-center gap-4 pt-12">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`
            inline-flex items-center gap-3 px-12 py-5 rounded-xl font-bold text-xl
            transition-all duration-200
            ${canContinue
              ? "bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)] hover:scale-105"
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
        
        {!canContinue && (
          <p className="text-base text-white/50">
            {niche.trim().length < 2 
              ? "Enter your niche to continue" 
              : contentStyle === null
                ? "Select your content style"
                : totalSelected < 4
                  ? `Select ${4 - totalSelected} more format${4 - totalSelected > 1 ? 's' : ''}`
                  : "Add at least one topic"
            }
          </p>
        )}

        <button
          onClick={handleBack}
          className="text-white/50 hover:text-white/70 text-base mt-2 transition-colors"
        >
          ← Back
        </button>
      </div>
    </OnboardingPageLayout>
  );
}
