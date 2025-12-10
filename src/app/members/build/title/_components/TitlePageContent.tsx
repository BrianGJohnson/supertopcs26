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
    IconBrandYoutube,
    IconFlame,
    IconX,
} from "@tabler/icons-react";

// =============================================================================
// TYPES
// =============================================================================

interface TitleOption {
    title: string;
    characters: number;
    thumbnailPhrases: string[];
    angle: string;
    hookType?: "curiosity" | "fomo" | "fear" | "excitement" | "hope" | "validation" | "wild";
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
    browse: { label: "Recommendations", icon: IconRocket, color: "#7A5CFA" },
};

// Hook type styling for title cards
const HOOK_TYPE_STYLES: Record<string, { label: string; color: string; bgColor: string }> = {
    curiosity: { label: "Curiosity", color: "#60a5fa", bgColor: "bg-[#60a5fa]/15 border-[#60a5fa]/30" },
    fomo: { label: "FOMO", color: "#c084fc", bgColor: "bg-[#c084fc]/15 border-[#c084fc]/30" },
    fear: { label: "Fear", color: "#f87171", bgColor: "bg-[#f87171]/15 border-[#f87171]/30" },
    excitement: { label: "Excitement", color: "#f472b6", bgColor: "bg-[#f472b6]/15 border-[#f472b6]/30" },
    hope: { label: "Hope", color: "#4ade80", bgColor: "bg-[#4ade80]/15 border-[#4ade80]/30" },
    validation: { label: "Validation", color: "#fbbf24", bgColor: "bg-[#fbbf24]/15 border-[#fbbf24]/30" },
    wild: { label: "Wild", color: "#2dd4bf", bgColor: "bg-[#2dd4bf]/15 border-[#2dd4bf]/30" },
};

