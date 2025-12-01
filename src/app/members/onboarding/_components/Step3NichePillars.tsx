"use client";

import React, { useState } from "react";
import {
  IconBulb,
  IconSparkles,
  IconCheck,
  IconPlus,
  IconLoader2,
  IconAlertTriangle,
  IconTrendingUp,
} from "@tabler/icons-react";
import { HeroModule } from "@/components/layout/HeroModule";

interface Step3NichePillarsProps {
  onContinue: (data: Step3Data) => void;
  onBack: () => void;
  primaryMonetization?: string;
  secondaryGoals?: string[];
  monetizationDetails?: {
    productsDescription?: string;
    affiliateProducts?: string;
    sponsorshipNiche?: string;
  };
}

export interface Step3Data {
  niche: string;
  nicheScore: number;
  pillars: string[];
  nicheAnalysis?: AnalysisResult; // Full analysis for database storage
}

interface AnalysisResult {
  nicheScore: number;
  nicheAnalysis: string;
  nicheAdvice?: string; // Second paragraph with personalized advice
  suggestedNiche: string | null;
  suggestedNicheScore: number | null;
  relatedTopics: { topic: string; score: number }[];
}

const MIN_PILLARS = 3;
const MAX_PILLARS = 5;

export function Step3NichePillars({ onContinue, onBack, primaryMonetization, secondaryGoals, monetizationDetails }: Step3NichePillarsProps) {
  // Input state
  const [niche, setNiche] = useState("");
  // Start with 3 empty topic slots
  const [topicInputs, setTopicInputs] = useState<string[]>(["", "", ""]);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [customPillar, setCustomPillar] = useState("");

  // Phase: 'input' or 'results'
  const [phase, setPhase] = useState<"input" | "results">("input");

  // Get filled topics (non-empty)
  const filledTopics = topicInputs.filter(t => t.trim().length > 0);
  
  const canAnalyze = niche.trim().length >= 2;
  const canContinue = selectedPillars.length >= MIN_PILLARS;

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topicInputs];
    newTopics[index] = value;
    setTopicInputs(newTopics);
  };

  const handleAddTopicSlot = () => {
    if (topicInputs.length < 5) {
      setTopicInputs([...topicInputs, ""]);
    }
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/onboarding/analyze-niche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche.trim(),
          topics: filledTopics,
          primaryMonetization: primaryMonetization || "",
          secondaryGoals: secondaryGoals || [],
          monetizationDetails: monetizationDetails || {},
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setAnalysis(data);
      setPhase("results");
    } catch (error) {
      console.error("Analysis error:", error);
      // For now, use mock data if API fails
      setAnalysis({
        nicheScore: 6,
        nicheAnalysis: "Good potential with moderate search volume.",
        suggestedNiche: null,
        suggestedNicheScore: null,
        relatedTopics: [
          { topic: "Getting Started Guides", score: 8 },
          { topic: "Tool Comparisons", score: 8 },
          { topic: "Tips & Tricks", score: 7 },
          { topic: "Project Tutorials", score: 7 },
          { topic: "Industry News", score: 6 },
          { topic: "Case Studies", score: 6 },
          { topic: "Common Mistakes", score: 5 },
          { topic: "Expert Interviews", score: 5 },
        ],
      });
      setPhase("results");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipAnalysis = () => {
    // Skip to results with manual topics as pillars
    if (filledTopics.length >= MIN_PILLARS) {
      onContinue({
        niche: niche.trim(),
        nicheScore: 5, // Default score
        pillars: filledTopics.slice(0, MAX_PILLARS),
      });
    }
  };

  const togglePillar = (topic: string) => {
    setSelectedPillars((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic);
      }
      if (prev.length >= MAX_PILLARS) {
        return prev;
      }
      return [...prev, topic];
    });
  };

  const handleAddCustomPillar = () => {
    if (customPillar.trim() && selectedPillars.length < MAX_PILLARS) {
      setSelectedPillars([...selectedPillars, customPillar.trim()]);
      setCustomPillar("");
    }
  };

  const handleContinue = () => {
    if (canContinue && analysis) {
      onContinue({
        niche: niche.trim(),
        nicheScore: analysis.nicheScore,
        pillars: selectedPillars,
        nicheAnalysis: analysis, // Include full analysis for database
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "#2BD899"; // Green
    if (score >= 5) return "#F59E0B"; // Yellow/Orange
    return "#EF4444"; // Red
  };

  const getScoreBarWidth = (score: number) => `${score * 10}%`;

  // ============ INPUT PHASE ============
  if (phase === "input") {
    return (
      <div className="flex flex-col gap-10">
        {/* Hero Section */}
        <HeroModule
          icon={IconBulb}
          line1="Let's Define Your Content"
          line2="Niche & Pillars"
          description="Help us understand what your channel is all about so we can find the very best SuperTopics for you."
        />

        {/* Niche Input */}
        <div className="space-y-4 text-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              What's The Theme Of Your Channel?
            </h2>
            <p className="text-lg text-text-secondary">
              Describe your niche in a few words
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g., Vibe Coding, Personal Finance, DIY Crafts"
              className="
                w-full px-5 py-4 rounded-xl text-lg text-center
                bg-white/[0.08] border border-white/30
                text-white placeholder:text-white/40
                focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-1 focus:ring-[#7A5CFA]/30
                transition-all
              "
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Topics Section */}
        <div className="space-y-5 text-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              What Kind Of Topics Do You Cover?
            </h3>
            <p className="text-lg text-text-secondary">
              Add 2-3 word phrases describing your content angles
            </p>
          </div>

          {/* Topic Input Fields - 3 visible */}
          <div className="flex flex-col gap-3 max-w-md mx-auto">
            {topicInputs.map((topic, index) => (
              <input
                key={index}
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(index, e.target.value)}
                placeholder={`e.g., ${index === 0 ? "AI Tools" : index === 1 ? "Coding Tutorials" : "Tech Reviews"}`}
                className="
                  w-full px-4 py-3 rounded-xl text-base
                  bg-white/[0.08] border border-white/30
                  text-white placeholder:text-white/40
                  focus:outline-none focus:border-[#7A5CFA]/60 focus:ring-1 focus:ring-[#7A5CFA]/30
                  transition-all
                "
              />
            ))}
          </div>
        </div>

        {/* Action Button - styled like Expand Topic */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            className={`
              px-14 py-6 rounded-2xl font-bold text-2xl transition-all flex items-center gap-3
              ${canAnalyze && !isAnalyzing
                ? "bg-gradient-to-r from-[#7C3AED] via-[#4F46E5] to-[#0891B2] hover:from-[#8B5CF6] hover:via-[#6366F1] hover:to-[#06B6D4] text-white shadow-[0_0_35px_rgba(124,58,237,0.5)] hover:shadow-[0_0_45px_rgba(124,58,237,0.7)] cursor-pointer"
                : "bg-white/10 text-white/40 cursor-not-allowed shadow-none"
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <IconLoader2 size={28} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <IconSparkles size={28} />
                Discover Opportunities
              </>
            )}
          </button>

          {filledTopics.length >= MIN_PILLARS && (
            <button
              onClick={handleSkipAnalysis}
              className="text-white/50 hover:text-white/70 underline underline-offset-4"
            >
              Skip, I know my topics →
            </button>
          )}

          <button
            onClick={onBack}
            className="text-white/50 hover:text-white/70 text-base"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ============ RESULTS PHASE ============
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <HeroModule
        icon={IconTrendingUp}
        line1="Your Niche"
        line2="Analysis"
        description="Based on viewer interest, here's what we found."
      />

      {/* Niche Score */}
      {analysis && (
        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white/70">Your Niche</h3>
              <p className="text-2xl font-bold text-white mt-1">"{niche}"</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/50">Estimated Demand</p>
              <p
                className="text-3xl font-bold"
                style={{ color: getScoreColor(analysis.nicheScore) }}
              >
                {analysis.nicheScore}/10
              </p>
            </div>
          </div>

          {/* Score Bar */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: getScoreBarWidth(analysis.nicheScore),
                backgroundColor: getScoreColor(analysis.nicheScore),
              }}
            />
          </div>

          {/* Analysis Text - Two paragraphs */}
          <div className="mt-4 space-y-3">
            <p className="text-white/80 text-base leading-relaxed">{analysis.nicheAnalysis}</p>
            {analysis.nicheAdvice && (
              <p className="text-white/70 text-base leading-relaxed">{analysis.nicheAdvice}</p>
            )}
          </div>

          {/* Suggested Alternative (if low score) */}
          {analysis.suggestedNiche && analysis.nicheScore < 5 && (
            <div className="mt-4 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl">
              <div className="flex items-start gap-3">
                <IconAlertTriangle size={20} className="text-[#F59E0B] mt-0.5" />
                <div>
                  <p className="text-white font-medium">
                    Consider: "{analysis.suggestedNiche}"
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    Similar content, but {analysis.suggestedNicheScore}/10 demand
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Topics */}
      {analysis && (
        <div className="space-y-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              Related Topics You Could Cover
            </h3>
            <span className="text-white/60 text-sm">
              {selectedPillars.length}/{MAX_PILLARS} selected
            </span>
          </div>

          <p className="text-white/60 text-base">
            Select {MIN_PILLARS}-{MAX_PILLARS} topics to focus on. These become your content pillars.
          </p>

          {/* Topic List with Bar Chart */}
          <div className="space-y-3">
            {analysis.relatedTopics.map((item, index) => {
              const isSelected = selectedPillars.includes(item.topic);
              const isDisabled = !isSelected && selectedPillars.length >= MAX_PILLARS;

              return (
                <button
                  key={index}
                  onClick={() => togglePillar(item.topic)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left
                    ${isSelected
                      ? "bg-[#2BD899]/10 border-2 border-[#2BD899]/50"
                      : isDisabled
                        ? "bg-black/20 border border-white/5 opacity-50 cursor-not-allowed"
                        : "bg-black/30 border border-white/10 hover:border-white/20"
                    }
                  `}
                >
                  {/* Checkbox - brighter borders */}
                  <div
                    className={`
                      w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all
                      ${isSelected
                        ? "bg-[#2BD899] text-[#0B1220]"
                        : "border-2 border-white/50"
                      }
                    `}
                  >
                    {isSelected && <IconCheck size={16} stroke={3} />}
                  </div>

                  {/* Topic & Bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${isSelected ? "text-white" : "text-white/90"}`}>
                        {item.topic}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: getScoreColor(item.score) }}
                      >
                        {item.score}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: getScoreBarWidth(item.score),
                          backgroundColor: getScoreColor(item.score),
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add Custom Pillar */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={customPillar}
                onChange={(e) => setCustomPillar(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomPillar()}
                placeholder="+ Add your own topic..."
                disabled={selectedPillars.length >= MAX_PILLARS}
                className="
                  flex-1 px-4 py-3 rounded-xl
                  bg-black/20 border border-white/10
                  text-white placeholder:text-white/30
                  focus:outline-none focus:border-white/20
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all
                "
              />
              <button
                onClick={handleAddCustomPillar}
                disabled={!customPillar.trim() || selectedPillars.length >= MAX_PILLARS}
                className="
                  px-4 py-3 rounded-xl
                  bg-white/10 text-white/80
                  hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all
                "
              >
                <IconPlus size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`
            inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-lg
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
            Select at least {MIN_PILLARS} topics to continue
          </p>
        )}

        <button
          onClick={() => setPhase("input")}
          className="text-white/40 hover:text-white/60 text-sm mt-2"
        >
          ← Back to edit niche
        </button>
      </div>
    </div>
  );
}
