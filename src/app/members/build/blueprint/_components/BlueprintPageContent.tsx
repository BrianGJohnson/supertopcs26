"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import {
    IconMicroscope,
    IconLoader2,
    IconCheck,
    IconX,
    IconCopy,
    IconArrowRight,
    IconPalette,
    IconFlask,
    IconChevronLeft,
    IconChevronRight,
    IconMoodSmile,
    IconTrophy,
} from "@tabler/icons-react";

// =============================================================================
// TYPES
// =============================================================================

interface ThumbnailConcept {
    id: string;
    title: string;
    description: string;
    emotionMatch: string;
    recommendedStyles: string[];
    isSelected: boolean;
}

interface StyleGalleryItem {
    id: string;
    styleId: string;
    name: string;
    tier: number;
    tierLabel: string;
    previewImageUrl: string | null;
    isExperimental: boolean;
}

interface TitleVariation {
    title: string;
    phrase: string;
    improvement: string;
    type?: string;
    isOriginal?: boolean;
    isWinner?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

// Helper: Strict Title Case (Every Word Capitalized)
function toTitleCase(str: string | undefined): string {
    if (!str) return '';
    return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Ensure rest is lower? Or preserve? Usually lower helps fix "ALL CAPS".
        .join(' ');
}

export function BlueprintPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");
    const topicId = searchParams.get("topic_id");

    // Wizard state (0-6, 0 = variations modal)
    const [currentStep, setCurrentStep] = useState(0);

    // Step 1: Concept count selection
    const [conceptCount, setConceptCount] = useState<5 | 10 | null>(null);

    // Step 2: Loading state
    const [isGenerating, setIsGenerating] = useState(false);

    // Step 3: Concept selection
    const [concepts, setConcepts] = useState<ThumbnailConcept[]>([]);
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

    // Step 4: Style selection
    const [styles, setStyles] = useState<StyleGalleryItem[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    // Step 5: Prompt enhancement
    const [userHint, setUserHint] = useState("");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedPrompt, setEnhancedPrompt] = useState("");
    const [recommendedModel, setRecommendedModel] = useState("");

    // Data from super_topic
    const [phrase, setPhrase] = useState(""); // The super topic phrase (e.g. "ai thumbnail maker for youtube")
    const [title, setTitle] = useState(""); // The locked title
    const [thumbnailPhrase, setThumbnailPhrase] = useState(""); // The 4-word thumbnail phrase (e.g. "THE GAME HAS CHANGED")
    const [primaryEmotion, setPrimaryEmotion] = useState("");