// Map hookType to EmotionType for updating thumbnail colors
const HOOK_TO_EMOTION: Record<string, EmotionType> = {
    curiosity: "Curiosity",
    fomo: "FOMO",
    fear: "Fear",
    excitement: "Excitement",
    hope: "Hope",
    validation: "Validation",
    wild: "Curiosity", // Wild card defaults to Curiosity
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

    // Phrase state - Two-row system
    const [topPicks, setTopPicks] = useState<string[]>([]); // All phrases from generation
    const [wildCards, setWildCards] = useState<string[]>([]); // Wild phrases (kept for potential future use)
    const [contenders, setContenders] = useState<string[]>([]); // Top row: shortlisted phrases (up to 4)
    const [lockedPhrases, setLockedPhrases] = useState<Set<string>>(new Set()); // Green/committed phrases
    const [dismissedPhrases, setDismissedPhrases] = useState<Set<string>>(new Set()); // Hidden/dismissed phrases
    const [optionsPageIndex, setOptionsPageIndex] = useState(0); // Current page of Options row
    const [isGeneratingPhrases, setIsGeneratingPhrases] = useState(false);
    const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false); // Gate for Generate button
    const [highestSeenPage, setHighestSeenPage] = useState(0); // Track how many pages user has seen

    // Optimization mode dropdown
    const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>("balanced");
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived state for Options row - unified flow: topPicks first, then wildCards
    // Filter out contenders and dismissed phrases
    const filteredTopPicks = topPicks.filter(p => !contenders.includes(p) && !dismissedPhrases.has(p));
    const filteredWildCards = wildCards.filter(p => !contenders.includes(p) && !dismissedPhrases.has(p));

    // Calculate pages for each zone
    const topPicksPages = Math.ceil(filteredTopPicks.length / 4);
    const wildCardsPages = Math.ceil(filteredWildCards.length / 4);
    const totalPages = topPicksPages + wildCardsPages;

    // Determine if we're in wild mode (past all regular pages)
    const isInWildMode = optionsPageIndex >= topPicksPages && topPicksPages > 0;

    // Get current options based on mode
    const currentOptions = isInWildMode
        ? filteredWildCards.slice((optionsPageIndex - topPicksPages) * 4, (optionsPageIndex - topPicksPages + 1) * 4)
        : filteredTopPicks.slice(optionsPageIndex * 4, (optionsPageIndex + 1) * 4);

    const currentOptionsPage = optionsPageIndex;
    const totalOptionsPages = totalPages > 0 ? totalPages : 1;

    // Can regenerate when all pages (regular + wild) have been seen
    const allPagesSeen = highestSeenPage >= totalPages - 1;
    const canRegenerate = allPagesSeen || !hasGeneratedOnce;

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
        // Update emotion if the title has a hookType
        if (title.hookType && HOOK_TO_EMOTION[title.hookType]) {
            setPrimaryEmotion(HOOK_TO_EMOTION[title.hookType]);
        }
        // Clear phrases when switching titles
        setTopPicks([]);
        setWildCards([]);
        setContenders([]);
        setLockedPhrases(new Set());
        setOptionsPageIndex(0);
        setHasGeneratedOnce(false);
        setHighestSeenPage(0);
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
        // Update emotion if the title has a hookType
        if (title.hookType && HOOK_TO_EMOTION[title.hookType]) {
            setPrimaryEmotion(HOOK_TO_EMOTION[title.hookType]);
        }
        setTopPicks([]);
        setWildCards([]);
        setContenders([]);
        setLockedPhrases(new Set());
        setOptionsPageIndex(0);
        setHasGeneratedOnce(false);
        setHighestSeenPage(0);
    };

    const handleGeneratePhrases = async () => {
        if (!selectedTitle || !topicId || isGeneratingPhrases) return;

        setIsGeneratingPhrases(true);
        setTopPicks([]);
        setWildCards([]);
        setContenders([]);
        setLockedPhrases(new Set());
        setOptionsPageIndex(0);
        setHighestSeenPage(0);

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
                setHasGeneratedOnce(true);
                // Auto-add first phrase to contenders and lock it
                if (result.topPicks?.length > 0) {
                    const firstPhrase = result.topPicks[0];
                    setContenders([firstPhrase]);
                    setLockedPhrases(new Set([firstPhrase]));
                }
            }
        } catch (err) {
            console.error("[Title Page] Phrase generation error:", err);
        } finally {
            setIsGeneratingPhrases(false);
        }
    };

    // Handle clicking a phrase in Options row → add to Contenders
    const handleAddToContenders = (phrase: string) => {
        if (contenders.includes(phrase)) return; // Already in contenders
        if (contenders.length >= 4) return; // Max 4 contenders
        setContenders(prev => [...prev, phrase]);
    };

    // Handle clicking a Contender → toggle lock state
    const handleToggleLock = (phrase: string) => {
        setLockedPhrases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(phrase)) {
                newSet.delete(phrase);
            } else {
                // In essential mode, only 1 can be locked - clear others first
                // TODO: Check display mode and adjust behavior
                newSet.clear();
                newSet.add(phrase);
            }
            return newSet;
        });
    };

    // Handle removing a contender (goes back to options)
    const handleRemoveContender = (phrase: string) => {
        setContenders(prev => prev.filter(p => p !== phrase));
        setLockedPhrases(prev => {
            const newSet = new Set(prev);
            newSet.delete(phrase);
            return newSet;
        });
    };

    // Handle dismissing a phrase from Options (hidden permanently)
    const handleDismissPhrase = (phrase: string) => {
        setDismissedPhrases(prev => {
            const newSet = new Set(prev);
            newSet.add(phrase);
            return newSet;
        });
    };

    // Refresh cycles through options
    const handleRefreshOptions = () => {
        const nextPage = (optionsPageIndex + 1) % totalOptionsPages;
        setOptionsPageIndex(nextPage);
        // Track highest seen page for Generate button gating
        if (nextPage > highestSeenPage) {
            setHighestSeenPage(nextPage);
        }
    };

    const handleLockAndContinue = async () => {
        if (!selectedTitle || !topicId) return;
        if (lockedPhrases.size === 0) return; // Must have at least 1 locked phrase

        try {
            await fetch("/api/titles/lock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    superTopicId: topicId,
                    lockedTitle: selectedTitle.title,
                    thumbnailPhrases: Array.from(lockedPhrases),
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
                        <p className="text-white/75 text-xl font-medium">
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

    // BUTTON STYLES - Following /button-styling guide

    // UNIFIED BUTTON SIZE: All buttons 180px wide for perfect symmetry
    const buttonSize = "h-[52px] w-[180px]";

    // YouTube-red glass-card style for Target dropdown
    const neutralButtonStyle = `${buttonSize} flex items-center justify-center gap-2 px-4 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-gradient-to-b from-[#FF0000]/15 to-[#CC0000]/15 hover:from-[#FF0000]/20 hover:to-[#CC0000]/20 text-white/75 border-2 border-[#FF0000]/30 shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_12px_rgba(255,0,0,0.15)]`;

    // Orange style for generation actions (Generate Phrases, Refresh)
    const actionButtonStyle = `${buttonSize} flex items-center justify-center gap-2 px-4 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-[#F59E0B]/15 border-2 border-[#F59E0B]/30 text-[#EAB308] hover:bg-[#F59E0B]/25 hover:border-[#F59E0B]/50`;

    // Green style for primary CTA (Lock & Continue)
    const ctaButtonStyle = `${buttonSize} flex items-center justify-center gap-2 px-4 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] border-2 border-[#2BD899]/30 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]`;

    // Green CTA disabled state
    const ctaDisabledStyle = `${buttonSize} flex items-center justify-center gap-2 px-4 rounded-xl text-base font-semibold whitespace-nowrap bg-[#2BD899]/10 border-2 border-[#2BD899]/20 text-[#4AE8B0]/50 cursor-not-allowed`;

    // Disabled style for inactive action buttons
    const disabledButtonStyle = `${buttonSize} flex items-center justify-center gap-2 px-4 rounded-xl text-base font-semibold whitespace-nowrap bg-white/5 border-2 border-white/10 text-white/30 cursor-not-allowed`;

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
                        opacity: 0.65,
                        // Brighter edges with subtle dark center vignette
                        background: `radial-gradient(ellipse at center, #0a0a0f 0%, ${emotionColors.from}80 80%, ${emotionColors.from} 100%)`,
                        // Bright glowing emotion-colored border
                        border: `2px solid ${emotionColors.accent}`,
                        boxShadow: `0 0 40px ${emotionColors.accent}40, 0 0 80px ${emotionColors.accent}20, inset 0 0 80px ${emotionColors.accent}25`,
                    }}
                >
                    {/* Brighter corner glows */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `
                                radial-gradient(ellipse at top left, ${emotionColors.accent}35 0%, transparent 50%),
                                radial-gradient(ellipse at bottom right, ${emotionColors.accent}25 0%, transparent 50%)
                            `,
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

                        {/* First Locked Phrase */}
                        {lockedPhrases.size > 0 && (
                            <div
                                className="px-5 py-3 rounded-lg text-2xl font-black tracking-tight"
                                style={{
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    color: emotionColors.accent,
                                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                                }}
                            >
                                {Array.from(lockedPhrases)[0]}
                            </div>
                        )}
                    </div>

                    {/* Empty state hint */}
                    {lockedPhrases.size === 0 && topPicks.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-white/40 text-lg">Generate phrases to preview</p>
                        </div>
                    )}
                </div>

                {/* Title Below Thumbnail */}
                <div className="mt-10 text-center max-w-3xl space-y-3">
                    {/* Super Topic / Keyword Phrase - subtle hierarchy */}
                    {phrase && (
                        <p className="text-[23px] font-semibold text-white/75">
                            <span className="text-white/60">Super Topic:</span>{" "}
                            {phrase.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                        </p>
                    )}
                    <div className="flex items-center justify-center gap-3">
                        <p className="text-2xl font-bold text-white/75 leading-tight">
                            <span className="text-white/60">Title:</span>{" "}
                            {selectedTitle.title}
                        </p>
                        <span className={`px-3 py-1 text-sm font-medium rounded border ${charColor}`}>
                            {selectedTitle.characters} chars
                        </span>
                    </div>
                </div>
            </div>

            {/* SEPARATOR 1 */}
            <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />


            {/* ================================================================ */}
            {/* PHRASE SELECTION - Two Row System */}
            {/* ================================================================ */}

            {/* CONTENDERS ROW - Top row: shortlisted phrases (up to 4) */}
            {(contenders.length > 0 || topPicks.length > 0) && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider text-center">Contenders</h3>
                    <div className="flex justify-center gap-3">
                        {/* Show existing contenders - locked ones first (on left) */}
                        {[...contenders].sort((a, b) => {
                            const aLocked = lockedPhrases.has(a);
                            const bLocked = lockedPhrases.has(b);
                            if (aLocked && !bLocked) return -1;
                            if (!aLocked && bLocked) return 1;
                            return 0;
                        }).map((phrase, idx) => {
                            const isLocked = lockedPhrases.has(phrase);
                            return (
                                <div key={idx} className="relative group">
                                    <button
                                        onClick={() => handleToggleLock(phrase)}
                                        className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${isLocked
                                            ? "bg-[#2BD899]/20 border-2 border-[#2BD899]/50 text-[#2BD899] shadow-[0_0_15px_rgba(43,216,153,0.2)]"
                                            : "bg-white/10 border-2 border-white/30 text-white/75 hover:bg-white/20 hover:border-white/50"
                                            }`}
                                    >
                                        {phrase}
                                        {isLocked && (
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2BD899] rounded-full flex items-center justify-center">
                                                <IconCheck className="w-3 h-3 text-black" />
                                            </span>
                                        )}
                                    </button>
                                    {/* Remove button on hover */}
                                    <button
                                        onClick={() => handleRemoveContender(phrase)}
                                        className="absolute -top-2 -left-2 w-5 h-5 bg-red-500/80 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                                    >
                                        <IconX className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                        {/* Empty slots for remaining capacity */}
                        {contenders.length < 4 && topPicks.length > 0 && (
                            <div className="px-5 py-3 rounded-xl border-2 border-dashed border-white/20 text-white/30 text-sm font-medium">
                                + Add from options
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* OPTIONS ROW - Bottom row: browse and pick */}
            {currentOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                        {isInWildMode && <IconFlask className="w-4 h-4 text-[#7A5CFA]/70" />}
                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${isInWildMode ? "text-[#7A5CFA]/70" : "text-white/50"}`}>
                            {isInWildMode ? "Wild Options" : "Options"}
                        </h3>
                        <span className="text-xs text-white/30">
                            {currentOptionsPage + 1} of {totalOptionsPages}
                        </span>
                    </div>
                    <div className="flex justify-center gap-3">
                        {currentOptions
                            .map((phrase, idx) => {
                                return (
                                    <div key={idx} className="relative group">
                                        <button
                                            onClick={() => handleAddToContenders(phrase)}
                                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${isInWildMode
                                                ? "bg-[#7A5CFA]/15 border-2 border-[#7A5CFA]/30 text-[#A78BFA] hover:bg-[#7A5CFA]/25 hover:border-[#7A5CFA]/50"
                                                : "bg-white/10 border-2 border-white/30 text-white/75 hover:bg-white/20 hover:border-white/50"
                                                }`}
                                        >
                                            {phrase}
                                        </button>
                                        {/* Dismiss button on hover */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismissPhrase(phrase);
                                            }}
                                            className="absolute -top-2 -left-2 w-5 h-5 bg-red-500/80 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                                        >
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* SEPARATOR 2 */}
            <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* ================================================================ */}
            {/* ACTION BUTTONS ROW - Grouped with visual hierarchy */}
            {/* ================================================================ */}
            <div className="flex items-center justify-center gap-3">
                {/* GROUP 1: Target Settings - Neutral glass */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowModeDropdown(!showModeDropdown)}
                        className={neutralButtonStyle}
                    >
                        <IconBrandYoutube className="w-5 h-5" />
                        <span>Target: {currentMode.label}</span>
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
                                        <span className="text-white/75">{mode.label}</span>
                                        {optimizationMode === key && (
                                            <IconCheck className="w-4 h-4 ml-auto text-[#2BD899]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* GROUP 2: Generation Actions - Orange style */}
                {/* Generate is disabled if there are still unseen phrases to cycle through */}
                <button
                    onClick={canRegenerate ? handleGeneratePhrases : undefined}
                    disabled={isGeneratingPhrases || !canRegenerate}
                    className={isGeneratingPhrases || !canRegenerate ? disabledButtonStyle : actionButtonStyle}
                    title={!canRegenerate ? `Refresh through more phrases first` : "Generate new phrases"}
                >
                    {isGeneratingPhrases ? (
                        <>
                            <IconLoader2 className="w-5 h-5 animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <IconFlame className="w-5 h-5" />
                            <span>Generate Phrases</span>
                        </>
                    )}
                </button>

                {/* Refresh Button - Cycles through options, shows remaining count */}
                <button
                    onClick={totalPages > 1 ? handleRefreshOptions : undefined}
                    disabled={totalPages <= 1}
                    className={totalPages > 1 ? actionButtonStyle : disabledButtonStyle}
                    title={totalPages > 1 ? `${currentOptionsPage + 1}/${totalOptionsPages}${isInWildMode ? " 🧪 Wild" : ""}` : "Generate phrases first"}
                >
                    <IconRefresh className="w-5 h-5" />
                    <span>Refresh</span>
                    {totalPages > 1 && (
                        <span className="text-xs opacity-60">{currentOptionsPage + 1}/{totalOptionsPages}</span>
                    )}
                </button>

                {/* GROUP 3: Primary CTA - Green, disabled when no phrase locked */}
                <button
                    onClick={lockedPhrases.size > 0 ? handleLockAndContinue : undefined}
                    disabled={lockedPhrases.size === 0}
                    className={lockedPhrases.size > 0 ? ctaButtonStyle : ctaDisabledStyle}
                    title={lockedPhrases.size === 0 ? "Lock a phrase first" : `Continue with ${lockedPhrases.size} phrase${lockedPhrases.size > 1 ? "s" : ""}`}
                >
                    <IconCheck className="w-5 h-5" />
                    <span>Lock & Continue</span>
                    <IconArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* ================================================================ */}
            {/* RUNNER-UPS - Premium card styling */}
            {/* ================================================================ */}
            <div className="space-y-5">
                <h3 className="text-xl font-semibold text-white/70">Runner-Ups (Different Hooks)</h3>
                <div className="grid grid-cols-3 gap-5">
                    {titles.runnerUps.map((title, idx) => {
                        const hookStyle = title.hookType ? HOOK_TYPE_STYLES[title.hookType] : null;
                        return (
                            <div
                                key={idx}
                                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all cursor-pointer"
                                onClick={() => handleTitleSelect(title)}
                            >
                                {/* Title - Larger, more readable */}
                                <p className="text-lg font-semibold text-white/75 mb-4 leading-snug line-clamp-3 group-hover:text-white/90 transition-colors">
                                    {title.title}
                                </p>

                                {/* Tags row */}
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    {/* Hook type tag */}
                                    {hookStyle && (
                                        <span
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${hookStyle.bgColor}`}
                                            style={{ color: hookStyle.color }}
                                        >
                                            {hookStyle.label}
                                        </span>
                                    )}
                                    {/* Character count */}
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${title.characters <= 52
                                        ? "bg-[#2BD899]/15 text-[#2BD899] border-[#2BD899]/30"
                                        : title.characters <= 60
                                            ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                                            : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                                        }`}>
                                        {title.characters} chars
                                    </span>
                                </div>

                                {/* Select button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSwapToTop(title);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                                >
                                    <IconArrowUp className="w-4 h-4" />
                                    Select This Title
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ================================================================ */}
            {/* ALTERNATIVES - Premium collapsible grid */}
            {/* ================================================================ */}
            {titles.alternatives.length > 0 && (
                <div className="space-y-5">
                    {/* Toggle button - styled better */}
                    <button
                        onClick={() => setShowAlternatives(!showAlternatives)}
                        className="flex items-center gap-2 text-lg font-semibold text-white/50 hover:text-white/70 transition-colors group"
                    >
                        <span className={`transform transition-transform ${showAlternatives ? "rotate-180" : ""}`}>
                            ↓
                        </span>
                        {showAlternatives ? "Hide" : "Show"} {titles.alternatives.length} More Title Ideas
                    </button>

                    {showAlternatives && (
                        <div className="grid grid-cols-2 gap-4">
                            {titles.alternatives.map((title, idx) => {
                                const hookStyle = title.hookType ? HOOK_TYPE_STYLES[title.hookType] : null;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleSwapToTop(title)}
                                        className="group p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(255,255,255,0.03)] transition-all cursor-pointer"
                                    >
                                        {/* Title - Readable size */}
                                        <p className="text-base font-semibold text-white/75 mb-3 leading-snug group-hover:text-white/95 transition-colors">
                                            {title.title}
                                        </p>

                                        {/* Tags row */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Hook type tag */}
                                            {hookStyle && (
                                                <span
                                                    className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${hookStyle.bgColor}`}
                                                    style={{ color: hookStyle.color }}
                                                >
                                                    {hookStyle.label}
                                                </span>
                                            )}
                                            {/* Character count */}
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${title.characters <= 52
                                                ? "bg-[#2BD899]/15 text-[#2BD899] border-[#2BD899]/30"
                                                : title.characters <= 60
                                                    ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                                                    : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                                                }`}>
                                                {title.characters}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
