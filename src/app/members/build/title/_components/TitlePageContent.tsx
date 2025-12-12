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
    IconChevronLeft,
    IconChevronRight,
    IconRefresh,
    IconFlask,
    IconSearch,
    IconScale,
    IconRocket,
    IconBrandYoutubeFilled,
    IconFlame,
    IconX,
    IconWand,
    IconBolt,
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
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]); // Store formats for regeneration

    // Title state
    const [titles, setTitles] = useState<TitleData | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<TitleOption | null>(null);
    const [showMoreTitles, setShowMoreTitles] = useState(false);
    const [titleCarouselPage, setTitleCarouselPage] = useState(0);

    // Phase state: "title" = selecting title, "phrase" = selecting phrases
    const [currentPhase, setCurrentPhase] = useState<"title" | "phrase">("title");

    // Phrase state - Two-row system
    const [topPicks, setTopPicks] = useState<string[]>([]); // All phrases from generation
    const [wildCards, setWildCards] = useState<string[]>([]); // Wild phrases (kept for potential future use)
    const [contenders, setContenders] = useState<string[]>([]); // Top row: shortlisted phrases (up to 4)
    const [lockedPhrases, setLockedPhrases] = useState<Map<string, number>>(new Map()); // Numbered selections (1, 2, 3) for split testing
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

            // ALWAYS store formats for potential regeneration (before any early returns)
            const formats = topic.selected_formats || [];
            setSelectedFormats(formats);

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
                    selectedFormats: formats,
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
        setLockedPhrases(new Map());
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
        setLockedPhrases(new Map());
        setOptionsPageIndex(0);
        setHasGeneratedOnce(false);
        setHighestSeenPage(0);
    };

    // Handle "Show Phrases" button - transition to phrase phase
    // Note: Phrase generation will be triggered automatically via the UI when phrases haven't been generated yet
    const handleShowPhrases = () => {
        setCurrentPhase("phrase");
    };

    // Handle going back to title selection phase
    const handleBackToTitles = () => {
        setCurrentPhase("title");
    };

    // Handle regenerating titles (Generate More Titles button)
    const handleRegenerateTitles = async () => {
        if (!topicId) return;

        setIsGeneratingTitles(true);

        try {
            // Call the titles API to generate fresh titles
            const response = await fetch("/api/titles/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    superTopicId: topicId,
                    selectedFormats: selectedFormats, // Use stored formats
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate titles");
            }

            const result = await response.json();

            // Update titles state with new titles
            setTitles(result.titles);
            setSelectedTitle(result.titles.winner);
            setTitleCarouselPage(0);

            // Reset phrase state since titles changed
            setTopPicks([]);
            setWildCards([]);
            setContenders([]);
            setLockedPhrases(new Map());
            setOptionsPageIndex(0);
            setHasGeneratedOnce(false);
            setHighestSeenPage(0);

            console.log(`[Title Page] Regenerated titles in ${result.stats.durationMs}ms (${result.stats.costCents}¢)`);
        } catch (err) {
            console.error("[Title Page] Error regenerating titles:", err);
            setError(err instanceof Error ? err.message : "Failed to regenerate titles");
        } finally {
            setIsGeneratingTitles(false);
        }
    };

    const [refreshCount, setRefreshCount] = useState(0);

    const handleGeneratePhrases = async () => {
        if (!selectedTitle || !topicId || isGeneratingPhrases) return;

        setIsGeneratingPhrases(true);

        // Increment refresh count (effective for next time, but we send current "attempt" index)
        // If we have already generated once, this is a "refresh" (index 1, 2, 3...)
        // If it's the first time, it's index 0.
        const currentRefreshIndex = hasGeneratedOnce ? refreshCount + 1 : 0;

        // Update state for next time
        if (hasGeneratedOnce) {
            setRefreshCount(prev => prev + 1);
        }

        // Preserve existing contenders and locked phrases on regeneration
        // Only reset on first generation (before hasGeneratedOnce is true)
        const isFirstGeneration = !hasGeneratedOnce;
        const existingContenders = isFirstGeneration ? [] : [...contenders];
        const existingLockedPhrases = isFirstGeneration ? new Map<string, number>() : new Map(lockedPhrases);

        setTopPicks([]);
        setWildCards([]);
        setOptionsPageIndex(0);
        setHighestSeenPage(0);

        // Only reset contenders/locked on first generation
        if (isFirstGeneration) {
            setContenders([]);
            setLockedPhrases(new Map());
        }

        try {
            const response = await fetch("/api/titles/thumbnail-phrases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    superTopicId: topicId,
                    title: selectedTitle.title,
                    refreshCount: currentRefreshIndex, // Send the explicit count
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`[Title Page] Generated ${result.topPicks?.length || 0} top picks, ${result.wildCards?.length || 0} wild cards in ${result.stats.durationMs}ms (${result.stats.costCents}¢)`);

                // Filter out any phrases that are already in contenders
                const newTopPicks = (result.topPicks || []).filter((p: string) => !existingContenders.includes(p));
                const newWildCards = (result.wildCards || []).filter((p: string) => !existingContenders.includes(p));

                setTopPicks(newTopPicks);
                setWildCards(newWildCards);
                setHasGeneratedOnce(true);

                // Only auto-add first phrase on FIRST generation when no contenders exist
                if (isFirstGeneration && newTopPicks.length > 0) {
                    const firstPhrase = newTopPicks[0];
                    setContenders([firstPhrase]);
                    setLockedPhrases(new Map([[firstPhrase, 1]]));
                }
                // On regeneration, keep existing contenders intact (already preserved above)
            }
        } catch (err) {
            console.error("[Title Page] Phrase generation error:", err);
        } finally {
            setIsGeneratingPhrases(false);
        }
    };

    // Auto-generate phrases when entering phrase phase (if not already done)
    useEffect(() => {
        if (currentPhase === "phrase" && topPicks.length === 0 && !isGeneratingPhrases && selectedTitle) {
            handleGeneratePhrases();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPhase]);

    // Handle clicking a phrase in Options row → add to Contenders
    const handleAddToContenders = (phrase: string) => {
        if (contenders.includes(phrase)) return; // Already in contenders
        if (contenders.length >= 4) return; // Max 4 contenders
        setContenders(prev => [...prev, phrase]);
    };

    // Handle clicking a Contender → toggle lock state
    const handleToggleLock = (phrase: string) => {
        setLockedPhrases(prev => {
            const newMap = new Map(prev);
            if (newMap.has(phrase)) {
                // Remove this phrase and renumber remaining
                const removedNum = newMap.get(phrase)!;
                newMap.delete(phrase);
                // Renumber higher numbers down
                newMap.forEach((num, key) => {
                    if (num > removedNum) {
                        newMap.set(key, num - 1);
                    }
                });
            } else {
                // Add new phrase with next number (max 3 for split testing)
                if (newMap.size < 3) {
                    const nextNum = newMap.size + 1;
                    newMap.set(phrase, nextNum);
                }
            }
            return newMap;
        });
    };

    // Handle removing a contender (goes back to options)
    const handleRemoveContender = (phrase: string) => {
        setContenders(prev => prev.filter(p => p !== phrase));
        setLockedPhrases(prev => {
            const newMap = new Map(prev);
            if (newMap.has(phrase)) {
                const removedNum = newMap.get(phrase)!;
                newMap.delete(phrase);
                // Renumber higher numbers down
                newMap.forEach((num, key) => {
                    if (num > removedNum) {
                        newMap.set(key, num - 1);
                    }
                });
            }
            return newMap;
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

    // Navigate to previous options page
    const handlePrevOptions = () => {
        if (optionsPageIndex > 0) {
            setOptionsPageIndex(optionsPageIndex - 1);
        }
    };

    // Navigate to next options page
    const handleNextOptions = () => {
        const nextPage = optionsPageIndex + 1;
        if (nextPage < totalOptionsPages) {
            setOptionsPageIndex(nextPage);
            // Track highest seen page for Generate button gating
            if (nextPage > highestSeenPage) {
                setHighestSeenPage(nextPage);
            }
        }
    };

    // Refresh cycles through options (for the Refresh button - wraps around)
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
                    // Sort phrases by selection number (1, 2, 3) before sending
                    thumbnailPhrases: [...lockedPhrases.entries()]
                        .sort((a, b) => a[1] - b[1])
                        .map(([phrase]) => phrase),
                }),
            });

            // Save data for Blueprint page (sorted by selection order)
            sessionStorage.setItem(`blueprint_emotion_${topicId}`, primaryEmotion);
            sessionStorage.setItem(`blueprint_phrases_${topicId}`, JSON.stringify(
                [...lockedPhrases.entries()]
                    .sort((a, b) => a[1] - b[1])
                    .map(([phrase]) => phrase)
            ));
            sessionStorage.setItem(`blueprint_title_${topicId}`, selectedTitle.title);

            // Navigate to Blueprint page
            router.push(`/members/build/blueprint?session_id=${sessionId}&topic_id=${topicId}`);
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

    // Phase messages for title generation - randomized per visit
    // Title Case, no trailing dots
    const PHASE_1_MESSAGES = [
        "Cranking Up The Creative Engine",
        "Firing Up The Title Lab",
        "Warming Up The Creativity",
        "Starting The Experiment",
    ];
    const PHASE_2_MESSAGES = [
        "Brewing 15 Different Title Angles",
        "Mixing Data With Creativity",
        "Generating Fresh Title Ideas",
        "Exploring New Angles",
    ];
    const PHASE_3_MESSAGES = [
        "Now Critiquing The Results",
        "Filtering Noise, Keeping Gold",
        "Selecting The Winners",
        "Our Critic Is Choosing Your Best Titles",
    ];

    // Phrase generation messages - Title Case, no trailing dots
    const PHRASE_PHASE_1_MESSAGES = [
        "Waking Up The Mad Scientist",
        "Summoning The Creative Genius",
        "Firing Up The Idea Factory",
        "Unleashing The Creative Engine",
    ];
    const PHRASE_PHASE_2_MESSAGES = [
        "Generating Dozens Of Phrases",
        "Exploring Every Angle",
        "Creating Winners And Wild Cards",
        "Mixing Words With Emotion",
    ];
    const PHRASE_PHASE_3_MESSAGES = [
        "Sorting Winners From Wild Ideas",
        "Picking The Top Contenders",
        "Organizing Your Options",
        "Selecting The Best Phrases",
    ];

    // Memoized random index for consistent messages during this generation
    const [loadingMessageIndex] = useState(() => Math.floor(Math.random() * 4));
    const [loadingPhase, setLoadingPhase] = useState(0);
    const [phraseLoadingPhase, setPhraseLoadingPhase] = useState(0);

    // Phase timing: 5s, 5s, 4s = 14s total (title generation)
    useEffect(() => {
        if (isGeneratingTitles && !titles) {
            setLoadingPhase(0);
            const timer1 = setTimeout(() => setLoadingPhase(1), 5000);
            const timer2 = setTimeout(() => setLoadingPhase(2), 10000);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [isGeneratingTitles, titles]);

    // Phase timing: 5s, 5s, 6s = 16s total (phrase generation)
    useEffect(() => {
        if (isGeneratingPhrases) {
            setPhraseLoadingPhase(0);
            const timer1 = setTimeout(() => setPhraseLoadingPhase(1), 5000);
            const timer2 = setTimeout(() => setPhraseLoadingPhase(2), 10000);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [isGeneratingPhrases]);

    if (isLoading || (isGeneratingTitles && !titles)) {
        const allMessages = [PHASE_1_MESSAGES, PHASE_2_MESSAGES, PHASE_3_MESSAGES];
        const currentMessage = isGeneratingTitles
            ? allMessages[loadingPhase][loadingMessageIndex % allMessages[loadingPhase].length]
            : "Loading...";

        // Calculate progress based on phase (0-33%, 33-66%, 66-100%)
        const progressPercent = isGeneratingTitles
            ? Math.min(95, (loadingPhase + 1) * 33)
            : 0;

        return (
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
                <div className="flex flex-col items-center gap-8">
                    {/* Bolt Icon - pulsing (amber/gold for energy) */}
                    <IconBolt className="w-16 h-16 text-[#EAB308] animate-pulse" />

                    {/* Current Phase Message - Large headline */}
                    <h2
                        className="text-white/90 text-4xl font-bold transition-opacity duration-500"
                        key={loadingPhase} // Force re-render for fade effect
                    >
                        {currentMessage}
                    </h2>

                    {/* Progress bar */}
                    {isGeneratingTitles && (
                        <div
                            className="relative h-4 bg-black/30 rounded-full border border-white/10 overflow-hidden mx-auto"
                            style={{ width: '60%' }}
                        >
                            <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${progressPercent}%`,
                                    backgroundColor: "#6B9BD1",
                                    opacity: 0.7,
                                }}
                            />
                            {/* Shimmer effect */}
                            <div
                                className="absolute inset-y-0 left-0 rounded-full animate-pulse"
                                style={{
                                    width: `${progressPercent}%`,
                                    background: `linear-gradient(90deg, transparent, rgba(107,155,209,0.5), transparent)`,
                                }}
                            />
                        </div>
                    )}

                    {/* Step text - 2x bigger */}
                    {isGeneratingTitles && (
                        <p className="text-white/60 text-2xl leading-relaxed max-w-xl">
                            Step 1 of 15 Creative Title Angles<br />
                            Each Step Refines And Improves Your Pick
                        </p>
                    )}
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

    // UNIFIED BUTTON SIZE: All buttons exactly the same size with breathing room
    const buttonSize = "h-[56px] w-[220px]";

    // YouTube-red glass-card style for Target dropdown
    const neutralButtonStyle = `${buttonSize} flex items-center justify-center gap-3 px-6 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-gradient-to-b from-[#FF0000]/15 to-[#CC0000]/15 hover:from-[#FF0000]/20 hover:to-[#CC0000]/20 text-white/75 border-2 border-[#FF0000]/30 shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_12px_rgba(255,0,0,0.15)]`;

    // Orange style for generation actions (Generate Phrases, Refresh)
    const actionButtonStyle = `${buttonSize} flex items-center justify-center gap-3 px-6 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-[#F59E0B]/15 border-2 border-[#F59E0B]/30 text-[#EAB308] hover:bg-[#F59E0B]/25 hover:border-[#F59E0B]/50`;

    // Green style for primary CTA (Lock & Continue)
    const ctaButtonStyle = `${buttonSize} flex items-center justify-center gap-3 px-6 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] border-2 border-[#2BD899]/30 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]`;

    // Green CTA disabled state
    const ctaDisabledStyle = `${buttonSize} flex items-center justify-center gap-3 px-6 rounded-xl text-base font-semibold whitespace-nowrap bg-[#2BD899]/10 border-2 border-[#2BD899]/20 text-[#4AE8B0]/50 cursor-not-allowed`;

    // Disabled style for inactive action buttons
    const disabledButtonStyle = `${buttonSize} flex items-center justify-center gap-3 px-6 rounded-xl text-base font-semibold whitespace-nowrap bg-white/5 border-2 border-white/10 text-white/30 cursor-not-allowed`;

    // ==========================================================================
    // MAIN RENDER
    // ==========================================================================

    return (
        <>
            {/* ================================================================ */}
            {/* PHRASE GENERATION LOADING OVERLAY */}
            {/* ================================================================ */}
            {isGeneratingPhrases && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div
                        className="bg-surface/60 backdrop-blur-md rounded-2xl p-16 text-center max-w-2xl mx-4"
                        style={{
                            border: '2px solid rgba(107, 155, 209, 0.4)',
                            boxShadow: '0 0 40px rgba(107, 155, 209, 0.15)',
                        }}
                    >
                        <div className="flex flex-col items-center gap-8">
                            {/* Flask Icon - pulsing (mad scientist theme) */}
                            <IconFlask className="w-16 h-16 text-[#6B9BD1] animate-pulse" />

                            {/* Current Phase Message - Large headline */}
                            <h2
                                className="text-white/90 text-4xl font-bold transition-opacity duration-500"
                                key={phraseLoadingPhase}
                            >
                                {[PHRASE_PHASE_1_MESSAGES, PHRASE_PHASE_2_MESSAGES, PHRASE_PHASE_3_MESSAGES][phraseLoadingPhase][loadingMessageIndex % 4]}
                            </h2>

                            {/* Progress bar */}
                            <div
                                className="relative h-4 bg-black/30 rounded-full border border-white/10 overflow-hidden"
                                style={{ width: '70%' }}
                            >
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${Math.min(95, (phraseLoadingPhase + 1) * 33)}%`,
                                        backgroundColor: "#6B9BD1",
                                        opacity: 0.7,
                                    }}
                                />
                                {/* Shimmer effect */}
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full animate-pulse"
                                    style={{
                                        width: `${Math.min(95, (phraseLoadingPhase + 1) * 33)}%`,
                                        background: `linear-gradient(90deg, transparent, rgba(107,155,209,0.5), transparent)`,
                                    }}
                                />
                            </div>

                            {/* Step text - explains what they'll see */}
                            <p className="text-white/60 text-2xl leading-relaxed max-w-xl">
                                Winners Are Shown First In White<br />
                                Purple? That&apos;s Our Crazy Creative — Worth A Peek
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-10 max-w-6xl mx-auto">
                {/* ================================================================ */}
                {/* TOP PICK BADGE - Only show in title phase */}
                {/* ================================================================ */}
                {currentPhase === "title" && (
                    <div className="flex justify-center">
                        <div className="flex items-center gap-2 px-5 py-2 rounded-full shadow-lg bg-[#FFD700]">
                            <IconTrophy className="w-5 h-5 text-[#1a1a1a]" />
                            <span className="text-base font-bold text-[#1a1a1a]">Top Pick</span>
                        </div>
                    </div>
                )}

                {/* ================================================================ */}
                {/* THUMBNAIL PREVIEW - Dark glass with glowing emotion border */}
                {/* ================================================================ */}
                <div className="flex flex-col items-center">
                    <div
                        className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
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
                            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
                                <IconMoodSmile className="w-6 h-6 text-[#FF6B6B]" />
                                <span className="text-lg font-semibold text-white">{primaryEmotion}</span>
                                <span className="text-white/50">•</span>
                                <span className="text-lg font-semibold text-white">{secondaryEmotion}</span>
                            </div>

                            {/* First Locked Phrase (Selection #1) */}
                            {lockedPhrases.size > 0 && (
                                <div
                                    className="px-6 py-3.5 rounded-lg text-3xl font-semibold tracking-tight"
                                    style={{
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        color: "white",
                                        textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
                                    }}
                                >
                                    {/* Get phrase with selection number 1 */}
                                    {[...lockedPhrases.entries()].find(([, num]) => num === 1)?.[0] || [...lockedPhrases.keys()][0]}
                                </div>
                            )}
                        </div>

                        {/* Empty state hint */}
                        {lockedPhrases.size === 0 && topPicks.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white/40 text-lg">Your thumbnail text will appear here after selecting a title</p>
                            </div>
                        )}
                    </div>

                    {/* Title Below Thumbnail - 3 lines, all centered */}
                    <div className="mt-10 flex flex-col items-center gap-2">
                        {/* Line 1: Super Topic (no label) */}
                        {phrase && (
                            <p className="text-[21px] font-semibold text-white/60">
                                {phrase.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                            </p>
                        )}
                        {/* Line 2: Title (no label) */}
                        <p className="text-2xl font-bold text-white/90">
                            {selectedTitle.title}
                        </p>
                        {/* Line 3: Character count pill */}
                        <span className="mt-2 px-3 py-1 text-sm font-medium rounded-full bg-white/10 text-white/40 border border-white/15">
                            {selectedTitle.characters} chars
                        </span>
                    </div>
                </div>

                {/* ================================================================ */}
                {/* PHASE-SPECIFIC CONTENT */}
                {/* ================================================================ */}

                {currentPhase === "title" ? (
                    /* ============================================================ */
                    /* TITLE PHASE: Carousel + Show Phrases CTA */
                    /* ============================================================ */
                    <>
                        {/* Separator */}
                        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* Alternative Titles Carousel - Always visible, 1 at a time */}
                        {(() => {
                            const allOtherTitles = [...titles.runnerUps, ...titles.alternatives];
                            const titlesPerPage = 1; // Show 1 title at a time
                            const totalTitlePages = allOtherTitles.length;
                            const currentTitle = allOtherTitles[titleCarouselPage];

                            if (allOtherTitles.length === 0) return null;

                            const hookStyle = currentTitle?.hookType ? HOOK_TYPE_STYLES[currentTitle.hookType] : null;

                            return (
                                <div className="space-y-4">
                                    {/* Section label */}
                                    <h3 className="text-base font-semibold text-white/50 uppercase tracking-wider text-center">
                                        Browse Potential Video Titles
                                    </h3>

                                    {/* Carousel with arrows - Fixed width container for stability */}
                                    <div className="flex items-center justify-center gap-4">
                                        {/* Left arrow - fixed width */}
                                        <button
                                            onClick={() => setTitleCarouselPage(prev => Math.max(0, prev - 1))}
                                            disabled={titleCarouselPage === 0}
                                            className={`p-3 rounded-full transition-all shrink-0 ${titleCarouselPage === 0
                                                ? "text-white/20 cursor-not-allowed"
                                                : "text-white/60 hover:text-white/90 hover:bg-white/10"}`}
                                        >
                                            <IconChevronLeft className="w-7 h-7" />
                                        </button>

                                        {/* Fixed width card container - NEVER changes size */}
                                        <div className="w-[700px] h-[220px] shrink-0">
                                            {/* Single Card - fills the fixed container */}
                                            {currentTitle && (
                                                <div
                                                    className="group w-full h-full p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all cursor-pointer flex flex-col"
                                                    onClick={() => handleSwapToTop(currentTitle)}
                                                >
                                                    {/* Title - Fixed height area with vertical centering */}
                                                    <div className="flex-1 flex items-center justify-center min-h-0">
                                                        <p className="text-2xl font-semibold text-white/75 leading-snug text-center group-hover:text-white/90 transition-colors line-clamp-3">
                                                            {currentTitle.title}
                                                        </p>
                                                    </div>

                                                    {/* Tags row - balanced spacing */}
                                                    <div className="flex items-center justify-center gap-2 flex-wrap mt-2 mb-5">
                                                        {hookStyle && (
                                                            <span
                                                                className={`px-2.5 py-1 text-sm font-semibold rounded-full border ${hookStyle.bgColor}`}
                                                                style={{ color: hookStyle.color }}
                                                            >
                                                                {hookStyle.label}
                                                            </span>
                                                        )}
                                                        <span className={`px-2.5 py-1 text-sm font-medium rounded-full border ${currentTitle.characters <= 52
                                                            ? "bg-[#2BD899]/15 text-[#2BD899] border-[#2BD899]/30"
                                                            : currentTitle.characters <= 60
                                                                ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                                                                : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                                                            }`}>
                                                            {currentTitle.characters} chars
                                                        </span>
                                                    </div>

                                                    {/* Select button - subtle cyan tint for visibility */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSwapToTop(currentTitle);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5AACFF]/8 border border-[#5AACFF]/20 text-[#A0DCFF]/70 text-base font-semibold hover:bg-[#5AACFF]/15 hover:text-[#A0DCFF] hover:border-[#5AACFF]/30 transition-all"
                                                    >
                                                        <IconArrowUp className="w-5 h-5" />
                                                        Switch to This Title
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right arrow - fixed width */}
                                        <button
                                            onClick={() => setTitleCarouselPage(prev => Math.min(totalTitlePages - 1, prev + 1))}
                                            disabled={titleCarouselPage >= totalTitlePages - 1}
                                            className={`p-3 rounded-full transition-all shrink-0 ${titleCarouselPage >= totalTitlePages - 1
                                                ? "text-white/20 cursor-not-allowed"
                                                : "text-white/60 hover:text-white/90 hover:bg-white/10"}`}
                                        >
                                            <IconChevronRight className="w-7 h-7" />
                                        </button>
                                    </div>

                                    {/* Page indicator */}
                                    {totalTitlePages > 1 && (
                                        <div className="text-center text-sm text-white/50 font-medium">
                                            {titleCarouselPage + 1} of {totalTitlePages}
                                        </div>
                                    )}

                                </div>
                            );
                        })()}

                        {/* Separator before buttons */}
                        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* Action Buttons Row - Generate More Titles + Use This Title */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center justify-center gap-4">
                                {/* Generate More Titles - Purple AI/Premium button */}
                                <button
                                    onClick={handleRegenerateTitles}
                                    disabled={isGeneratingTitles}
                                    className={`h-[52px] px-6 flex items-center justify-center gap-2 rounded-xl text-base font-semibold whitespace-nowrap transition-all ${isGeneratingTitles
                                        ? "bg-[#7A5CFA]/10 border-2 border-[#7A5CFA]/20 text-[#C3B6EB]/50 cursor-not-allowed"
                                        : "bg-gradient-to-b from-[#7A5CFA]/15 to-[#6548E5]/15 hover:from-[#7A5CFA]/20 hover:to-[#6548E5]/20 text-[#C3B6EB] border-2 border-[#7A5CFA]/40 shadow-[0_0_10px_rgba(122,92,250,0.1)] hover:shadow-[0_0_12px_rgba(122,92,250,0.15)]"
                                        }`}
                                    title="Generate fresh AI titles"
                                >
                                    {isGeneratingTitles ? (
                                        <>
                                            <IconLoader2 className="w-5 h-5 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <IconWand className="w-5 h-5" />
                                            <span>Generate More Titles</span>
                                        </>
                                    )}
                                </button>

                                {/* Use This Title - Green primary CTA */}
                                <button
                                    onClick={handleShowPhrases}
                                    className="h-[52px] px-8 flex items-center justify-center gap-3 rounded-xl text-lg font-semibold whitespace-nowrap transition-all bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#4AE8B0] border-2 border-[#2BD899]/40 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]"
                                >
                                    <IconCheck className="w-5 h-5" />
                                    <span>Use This Title</span>
                                    <IconArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-white/40 text-center max-w-md">
                                Lock in your title and generate thumbnail phrase options.
                            </p>
                        </div>
                    </>
                ) : (
                    /* ============================================================ */
                    /* PHRASE PHASE: Show phrase selection UI */
                    /* ============================================================ */
                    <>
                        {/* SEPARATOR 1 */}
                        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* ================================================================ */}
                        {/* PHRASE SELECTION - Two Row System */}
                        {/* ================================================================ */}

                        {/* CONTENDERS ROW - Top row: shortlisted phrases (up to 4) */}
                        {(contenders.length > 0 || topPicks.length > 0) && (
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold text-white/60 uppercase tracking-wider text-center">Contenders</h3>
                                <div className="flex justify-center gap-3">
                                    {/* Show existing contenders - locked ones first (on left), sorted by selection number */}
                                    {[...contenders].sort((a, b) => {
                                        const aNum = lockedPhrases.get(a) ?? 999;
                                        const bNum = lockedPhrases.get(b) ?? 999;
                                        return aNum - bNum;
                                    }).map((phrase, idx) => {
                                        const isLocked = lockedPhrases.has(phrase);
                                        const selectionNum = lockedPhrases.get(phrase);
                                        return (
                                            <div key={idx} className="relative group">
                                                <button
                                                    onClick={() => handleToggleLock(phrase)}
                                                    className={`px-5 py-3 rounded-xl font-semibold text-base transition-all ${isLocked
                                                        ? "bg-[#2BD899]/20 border-2 border-[#2BD899]/50 text-[#2BD899] shadow-[0_0_15px_rgba(43,216,153,0.2)]"
                                                        : "bg-white/10 border-2 border-white/30 text-white/75 hover:bg-white/20 hover:border-white/50"
                                                        }`}
                                                >
                                                    {phrase}
                                                    {isLocked && selectionNum && (
                                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2BD899] rounded-full flex items-center justify-center text-xs font-bold text-black">
                                                            {selectionNum}
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

                        {/* Separator between Contenders and Options */}
                        {(contenders.length > 0 || topPicks.length > 0) && currentOptions.length > 0 && (
                            <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        )}

                        {/* OPTIONS ROW - Bottom row: browse and pick */}
                        {currentOptions.length > 0 && (
                            <div className="space-y-4">
                                {/* Header row - just label and page indicator */}
                                <div className="flex items-center justify-center gap-2">
                                    {isInWildMode && <IconFlask className="w-4 h-4 text-[#A78BFA]" />}
                                    <h3 className={`text-base font-semibold uppercase tracking-wider ${isInWildMode ? "text-[#A78BFA]" : "text-white/60"}`}>
                                        {isInWildMode ? "Wild Options" : "Options"}
                                    </h3>
                                    <span className="text-xs text-white/30">
                                        {currentOptionsPage + 1} of {totalOptionsPages}
                                    </span>
                                </div>

                                {/* Phrase row with arrows on same line */}
                                <div className="flex items-center justify-center gap-3">
                                    {/* Left arrow - on same row as phrases */}
                                    <button
                                        onClick={handlePrevOptions}
                                        disabled={optionsPageIndex === 0}
                                        className={`p-1.5 rounded-full transition-all shrink-0 ${optionsPageIndex === 0
                                            ? "text-white/20 cursor-not-allowed"
                                            : "text-white/50 hover:text-white/80 hover:bg-white/10"}`}
                                    >
                                        <IconChevronLeft className="w-5 h-5" />
                                    </button>

                                    {/* Phrase pills */}
                                    {currentOptions.map((phrase, idx) => (
                                        <div key={idx} className="relative group">
                                            <button
                                                onClick={() => handleAddToContenders(phrase)}
                                                className={`px-5 py-3 rounded-xl font-semibold text-base transition-all ${isInWildMode
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
                                    ))}

                                    {/* Right arrow - on same row as phrases */}
                                    <button
                                        onClick={handleNextOptions}
                                        disabled={optionsPageIndex >= totalOptionsPages - 1}
                                        className={`p-1.5 rounded-full transition-all shrink-0 ${optionsPageIndex >= totalOptionsPages - 1
                                            ? "text-white/20 cursor-not-allowed"
                                            : "text-white/50 hover:text-white/80 hover:bg-white/10"}`}
                                    >
                                        <IconChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SEPARATOR 2 */}
                        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* ================================================================ */}
                        {/* ACTION BUTTONS ROW - Generate, Refresh, Blueprint */}
                        {/* ================================================================ */}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={handleGeneratePhrases}
                                disabled={isGeneratingPhrases || (hasGeneratedOnce && highestSeenPage + 1 < totalPages)}
                                className={isGeneratingPhrases || (hasGeneratedOnce && highestSeenPage + 1 < totalPages) ? disabledButtonStyle : actionButtonStyle}
                                title={
                                    hasGeneratedOnce && highestSeenPage + 1 < totalPages
                                        ? "View all pages first, then you can regenerate"
                                        : hasGeneratedOnce && highestSeenPage + 1 >= totalPages
                                            ? "Generate fresh phrases with the mad scientist 🧪"
                                            : "Generate thumbnail phrases"
                                }
                            >
                                {isGeneratingPhrases ? (
                                    <>
                                        <IconLoader2 size={24} className="shrink-0 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <IconWand size={24} className="shrink-0" />
                                        <span>Generate Phrases</span>
                                    </>
                                )}
                            </button>

                            {/* BUTTON 3: Refresh - Orange action style (cycle through options) */}
                            <button
                                onClick={totalPages > 1 ? handleRefreshOptions : undefined}
                                disabled={totalPages <= 1 || topPicks.length === 0}
                                className={totalPages > 1 && topPicks.length > 0 ? actionButtonStyle : disabledButtonStyle}
                                title={totalPages > 1 ? `Browse options (${currentOptionsPage + 1}/${totalOptionsPages})` : "Generate phrases first"}
                            >
                                <IconRefresh size={24} className="shrink-0" />
                                <span>Refresh</span>
                                {totalPages > 1 && topPicks.length > 0 && (
                                    <span className="text-xs opacity-60">{currentOptionsPage + 1}/{totalOptionsPages}</span>
                                )}
                            </button>

                            {/* BUTTON 4: Continue to Blueprint - Green CTA style */}
                            <button
                                onClick={lockedPhrases.size > 0 ? handleLockAndContinue : undefined}
                                disabled={lockedPhrases.size === 0}
                                className={lockedPhrases.size > 0 ? ctaButtonStyle : ctaDisabledStyle}
                                title={lockedPhrases.size > 0 ? `Continue with ${lockedPhrases.size} phrase${lockedPhrases.size > 1 ? "s" : ""}` : "Select a phrase first"}
                            >
                                <span>Polish & Package</span>
                                <IconArrowRight size={24} className="shrink-0" />
                            </button>
                        </div>

                        {/* Change Title link - positioned below action buttons */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleBackToTitles}
                                className="flex items-center gap-2 text-base text-white/40 hover:text-white/60 transition-colors"
                            >
                                <IconChevronLeft className="w-4 h-4" />
                                <span>Change Title</span>
                                <IconChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )
                }
            </div>
        </>
    );
}