    // Step 0: Title/Phrase variations
    const [variations, setVariations] = useState<TitleVariation[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
    const [isLoadingVariations, setIsLoadingVariations] = useState(false);
    const [isSavingVariation, setIsSavingVariation] = useState(false);
    const [variationsError, setVariationsError] = useState<string | null>(null);

    // Error state
    const [error, setError] = useState<string | null>(null);

    // Check for brand style setup (first-time user detection)
    const [hasBrandStyle, setHasBrandStyle] = useState<boolean | null>(null);
    const [showBrandModal, setShowBrandModal] = useState(false);

    // ==========================================================================
    // LOAD DATA
    // ==========================================================================

    // Hydrate from Title page sessionStorage as a fallback.
    // This prevents Blueprint from hanging if DB hasn't persisted yet (or if user navigates quickly).
    useEffect(() => {
        if (!topicId) return;

        try {
            const storedTitle = sessionStorage.getItem(`blueprint_title_${topicId}`);
            const storedEmotion = sessionStorage.getItem(`blueprint_emotion_${topicId}`);
            const storedPhrasesRaw = sessionStorage.getItem(`blueprint_phrases_${topicId}`);

            if (storedTitle && !title) setTitle(storedTitle);
            if (storedEmotion && !primaryEmotion) setPrimaryEmotion(storedEmotion);

            if (storedPhrasesRaw && !thumbnailPhrase) {
                const parsed = JSON.parse(storedPhrasesRaw);
                const first = Array.isArray(parsed) ? parsed[0] : null;
                if (typeof first === "string" && first.trim().length > 0) {
                    setThumbnailPhrase(first);
                }
            }
        } catch {
            // Ignore sessionStorage/JSON parse issues; DB fetch below is primary.
        }
    }, [topicId, title, thumbnailPhrase, primaryEmotion]);

    useEffect(() => {
        const loadTopicData = async () => {
            if (!topicId) return;

            try {
                const response = await fetch(`/api/super-topics/get?id=${topicId}`);
                if (!response.ok) throw new Error("Failed to load topic");

                const { topic } = await response.json();
                // phrase = the super topic (e.g. "ai thumbnail maker for youtube")
                setPhrase(topic.phrase || "");
                // title = the locked title from Title page
                setTitle(prev => prev || topic.locked_title || "");
                // thumbnailPhrase = the 4-word phrase for the thumbnail (e.g. "THE GAME HAS CHANGED")
                setThumbnailPhrase(prev => prev || topic.thumbnail_phrase || "");
                setPrimaryEmotion(prev => prev || topic.primary_emotion || "Curiosity");
            } catch (err) {
                console.error("[Blueprint] Error loading topic:", err);
                setError("Failed to load topic data");
            }
        };

        loadTopicData();
    }, [topicId]);

    // Load variations on mount
    useEffect(() => {
        const loadVariations = async () => {
            // Must have topicId, title, AND thumbnailPhrase before loading
            if (!topicId || !title || !thumbnailPhrase) {
                console.log('[Blueprint] Skipping loadVariations - missing data:', { topicId, title: !!title, thumbnailPhrase: !!thumbnailPhrase });
                return;
            }

            console.log('[Blueprint] Starting loadVariations with:', { topicId, title, thumbnailPhrase });
            setIsLoadingVariations(true);
            setVariationsError(null);
            try {
                const response = await fetch('/api/titles/polish-phrase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topicId,
                        lockedTitle: title,
                        lockedPhrase: thumbnailPhrase,
                    }),
                });

                if (!response.ok) {
                    // ENHANCED: Extract the actual error from the response
                    let errorDetails = 'Unknown error';
                    try {
                        const errorBody = await response.json();
                        errorDetails = errorBody.details || errorBody.error || JSON.stringify(errorBody);
                        console.error('[Blueprint] API Error Response:', response.status, errorBody);
                    } catch {
                        errorDetails = `HTTP ${response.status}`;
                        console.error('[Blueprint] API Error (non-JSON):', response.status, response.statusText);
                    }
                    throw new Error(`Failed to generate variations: ${errorDetails}`);
                }

                const data = await response.json();
                console.log('[Blueprint] API Success - variations count:', data.variations?.length);
                if (!data.variations || data.variations.length === 0) {
                    // No variations returned - use original as fallback
                    setVariations([{
                        title: title,
                        phrase: thumbnailPhrase,
                        improvement: 'Your original selection',
                        type: 'original',
                        isOriginal: true,
                    }]);
                    setSelectedVariation(0);
                } else {
                    setVariations(data.variations);
                    setSelectedVariation(0);
                }
            } catch (err) {
                console.error('[Blueprint] Error loading variations:', err);
                setVariationsError('Failed to generate title variations. You can continue with your original selection.');
                // Fallback to original
                setVariations([{
                    title: title,
                    phrase: thumbnailPhrase,
                    improvement: 'Your original selection',
                    type: 'original',
                    isOriginal: true,
                }]);
                setSelectedVariation(0);
            } finally {
                setIsLoadingVariations(false);
            }
        };

