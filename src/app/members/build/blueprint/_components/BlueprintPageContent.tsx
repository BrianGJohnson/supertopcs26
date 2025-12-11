"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import {
    IconWand,
    IconLoader2,
    IconSparkles,
    IconCheck,
    IconX,
    IconCopy,
    IconArrowRight,
    IconPalette,
    IconFlask,
    IconChevronLeft,
    IconChevronRight,
    IconMoodSmile,
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
    isOriginal?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

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
    const [phrase, setPhrase] = useState("");
    const [title, setTitle] = useState("");
    const [primaryEmotion, setPrimaryEmotion] = useState("");

    // Step 0: Title/Phrase variations
    const [variations, setVariations] = useState<TitleVariation[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
    const [isLoadingVariations, setIsLoadingVariations] = useState(false);
    const [showVariationsModal, setShowVariationsModal] = useState(true);

    // Error state
    const [error, setError] = useState<string | null>(null);

    // Check for brand style setup (first-time user detection)
    const [hasBrandStyle, setHasBrandStyle] = useState<boolean | null>(null);
    const [showBrandModal, setShowBrandModal] = useState(false);

    // ==========================================================================
    // LOAD DATA
    // ==========================================================================

    useEffect(() => {
        const loadTopicData = async () => {
            if (!topicId) return;

            try {
                const response = await fetch(`/api/super-topics/get?id=${topicId}`);
                if (!response.ok) throw new Error("Failed to load topic");

                const { topic } = await response.json();
                setPhrase(topic.thumbnail_phrase || topic.phrase || "");
                setTitle(topic.locked_title || "");
                setPrimaryEmotion(topic.primary_emotion || "Curiosity");
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
            if (!topicId || !title || !phrase) return;

            setIsLoadingVariations(true);
            try {
                const response = await fetch('/api/titles/polish-phrase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topicId,
                        lockedTitle: title,
                        lockedPhrase: phrase,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setVariations(data.variations || []);
                    // Pre-select first variation (original)
                    if (data.variations && data.variations.length > 0) {
                        setSelectedVariation(0);
                    }
                }
            } catch (err) {
                console.error('[Blueprint] Error loading variations:', err);
            } finally {
                setIsLoadingVariations(false);
            }
        };

        if (currentStep === 0 && title && phrase) {
            loadVariations();
        }
    }, [topicId, title, phrase, currentStep]);

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
        router.push(`/members/build/title?session_id=${sessionId}&topic_id=${topicId}`);
    };

    const handleSelectVariation = (index: number) => {
        setSelectedVariation(index);
    };

    const handleContinueWithVariation = () => {
        if (selectedVariation === null) return;

        const selected = variations[selectedVariation];
        setTitle(selected.title);
        setPhrase(selected.phrase);
        setShowVariationsModal(false);
        setCurrentStep(1); // Move to concept count selection
    };

    const handleSkipVariations = () => {
        setShowVariationsModal(false);
        setCurrentStep(1);
    };

    // ==========================================================================
    // RENDER HELPERS
    // ==========================================================================

    const renderStep0 = () => {
        // Show loading skeleton while variations are being fetched
        if (isLoadingVariations || variations.length === 0) {
            return (
                <div className="space-y-10 max-w-6xl mx-auto animate-pulse">
                    {/* Badge skeleton */}
                    <div className="flex justify-center">
                        <div className="h-10 w-48 rounded-full bg-white/10"></div>
                    </div>

                    {/* Thumbnail skeleton */}
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-2xl aspect-video rounded-2xl bg-white/5 border border-white/10"></div>
                        <div className="mt-10 space-y-3 w-full max-w-3xl">
                            <div className="h-7 w-64 mx-auto rounded bg-white/10"></div>
                            <div className="h-8 w-96 mx-auto rounded bg-white/10"></div>
                        </div>
                    </div>

                    {/* Carousel skeleton */}
                    <div className="space-y-4">
                        <div className="h-5 w-48 mx-auto rounded bg-white/10"></div>
                        <div className="flex items-center gap-4 justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/5"></div>
                            <div className="w-full max-w-2xl h-64 rounded-2xl bg-white/5 border border-white/10"></div>
                            <div className="w-12 h-12 rounded-full bg-white/5"></div>
                        </div>
                    </div>

                    {/* Loading indicator */}
                    <div className="text-center text-white/50">
                        <IconLoader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p>Generating AI variations...</p>
                    </div>
                </div>
            );
        }

        const selected = selectedVariation !== null ? variations[selectedVariation] : variations[0];
        const currentIndex = selectedVariation !== null ? selectedVariation : 0;
        const totalVariations = variations.length;

        // Emotion colors (matching Title page)
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

        return (
            <div className="space-y-10 max-w-6xl mx-auto">
                {/* Top Badge - Beaker + Current Selection */}
                <div className="flex justify-center">
                    <div className="flex items-center gap-2 px-5 py-2 rounded-full shadow-lg bg-[#7A5CFA]">
                        <IconFlask className="w-5 h-5 text-white" />
                        <span className="text-base font-bold text-white">Current Selection</span>
                    </div>
                </div>

                {/* THUMBNAIL PREVIEW - Exact copy from Title page */}
                <div className="flex flex-col items-center">
                    <div
                        className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            opacity: 0.65,
                            background: `radial-gradient(ellipse at center, #0a0a0f 0%, ${emotionColors.from}80 80%, ${emotionColors.from} 100%)`,
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
                                <span className="text-lg font-semibold text-white">{primaryEmotion || "Fear"}</span>
                                <span className="text-white/50">•</span>
                                <span className="text-lg font-semibold text-white">Hope</span>
                            </div>

                            {/* Phrase - WHITE and SEMI-BOLD - UPPERCASE */}
                            <div
                                className="px-6 py-3.5 rounded-lg text-3xl font-semibold tracking-tight uppercase"
                                style={{
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    color: "white",
                                    textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
                                }}
                            >
                                {selected?.phrase || phrase || "YOUR PHRASE HERE"}
                            </div>
                        </div>
                    </div>

                    {/* Title Below Thumbnail - Exact copy from Title page */}
                    <div className="mt-10 text-center max-w-3xl space-y-3">
                        {/* Super Topic */}
                        <p className="text-[23px] font-semibold text-white/75">
                            <span className="text-white/60">Super Topic:</span>{" "}
                            Ai Thumbnail Maker For Youtube
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <p className="text-2xl font-bold text-white/75 leading-tight">
                                <span className="text-white/60">Title:</span>{" "}
                                {selected?.title || title}
                            </p>
                            <span className="px-3 py-1 text-sm font-medium rounded border border-[#2BD899]/40 text-[#2BD899]">
                                43 chars
                            </span>
                        </div>
                    </div>
                </div>

                {/* Carousel Section - Matching Title page exactly */}
                <div className="space-y-4">
                    <h3 className="text-base font-semibold text-white/50 uppercase tracking-wider text-center">
                        Browse Polished Variations
                    </h3>

                    {/* Carousel with arrows - MATCHING Title page */}
                    <div className="flex items-center gap-4 justify-center">
                        {/* Left arrow */}
                        <button
                            onClick={handlePrevVariation}
                            disabled={currentIndex === 0}
                            className={`p-3 rounded-full transition-all ${currentIndex === 0
                                ? "text-white/20 cursor-not-allowed"
                                : "text-white/50 hover:text-white/80 hover:bg-white/10"}`}
                        >
                            <IconChevronLeft className="w-7 h-7" />
                        </button>

                        {/* Single Card - MATCHING Title page exactly */}
                        {selected && (
                            <div className="group w-full max-w-2xl p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all">
                                {/* Title */}
                                <p className="text-2xl font-semibold text-white/75 mb-4 leading-snug text-center">
                                    {selected.title}
                                </p>

                                {/* Tags row - centered */}
                                <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                                    {selected.isOriginal ? (
                                        <span className="px-2.5 py-1 text-sm font-semibold rounded-full border bg-white/10 text-white/60 border-white/20">
                                            Original
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 text-sm font-semibold rounded-full border bg-[#C3B6EB]/15 text-[#C3B6EB] border-[#C3B6EB]/30 flex items-center gap-1">
                                            <IconFlask className="w-3 h-3" />
                                            AI Refined
                                        </span>
                                    )}
                                    <span className="px-2.5 py-1 text-sm font-medium rounded-full border bg-[#2BD899]/15 text-[#2BD899] border-[#2BD899]/30">
                                        {(selected.title?.length || 0)} chars
                                    </span>
                                </div>

                                {/* Thumbnail Phrase - WHITE not purple */}
                                <div className="text-center mb-6">
                                    <p className="text-sm text-white/50 mb-2">Thumbnail Text</p>
                                    <p className="text-xl font-bold text-white/90 uppercase">
                                        {selected.phrase}
                                    </p>
                                </div>

                                {/* Improvement Note */}
                                {!selected.isOriginal && selected.improvement && (
                                    <div className="text-center mb-6 px-4">
                                        <p className="text-sm text-white/50 mb-1">Why This Works</p>
                                        <p className="text-base text-white/60 italic">{selected.improvement}</p>
                                    </div>
                                )}

                                {/* Select button - MATCHING Title page */}
                                <button
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-base font-semibold"
                                >
                                    <IconCheck className="w-5 h-5" />
                                    Current Selection
                                </button>
                            </div>
                        )}

                        {/* Right arrow */}
                        <button
                            onClick={handleNextVariation}
                            disabled={currentIndex === totalVariations - 1}
                            className={`p-3 rounded-full transition-all ${currentIndex === totalVariations - 1
                                ? "text-white/20 cursor-not-allowed"
                                : "text-white/50 hover:text-white/80 hover:bg-white/10"}`}
                        >
                            <IconChevronRight className="w-7 h-7" />
                        </button>
                    </div>

                    {/* Page Indicator */}
                    <div className="text-center text-sm text-white/50 font-medium">
                        {currentIndex + 1} of {totalVariations}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleSkipVariations}
                        className="h-[52px] w-[180px] flex items-center justify-center gap-2 px-4 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-white/5 border-2 border-white/10 text-white/75 hover:bg-white/10"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleContinueWithVariation}
                        className="h-[52px] w-[200px] flex items-center justify-center gap-2 px-4 rounded-xl text-base font-semibold whitespace-nowrap transition-all bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] border-2 border-[#2BD899]/30 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]"
                    >
                        <IconCheck className="w-5 h-5" />
                        Use This Version
                    </button>
                </div>

                {/* Change Title Button - Always visible at bottom */}
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleBackToTitle}
                        className="flex items-center gap-2 text-base text-white/40 hover:text-white/60 transition-colors"
                    >
                        <IconChevronLeft className="w-5 h-5" />
                        Change Title
                        <IconChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div >
        );
    };
    const renderStep1 = () => (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-white/90">How many thumbnail concepts?</h2>
                <p className="text-base text-white/75 max-w-2xl mx-auto">
                    Choose how many AI-generated visual concepts you'd like to explore. More concepts give you more variety.
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
                    Select the visual concepts that resonate most with your video's message.
                </p>
                <div className="flex items-center justify-center gap-3 text-sm text-white/60">
                    <span>Phrase: <strong className="text-white/80">{phrase}</strong></span>
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

    if (!topicId) {
        return (
            <PageShell>
                <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                    <MemberHeader />
                    <div className="bg-surface/40 border border-white/10 rounded-2xl p-12 text-center">
                        <p className="text-white/60 text-lg">No topic selected.</p>
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
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="mt-6 px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                        >
                            Start Over
                        </button>
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
                    icon={IconWand}
                    line1="Create Your Perfect"
                    line2="Thumbnail Blueprint"
                    description="Generate AI-powered thumbnail concepts and prompts that stop the scroll."
                />

                <BuilderStepper activeStep={currentStep} />

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((step) => (
                        <div
                            key={step}
                            className={`h-2 rounded-full transition-all ${step < currentStep
                                ? "w-8 bg-[#2BD899]"
                                : step === currentStep
                                    ? "w-12 bg-[#7A5CFA]"
                                    : "w-8 bg-white/10"
                                }`}
                        />
                    ))}
                </div>

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
