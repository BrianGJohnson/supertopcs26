"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    IconTrophy,
    IconLoader2,
    IconCheck,
    IconArrowRight,
    IconArrowUp,
    IconMoodSmile,
    IconChevronDown,
    IconSparkles,
    IconRefresh,
    IconFlask,
    IconSearch,
    IconScale,
    IconRocket,
} from "@tabler/icons-react";

// =============================================================================
// TYPES
// =============================================================================

interface TitleOption {
    title: string;
    characters: number;
    thumbnailPhrases: string[];
    angle: string;
}

interface TitleData {
    winner: TitleOption;
    runnerUps: TitleOption[];
    alternatives: TitleOption[];
}

type OptimizationMode = "search" | "balanced" | "browse";

type EmotionType =
    | "Curiosity"
    | "Hope"
    | "Fear"
    | "Frustration"
    | "FOMO"
    | "Validation"
    | "Excitement"
    | "Relief";

// Emotion → Color mapping for thumbnail background
const EMOTION_GRADIENTS: Record<EmotionType, { from: string; to: string; accent: string }> = {
    Curiosity: { from: "#1e3a5f", to: "#0a1929", accent: "#60a5fa" },
    Hope: { from: "#1a4d2e", to: "#0d2818", accent: "#4ade80" },
    Fear: { from: "#5f1e1e", to: "#290a0a", accent: "#f87171" },
    Frustration: { from: "#5f3d1e", to: "#291a0a", accent: "#fb923c" },
    FOMO: { from: "#3d1e5f", to: "#1a0a29", accent: "#c084fc" },
    Validation: { from: "#5f4d1e", to: "#29210a", accent: "#fbbf24" },
    Excitement: { from: "#5f1e4d", to: "#290a21", accent: "#f472b6" },
    Relief: { from: "#1e5f5f", to: "#0a2929", accent: "#2dd4bf" },
};