        if (currentStep === 0 && title && thumbnailPhrase) {
            loadVariations();
        }
    }, [topicId, title, thumbnailPhrase, currentStep]);

    // If we can't hydrate the required data for step 0, don't leave the user in limbo.
    useEffect(() => {
        if (currentStep !== 0) return;
        if (!topicId) return;

        const timeout = setTimeout(() => {
            if (!title || !thumbnailPhrase) {
                setError(
                    "Missing locked title or thumbnail phrase. Go back to Title and click Proceed again."
                );
            }
        }, 2500);

        return () => clearTimeout(timeout);
    }, [currentStep, topicId, title, thumbnailPhrase]);

    // Check for brand style (first-time user detection)
    useEffect(() => {
        const checkBrandStyle = async () => {
            try {
                const response = await fetch("/api/blueprint/brand-style");
                if (response.ok) {
                    const data = await response.json();
                    setHasBrandStyle(data.hasBrandStyle);
                    if (!data.hasBrandStyle && currentStep === 1) {
                        setShowBrandModal(true);
                    }
                }
            } catch (err) {
                console.error("[Blueprint] Error checking brand style:", err);
            }
        };

        checkBrandStyle();
    }, [currentStep]);

    // Load styles for step 4
    useEffect(() => {
        const loadStyles = async () => {
            if (currentStep !== 4) return;

            try {
                const response = await fetch("/api/blueprint/styles");
                if (response.ok) {
                    const data = await response.json();
                    setStyles(data.styles || []);
                }
            } catch (err) {
                console.error("[Blueprint] Error loading styles:", err);
            }
        };

        loadStyles();
    }, [currentStep]);

    // ==========================================================================
    // HANDLERS
    // ==========================================================================

    const handleConceptCountSelect = async (count: 5 | 10) => {
        setConceptCount(count);
        setCurrentStep(2);
        setIsGenerating(true);

        try {
            const response = await fetch("/api/blueprint/generate-concepts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topicId,
                    conceptCount: count,
                }),
            });

            if (!response.ok) throw new Error("Failed to generate concepts");

            const data = await response.json();
            setConcepts(data.concepts || []);
            setCurrentStep(3);
        } catch (err) {
            console.error("[Blueprint] Error generating concepts:", err);
            setError("Failed to generate concepts");
            setCurrentStep(1);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggleConcept = (conceptId: string) => {
        setSelectedConcepts((prev) => {
            if (prev.includes(conceptId)) {
                return prev.filter((id) => id !== conceptId);
            } else if (prev.length < 3) {
                return [...prev, conceptId];
            }
            return prev;
        });
    };

    const handleContinueToStyles = () => {
        if (selectedConcepts.length === 0) return;
        setCurrentStep(4);
    };

    const handleStyleSelect = (styleId: string) => {
        setSelectedStyle(styleId);
    };

    const handleContinueToEnhancement = async () => {
        if (!selectedStyle || selectedConcepts.length === 0) return;

        setCurrentStep(5);
        setIsEnhancing(true);

        try {
            const response = await fetch("/api/blueprint/enhance-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conceptId: selectedConcepts[0], // Use first selected concept
                    styleId: selectedStyle,
                    userHint: userHint || undefined,
                }),
            });

            if (!response.ok) throw new Error("Failed to enhance prompt");

            const data = await response.json();
            setEnhancedPrompt(data.enhancedPrompt || "");
            setRecommendedModel(data.recommendedModel || "");
            setCurrentStep(6);
        } catch (err) {
            console.error("[Blueprint] Error enhancing prompt:", err);
            setError("Failed to enhance prompt");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(enhancedPrompt);
    };

    const handleBackToTitle = () => {
        if (!sessionId || !topicId) return;
        router.push(`/members/build/title?session_id=${sessionId}&topic_id=${topicId}`);
    };

    const handleSelectVariation = (index: number) => {
        setSelectedVariation(index);
    };

    const handleContinueWithVariation = async () => {
        if (selectedVariation === null) return;
        const selected = variations[selectedVariation];

        setIsSavingVariation(true);
        try {
            // Save the selected variation to DB
            const response = await fetch('/api/titles/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    superTopicId: topicId,
                    lockedTitle: selected.title,
                    thumbnailPhrases: [selected.phrase],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save selection');
            }

            // Update local state
            setTitle(selected.title);
            setThumbnailPhrase(selected.phrase);

            // Also update sessionStorage for consistency
            if (topicId) {
                sessionStorage.setItem(`blueprint_title_${topicId}`, selected.title);
                sessionStorage.setItem(`blueprint_phrases_${topicId}`, JSON.stringify([selected.phrase]));
            }

            setCurrentStep(1);
        } catch (err) {
            console.error('[Blueprint] Error saving variation:', err);
            setError('Failed to save your selection. Please try again.');
        } finally {
            setIsSavingVariation(false);
        }
    };

    const handleSkipVariations = () => {
        // Keep original and proceed - data is already saved from Title page
        setCurrentStep(1);
    };

    // ==========================================================================
    // RENDER HELPERS
    // ==========================================================================

    const renderStep0 = () => {
        const selected = selectedVariation !== null && variations.length > 0 ? variations[selectedVariation] : null;
        const currentIndex = selectedVariation !== null ? selectedVariation : 0;
        const totalVariations = variations.length;

        // Emotion colors (default to Red/Curiosity if missing)
        const emotionColors = {
            from: '#E63946',
            to: '#D62828',
            accent: '#FF6B6B',
        };

        const handlePrevVariation = () => {
            if (currentIndex > 0) {
                setSelectedVariation(currentIndex - 1);
            }
        };

        const handleNextVariation = () => {
            if (currentIndex < totalVariations - 1) {
                setSelectedVariation(currentIndex + 1);
            }
        };

        // If no selection yet (loading or initializing), show loader
        if (!selected) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                    <IconLoader2 className="w-12 h-12 text-[#5AACFF] animate-spin" />
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white mb-2">Polishing Your Package...</h3>
                        <p className="text-white/50">Generating high-impact variations and strategy notes</p>
                    </div>
                </div>
            );
        }

        // Show variations error banner if there was an issue (but we have fallback data)
        const showVariationsError = variationsError && variations.length > 0;

        return (
            <div className="space-y-12 max-w-7xl mx-auto px-4">

                {/* Variations Error Banner */}
                {showVariationsError && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                        <p className="text-amber-400 text-sm">{variationsError}</p>
                    </div>
                )}

                {/* Section Header */}
                <div className="text-center mt-4 space-y-4">


                    {/* Winner Badge - Prominent at TOP */}
                    {selected.isWinner && (
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.3)] animate-pulse-slow">
                            <IconTrophy className="w-6 h-6 text-[#1a1a1a]" />
                            <span className="text-lg font-extrabold text-[#1a1a1a] tracking-wide">TOP PICK</span>
                        </div>
                    )}
                </div>

                {/* MAIN STAGE: Arrows + Thumbnail */}
                <div className="flex items-center justify-center gap-8 md:gap-12">

                    {/* Left Navigation */}
                    <button
                        onClick={handlePrevVariation}
                        disabled={currentIndex === 0}
                        className={`p-4 rounded-full transition-all border-2 ${currentIndex === 0
                            ? "border-white/5 text-white/10 cursor-not-allowed"
                            : "border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/30"}`}
                    >
                        <IconChevronLeft className="w-8 h-8" />
                    </button>

                    {/* THE THUMBNAIL (The "Card") */}
                    <div className="relative w-full max-w-5xl">
                        <div
                            className={`relative aspect-video rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${selected.isWinner
                                ? "ring-4 ring-[#FFD700]/50 shadow-[0_0_60px_rgba(255,215,0,0.15)]"
                                : "ring-1 ring-white/10"
                                }`}
                            style={{
                                background: `radial-gradient(ellipse at center, #0a0a0f 0%, ${emotionColors.from}80 80%, ${emotionColors.from} 100%)`,
                            }}
                        >
                            {/* Visual Effects */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                            {/* Content Layer */}
                            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between">
                                {/* Top Left: Emotions + Phrase Stack */}
                                <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
                                    {/* Emotion Display */}
                                    <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 w-fit">
                                        <IconMoodSmile className="w-6 h-6 text-[#FF6B6B]" />
                                        <span className="text-xl font-bold text-white">{primaryEmotion || "Curiosity"}</span>
                                        <span className="text-white/30 text-lg">•</span>
                                        <span className="text-xl font-bold text-white/80">Hope</span>
                                    </div>

                                    {/* Phrase Pill - Matches Title Page Style */}
                                    <div
                                        className="px-6 py-3.5 rounded-lg text-3xl font-semibold tracking-tight uppercase w-fit"
                                        style={{
                                            backgroundColor: "rgba(0,0,0,0.7)",
                                            color: "white",
                                            textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
                                        }}
                                    >
                                        {selected.phrase || "THUMBNAIL TEXT HERE"}
                                    </div>
                                </div>

                                {/* Top Right: Variation Counter */}
                                <div className="absolute top-8 right-8 z-10 px-4 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/5 text-sm font-medium text-white/50">
                                    {currentIndex + 1} / {totalVariations}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Navigation */}
                    <button
                        onClick={handleNextVariation}
                        disabled={currentIndex === totalVariations - 1}
                        className={`p-4 rounded-full transition-all border-2 ${currentIndex === totalVariations - 1
                            ? "border-white/5 text-white/10 cursor-not-allowed"
                            : "border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/30"}`}
                    >
                        <IconChevronRight className="w-8 h-8" />
                    </button>
                </div>

                {/* DETAILS SECTION (Below Thumbnail) */}
                <div className="max-w-3xl mx-auto flex flex-col items-center text-center space-y-6">

                    {/* Super Topic */}
                    {phrase && (
                        <p className="text-sm font-medium text-[#5AACFF]/70 tracking-wide">
                            {phrase.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                    )}

                    {/* Main Title */}
                    <div className="min-h-[4rem] flex items-center justify-center px-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            {toTitleCase(selected.title)}
                        </h1>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-3 justify-center min-h-[32px]">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${selected.title?.length >= 48 && selected.title?.length <= 56
                            ? "bg-[#2BD899]/10 text-[#2BD899] border-[#2BD899]/30"
                            : "bg-white/10 text-white/50 border-white/10"
                            }`}>
                            {selected.title?.length || 0} chars
                        </span>

                        {selected.type === 'rank' && <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-[#5AACFF]/10 text-[#5AACFF] border border-[#5AACFF]/30">SEO Optimized</span>}
                        {selected.type === 'wild' && <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/30">Wild Card</span>}
                    </div>

                    {/* Strategy Note */}
                    {selected.improvement && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 px-8 max-w-2xl mt-4">
                            <p className="text-xl text-white/70 italic leading-relaxed">
                                &ldquo;{selected.improvement.replace('🏆 STRATEGY:', '').trim()}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-6 pt-8 pb-12">
                        {/* Generate More (Skip) */}
                        <button
                            onClick={handleSkipVariations}
                            className="px-8 py-4 rounded-xl font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            <IconLoader2 className="w-5 h-5" />
                            Generate More
                        </button>

                        {/* USE THIS TITLE */}
                        <button
                            onClick={handleContinueWithVariation}
                            disabled={isSavingVariation}
                            className={`px-10 py-5 rounded-xl font-bold text-xl transition-all flex items-center gap-3 ${isSavingVariation
                                ? 'bg-[#2BD899]/50 text-[#0a0f1c]/50 cursor-not-allowed'
                                : 'bg-[#2BD899] text-[#0a0f1c] hover:bg-[#25C78A] hover:scale-105 shadow-[0_0_40px_rgba(43,216,153,0.3)]'}`}
                        >
                            {isSavingVariation ? (
                                <><IconLoader2 className="w-6 h-6 animate-spin" /> Saving...</>
                            ) : (
                                <><IconCheck className="w-6 h-6" /> Use This Title</>
                            )}
                        </button>
                    </div>

                    {/* Back Link */}
                    <button
                        onClick={handleBackToTitle}
                        className="text-white/30 hover:text-white/60 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <IconChevronLeft className="w-4 h-4" />
                        Back to Concept
                    </button>
                </div>
            </div>
        );
    };
    const renderStep1 = () => (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-white/90">How many thumbnail concepts?</h2>
                <p className="text-base text-white/75 max-w-2xl mx-auto">
                    Choose how many AI-generated visual concepts you&apos;d like to explore. More concepts give you more variety.
                </p>
            </div>

            <div className="flex gap-6 justify-center max-w-2xl mx-auto">
                <button
                    onClick={() => handleConceptCountSelect(5)}
                    className="flex-1 p-8 rounded-2xl bg-white/[0.03] border-2 border-white/10 hover:border-[#5AACFF]/40 hover:bg-white/[0.06] transition-all group"
                >
                    <div className="text-center space-y-3">
                        <div className="text-5xl font-bold text-white/90 group-hover:text-[#A0DCFF] transition-colors">5</div>
                        <div className="text-base font-semibold text-white/75">Concepts</div>
                        <div className="text-sm text-white/50">10 credits</div>
                    </div>
                </button>

                <button
                    onClick={() => handleConceptCountSelect(10)}
                    className="flex-1 p-8 rounded-2xl bg-white/[0.03] border-2 border-white/10 hover:border-[#7A5CFA]/40 hover:bg-white/[0.06] transition-all group"
                >
                    <div className="text-center space-y-3">
                        <div className="text-5xl font-bold text-white/90 group-hover:text-[#C3B6EB] transition-colors">10</div>
                        <div className="text-base font-semibold text-white/75">Concepts</div>
                        <div className="text-sm text-white/50">20 credits</div>
                        <div className="text-xs text-[#7A5CFA] font-semibold">Best Value</div>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-6">
                <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
                <div>
                    <p className="text-white/75 text-xl font-medium">
                        Generating {conceptCount} Visual Concepts...
                    </p>
                    <p className="text-white/50 text-base mt-2">
                        AI is analyzing your topic and creating thumbnail ideas
                    </p>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-white/90">Choose 1-3 Concepts</h2>
                <p className="text-base text-white/75 max-w-2xl mx-auto">
                    Select the visual concepts that resonate most with your video&apos;s message.
                </p>
                <div className="flex items-center justify-center gap-3 text-sm text-white/60">
                    <span>Phrase: <strong className="text-white/80">{thumbnailPhrase}</strong></span>
                    <span>•</span>
                    <span>Emotion: <strong className="text-white/80">{primaryEmotion}</strong></span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {concepts.map((concept) => {
                    const isSelected = selectedConcepts.includes(concept.id);
                    return (
                        <button
                            key={concept.id}
                            onClick={() => handleToggleConcept(concept.id)}
                            className={`p-6 rounded-2xl text-left transition-all ${isSelected
                                ? "bg-[#7A5CFA]/15 border-2 border-[#7A5CFA]/50 shadow-[0_0_20px_rgba(122,92,250,0.2)]"
                                : "bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06]"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-bold text-white/90">{concept.title}</h3>
                                {isSelected && (
                                    <div className="w-6 h-6 bg-[#7A5CFA] rounded-full flex items-center justify-center flex-shrink-0">
                                        <IconCheck className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <p className="text-base text-white/75 mb-3">{concept.description}</p>
                            <div className="text-sm text-white/60">
                                <span className="font-semibold">Emotion Match:</span> {concept.emotionMatch}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleContinueToStyles}
                    disabled={selectedConcepts.length === 0}
                    className={`px-8 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 border-2 ${selectedConcepts.length > 0
                        ? "bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] border-[#2BD899]/40 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]"
                        : "bg-[#2BD899]/10 border-[#2BD899]/20 text-[#4AE8B0]/50 cursor-not-allowed"
                        }`}
                >
                    Continue with {selectedConcepts.length} Concept{selectedConcepts.length !== 1 ? "s" : ""}
                    <IconArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-white/90">Choose Your Thumbnail Style</h2>
                <p className="text-base text-white/75 max-w-2xl mx-auto">
                    Select a visual style that matches your brand and content type.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {styles.slice(0, 6).map((style) => {
                    const isSelected = selectedStyle === style.styleId;
                    return (
                        <button
                            key={style.id}
                            onClick={() => handleStyleSelect(style.styleId)}
                            className={`p-4 rounded-xl text-left transition-all ${isSelected
                                ? "bg-[#7A5CFA]/15 border-2 border-[#7A5CFA]/50"
                                : "bg-white/[0.03] border border-white/10 hover:border-white/25"
                                }`}
                        >
                            <div className="aspect-video bg-white/5 rounded-lg mb-3 flex items-center justify-center">
                                <IconPalette className="w-8 h-8 text-white/30" />
                            </div>
                            <div className="text-base font-semibold text-white/90 mb-1">{style.name}</div>
                            <div className="text-sm text-white/60">Tier {style.tier}</div>
                        </button>
                    );
                })}
            </div>

            <div className="max-w-xl mx-auto w-full">
                <label className="block text-sm font-medium text-white/70 mb-2">
                    Visual Hint (Optional)
                </label>
                <textarea
                    value={userHint}
                    onChange={(e) => setUserHint(e.target.value)}
                    placeholder="e.g. Make it dark and moody, add a robot, use neon colors..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#7A5CFA]/50 focus:ring-1 focus:ring-[#7A5CFA]/50 resize-none h-24"
                />
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={() => router.push(`/members/build/blueprint/styles?session_id=${sessionId}&topic_id=${topicId}`)}
                    className="px-6 py-3 font-semibold text-base rounded-xl bg-white/5 border border-white/10 text-white/75 hover:bg-white/10 transition-all"
                >
                    View All {styles.length} Styles
                </button>
                <button
                    onClick={handleContinueToEnhancement}
                    disabled={!selectedStyle}
                    className={`px-8 py-4 font-bold text-lg rounded-xl transition-all flex items-center gap-2 border-2 ${selectedStyle
                        ? "bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] border-[#2BD899]/40"
                        : "bg-[#2BD899]/10 border-[#2BD899]/20 text-[#4AE8B0]/50 cursor-not-allowed"
                        }`}
                >
                    Continue
                    <IconArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-6">
                <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
                <div>
                    <p className="text-white/75 text-xl font-medium">
                        Enhancing Your Prompt...
                    </p>
                    <p className="text-white/50 text-base mt-2">
                        Creating model-specific instructions
                    </p>
                </div>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-[#2BD899]/20 rounded-full flex items-center justify-center">
                        <IconCheck className="w-8 h-8 text-[#2BD899]" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-white/90">Your Thumbnail Blueprint is Ready!</h2>
                <p className="text-base text-white/75">
                    Copy this prompt and use it in your favorite AI image generator.
                </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white/60">Enhanced Prompt</span>
                    <span className="text-sm text-white/60">Recommended: {recommendedModel}</span>
                </div>
                <div className="p-4 rounded-lg bg-black/40 border border-white/5 mb-4">
                    <p className="text-base text-white/80 whitespace-pre-wrap font-mono">{enhancedPrompt}</p>
                </div>
                <button
                    onClick={handleCopyPrompt}
                    className="w-full px-6 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 border-2 bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15 hover:from-[#5AACFF]/20 hover:to-[#4A9CFF]/20 text-[#A0DCFF] border-[#5AACFF]/40"
                >
                    <IconCopy className="w-5 h-5" />
                    Copy Prompt to Clipboard
                </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#7A5CFA]/10 border border-[#7A5CFA]/30">
                <p className="text-base text-white/75 text-center">
                    <strong className="text-[#C3B6EB]">Coming Soon:</strong> Generate images directly in SuperTopics with one click!
                </p>
            </div>
        </div>
    );

    // ==========================================================================
    // MAIN RENDER
    // ==========================================================================

    if (!topicId || !sessionId) {
        return (
            <PageShell>
                <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                    <MemberHeader />
                    <div className="bg-surface/40 border border-white/10 rounded-2xl p-12 text-center">
                        <p className="text-white/60 text-lg">
                            {!topicId ? "No topic selected." : "No session found."}
                        </p>
                        <p className="text-white/40 text-sm mt-2">
                            Please go back and try again.
                        </p>
                    </div>
                </div>
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell>
                <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                    <MemberHeader />
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-12 text-center">
                        <p className="text-red-400 text-lg">Something went wrong</p>
                        <p className="text-white/50 text-sm mt-2">{error}</p>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <button
                                onClick={handleBackToTitle}
                                className="px-6 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 flex items-center gap-2"
                            >
                                <IconChevronLeft className="w-4 h-4" />
                                Back to Title
                            </button>
                            <button
                                onClick={() => { setError(null); setCurrentStep(0); }}
                                className="px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
                {/* Ambient Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

                <MemberHeader />

                <HeroModule
                    icon={IconMicroscope}
                    line1="Your Thumbnail Lab"
                    line2="Dialed In"
                    description="One last chance to lock in the perfect title. These variations are on us."
                />

                <BuilderStepper activeStep={6} />



                {/* Separator */}
                <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Step Content */}
                {currentStep === 0 && renderStep0()}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
                {currentStep === 6 && renderStep6()}

                {/* Footer */}
                <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
                    SuperTopics.app © 2025 • All Rights Reserved • You Dig?
                </footer>
            </div>
        </PageShell>
    );
}