const OPTIMIZATION_MODES = {
    search: { label: "Search", icon: IconSearch, color: "#39C7D8" },
    balanced: { label: "Balanced", icon: IconScale, color: "#FFD700" },
    browse: { label: "Browse", icon: IconRocket, color: "#7A5CFA" },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TitlePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");
    const topicId = searchParams.get("topic_id");

    // Data state  
    const [phrase, setPhrase] = useState("");
    const [primaryEmotion, setPrimaryEmotion] = useState<EmotionType>("Curiosity");
    const [secondaryEmotion, setSecondaryEmotion] = useState<string>("Hope");

    // Title state
    const [titles, setTitles] = useState<TitleData | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<TitleOption | null>(null);
    const [showAlternatives, setShowAlternatives] = useState(false);

    // Phrase state
    const [topPicks, setTopPicks] = useState<string[]>([]); // Best 12
    const [wildCards, setWildCards] = useState<string[]>([]); // Mad scientist phrases
    const [phrasePageIndex, setPhrasePageIndex] = useState(0); // 0, 1, 2 for pages of 4
    const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
    const [isGeneratingPhrases, setIsGeneratingPhrases] = useState(false);
    const [showWildCards, setShowWildCards] = useState(false);

    // Optimization mode dropdown
    const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>("balanced");
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get current 4 phrases to display
    const currentPhrases = topPicks.slice(phrasePageIndex * 4, (phrasePageIndex + 1) * 4);
    const totalPages = Math.ceil(topPicks.length / 4);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowModeDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ==========================================================================
    // LOAD DATA
    // ==========================================================================

    const loadTopicAndGenerateTitles = useCallback(async () => {
        if (!topicId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const topicResponse = await fetch(`/api/super-topics/get?id=${topicId}`);
            if (!topicResponse.ok) throw new Error("Failed to load topic data");

            const topicData = await topicResponse.json();
            const topic = topicData.topic;

            setPhrase(topic.phrase || "");
            setPrimaryEmotion((topic.primary_emotion as EmotionType) || "Curiosity");
            setSecondaryEmotion(topic.secondary_emotion || "Hope");

            // Check if titles already exist
            if (topic.title_options) {
                setTitles(topic.title_options);
                setSelectedTitle(topic.title_options.winner);
                setIsLoading(false);
                return;
            }

            // Generate titles
            setIsGeneratingTitles(true);

            const generateResponse = await fetch("/api/titles/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    superTopicId: topicId,
                    selectedFormats: topic.selected_formats || [],
                }),
            });

            if (!generateResponse.ok) {
                const errorData = await generateResponse.json();
                throw new Error(errorData.error || "Failed to generate titles");
            }

            const result = await generateResponse.json();
            setTitles(result.titles);
            setSelectedTitle(result.titles.winner);

            console.log(`[Title Page] Generated titles in ${result.stats.durationMs}ms (${result.stats.costCents}¢)`);
        } catch (err) {
            console.error("[Title Page] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setIsLoading(false);
            setIsGeneratingTitles(false);
        }
    }, [topicId]);

    useEffect(() => {
        loadTopicAndGenerateTitles();
    }, [loadTopicAndGenerateTitles]);

    // ==========================================================================
    // HANDLERS
    // ==========================================================================

    const handleTitleSelect = (title: TitleOption) => {
        setSelectedTitle(title);
        // Clear phrases when switching titles
        setTopPicks([]);
        setWildCards([]);
        setSelectedPhrase(null);
        setPhrasePageIndex(0);
        setShowWildCards(false);
    };

    const handleSwapToTop = (title: TitleOption) => {
        if (!titles) return;

        const newRunnerUps = [
            titles.winner,
            ...titles.runnerUps.filter(t => t.title !== title.title)
        ].slice(0, 3);

        setTitles({
            ...titles,
            winner: title,
            runnerUps: newRunnerUps,
        });
        setSelectedTitle(title);
        setTopPicks([]);
        setWildCards([]);
        setSelectedPhrase(null);
        setPhrasePageIndex(0);
        setShowWildCards(false);
    };

    const handleGeneratePhrases = async () => {
        if (!selectedTitle || !topicId || isGeneratingPhrases) return;

        setIsGeneratingPhrases(true);
        setTopPicks([]);
        setWildCards([]);
        setSelectedPhrase(null);
        setPhrasePageIndex(0);
        setShowWildCards(false);

        try {
            const response = await fetch("/api/titles/thumbnail-phrases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    superTopicId: topicId,
                    title: selectedTitle.title,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`[Title Page] Generated ${result.topPicks?.length || 0} top picks, ${result.wildCards?.length || 0} wild cards in ${result.stats.durationMs}ms (${result.stats.costCents}¢)`);
                setTopPicks(result.topPicks || []);
                setWildCards(result.wildCards || []);
                // Auto-select first phrase
                if (result.topPicks?.length > 0) {
                    setSelectedPhrase(result.topPicks[0]);
                }
            }
        } catch (err) {
            console.error("[Title Page] Phrase generation error:", err);
        } finally {
            setIsGeneratingPhrases(false);
        }
    };

    const handleRefreshPhrases = () => {
        // Cycle to next page of 4 (free!)
        const nextPage = (phrasePageIndex + 1) % totalPages;
        setPhrasePageIndex(nextPage);
        // Auto-select first phrase on new page
        const firstOnPage = topPicks[nextPage * 4];
        if (firstOnPage) {
            setSelectedPhrase(firstOnPage);
        }
    };

    const handleLockAndContinue = async () => {
        if (!selectedTitle || !topicId) return;

        try {
            await fetch("/api/titles/lock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    superTopicId: topicId,
                    lockedTitle: selectedTitle.title,
                    thumbnailPhrases: selectedPhrase ? [selectedPhrase] : [],
                }),
            });

            router.push(`/members/build/package?session_id=${sessionId}&topic_id=${topicId}`);
        } catch (err) {
            console.error("[Title Page] Lock error:", err);
        }
    };

    // ==========================================================================
    // LOADING/ERROR STATES
    // ==========================================================================

    if (!topicId) {
        return (
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-white/60 text-lg">No topic selected.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-12 text-center">
                <p className="text-red-400 text-lg">Something went wrong</p>
                <p className="text-white/50 text-sm mt-2">{error}</p>
                <button
                    onClick={loadTopicAndGenerateTitles}
                    className="mt-6 px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (isLoading || (isGeneratingTitles && !titles)) {
        return (
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
                <div className="flex flex-col items-center gap-6">
                    <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
                    <div>
                        <p className="text-white/80 text-xl font-medium">
                            {isGeneratingTitles ? "Creating Killer Titles..." : "Loading..."}
                        </p>
                        {isGeneratingTitles && (
                            <p className="text-white/50 text-base mt-2">
                                Generating 15 CTR-optimized titles
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!titles || !selectedTitle) {
        return (
            <div className="bg-surface/40 border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-white/60 text-lg">No titles generated yet.</p>
            </div>
        );
    }

    // Get colors for thumbnail based on emotion
    const emotionColors = EMOTION_GRADIENTS[primaryEmotion] || EMOTION_GRADIENTS.Curiosity;
    const charColor =
        selectedTitle.characters <= 52
            ? "bg-[#2BD899]/20 text-[#2BD899] border-[#2BD899]/30"
            : selectedTitle.characters <= 60
                ? "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30"
                : "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30";

    const currentMode = OPTIMIZATION_MODES[optimizationMode];
    const ModeIcon = currentMode.icon;

    // UNIFIED BUTTON STYLE - Gold/amber glowing glass (from Page 3 ActionToolbar)
    // Dark bg with amber glow border - same height across all buttons
    const primaryButtonStyle = "h-[52px] min-w-[160px] flex items-center justify-center gap-2 px-6 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/25 hover:border-[#F59E0B]/60";

    // ==========================================================================
    // MAIN RENDER
    // ==========================================================================

    return (
        <div className="space-y-10 max-w-5xl mx-auto">
            {/* ================================================================ */}
            {/* TOP PICK BADGE */}
            {/* ================================================================ */}
            <div className="flex justify-center">
                <div className="flex items-center gap-2 px-5 py-2 rounded-full shadow-lg bg-[#FFD700]">
                    <IconTrophy className="w-5 h-5 text-[#1a1a1a]" />
                    <span className="text-base font-bold text-[#1a1a1a]">Top Pick</span>
                </div>
            </div>

            {/* ================================================================ */}
            {/* THUMBNAIL PREVIEW - Dark glass with glowing emotion border */}
            {/* ================================================================ */}
            <div className="flex flex-col items-center">
                <div
                    className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        // Dark glass background with emotion tint
                        background: `linear-gradient(135deg, ${emotionColors.from}40 0%, #0a0a0f 50%, ${emotionColors.to}30 100%)`,
                        // Glowing emotion-colored border (like the buttons)
                        border: `2px solid ${emotionColors.accent}60`,
                        boxShadow: `0 0 30px ${emotionColors.accent}20, inset 0 0 60px ${emotionColors.accent}10`,
                    }}
                >
                    {/* Subtle inner glow overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at top left, ${emotionColors.accent}15 0%, transparent 50%)`,
                        }}
                    ></div>


                    {/* Upper Left: Emotions + Phrase Stack */}
                    <div className="absolute top-5 left-5 z-10 flex flex-col gap-3">
                        {/* Emotion Display */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
                            <IconMoodSmile className="w-5 h-5 text-[#FF6B6B]" />
                            <span className="text-base font-medium text-white">{primaryEmotion}</span>
                            <span className="text-white/50">•</span>
                            <span className="text-base font-medium text-white">{secondaryEmotion}</span>
                        </div>

                        {/* Selected Phrase */}
                        {selectedPhrase && (
                            <div
                                className="px-5 py-3 rounded-lg text-2xl font-black tracking-tight"
                                style={{
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    color: emotionColors.accent,
                                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                                }}
                            >
                                {selectedPhrase}
                            </div>
                        )}
                    </div>

                    {/* Empty state hint */}
                    {!selectedPhrase && topPicks.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-white/40 text-lg">Generate phrases to preview</p>
                        </div>
                    )}
                </div>

                {/* Title Below Thumbnail */}
                <div className="mt-6 text-center max-w-3xl">
                    <h2 className="text-2xl font-bold text-white leading-tight">
                        {selectedTitle.title}
                    </h2>
                    <div className="flex items-center justify-center gap-3 mt-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded border ${charColor}`}>
                            {selectedTitle.characters} chars
                        </span>
                    </div>
                </div>
            </div>

            {/* ================================================================ */}
            {/* PHRASE PILLS ROW - Shows 4 at a time */}
            {/* ================================================================ */}
            {currentPhrases.length > 0 && (
                <div className="flex justify-center gap-3">
                    {currentPhrases.map((p, idx) => {
                        const isActive = selectedPhrase === p;
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedPhrase(p)}
                                className={`relative px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${isActive
                                    ? "bg-[#2BD899]/20 border-2 border-[#2BD899] text-[#2BD899]"
                                    : "bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                                    }`}
                            >
                                {p}
                                {isActive && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2BD899] rounded-full flex items-center justify-center">
                                        <IconCheck className="w-3 h-3 text-black" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ================================================================ */}
            {/* ACTION BUTTONS ROW - All same glassy style */}
            {/* ================================================================ */}
            <div className="flex items-center justify-center gap-3">
                {/* Optimization Mode Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowModeDropdown(!showModeDropdown)}
                        className={primaryButtonStyle}
                    >
                        <ModeIcon className="w-5 h-5" style={{ color: currentMode.color }} />
                        <span>{currentMode.label}</span>
                        <IconChevronDown className={`w-4 h-4 transition-transform ${showModeDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showModeDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/20 rounded-xl shadow-xl overflow-hidden z-20">
                            {(Object.entries(OPTIMIZATION_MODES) as [OptimizationMode, typeof OPTIMIZATION_MODES.balanced][]).map(([key, mode]) => {
                                const Icon = mode.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setOptimizationMode(key);
                                            setShowModeDropdown(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/10 ${optimizationMode === key ? "bg-white/5" : ""
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: mode.color }} />
                                        <span className="text-white/80">{mode.label}</span>
                                        {optimizationMode === key && (
                                            <IconCheck className="w-4 h-4 ml-auto text-[#2BD899]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Generate Phrases Button */}
                <button
                    onClick={handleGeneratePhrases}
                    disabled={isGeneratingPhrases}
                    className={primaryButtonStyle}
                >
                    {isGeneratingPhrases ? (
                        <>
                            <IconLoader2 className="w-5 h-5 animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <IconSparkles className="w-5 h-5 text-[#FFD700]" />
                            <span>Generate Phrases</span>
                        </>
                    )}
                </button>

                {/* Refresh Button (cycles through 12, FREE) */}
                {topPicks.length > 4 && (
                    <button
                        onClick={handleRefreshPhrases}
                        className={primaryButtonStyle}
                        title={`Page ${phrasePageIndex + 1} of ${totalPages}`}
                    >
                        <IconRefresh className="w-5 h-5" />
                        <span>Refresh</span>
                    </button>
                )}

                {/* Mad Scientist Button (shows wild cards) */}
                {wildCards.length > 0 && (
                    <button
                        onClick={() => setShowWildCards(!showWildCards)}
                        className={primaryButtonStyle}
                    >
                        <IconFlask className="w-5 h-5 text-[#7A5CFA]" />
                        <span>Mad Scientist</span>
                    </button>
                )}

                {/* Lock & Continue Button */}
                <button
                    onClick={handleLockAndContinue}
                    className={primaryButtonStyle}
                >
                    <IconCheck className="w-5 h-5" />
                    <span>Lock & Continue</span>
                    <IconArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* ================================================================ */}
            {/* MAD SCIENTIST WILD CARDS (collapsed by default) */}
            {/* ================================================================ */}
            {showWildCards && wildCards.length > 0 && (
                <div className="bg-[#7A5CFA]/10 border border-[#7A5CFA]/30 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <IconFlask className="w-5 h-5 text-[#7A5CFA]" />
                        <h3 className="text-lg font-semibold text-[#7A5CFA]">Mad Scientist Results</h3>
                        <span className="text-sm text-white/50">({wildCards.length} phrases)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {wildCards.map((p, idx) => {
                            const isActive = selectedPhrase === p;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedPhrase(p)}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${isActive
                                        ? "bg-[#7A5CFA]/30 border border-[#7A5CFA] text-[#7A5CFA]"
                                        : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* RUNNER-UPS */}
            {/* ================================================================ */}
            <div className="space-y-5">
                <h3 className="text-xl font-semibold text-white/70">Runner-Ups (Different Hooks)</h3>
                <div className="grid grid-cols-3 gap-4">
                    {titles.runnerUps.map((title, idx) => (
                        <div
                            key={idx}
                            className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/30 hover:bg-white/[0.06] transition-all cursor-pointer"
                            onClick={() => handleTitleSelect(title)}
                        >
                            <p className="text-base font-semibold text-white/90 mb-3 line-clamp-2">
                                {title.title}
                            </p>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded border ${title.characters <= 52
                                    ? "bg-[#2BD899]/20 text-[#2BD899] border-[#2BD899]/30"
                                    : title.characters <= 60
                                        ? "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30"
                                        : "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30"
                                    }`}>
                                    {title.characters} chars
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwapToTop(title);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
                            >
                                <IconArrowUp className="w-4 h-4" />
                                Swap to Top
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ================================================================ */}
            {/* ALTERNATIVES - Collapsible */}
            {/* ================================================================ */}
            {titles.alternatives.length > 0 && (
                <div className="space-y-4">
                    <button
                        onClick={() => setShowAlternatives(!showAlternatives)}
                        className="text-lg font-semibold text-white/50 hover:text-white/70 transition-colors"
                    >
                        {showAlternatives ? "Hide" : "Show"} {titles.alternatives.length} Alternatives ↓
                    </button>

                    {showAlternatives && (
                        <div className="grid grid-cols-2 gap-3">
                            {titles.alternatives.map((title, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSwapToTop(title)}
                                    className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                                >
                                    <p className="text-sm font-semibold text-white/80 mb-2">
                                        {title.title}
                                    </p>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${title.characters <= 52
                                        ? "bg-[#2BD899]/20 text-[#2BD899] border-[#2BD899]/30"
                                        : title.characters <= 60
                                            ? "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30"
                                            : "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30"
                                        }`}>
                                        {title.characters} chars
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
