"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    IconPalette,
    IconTypography,
    IconPhoto,
    IconUser,
    IconColumns,
    IconBox,
    IconCheck,
    IconArrowRight,
    IconArrowLeft,
    IconCopy,
    IconSparkles,
    IconChevronLeft,
    IconChevronRight,
    IconLoader2,
    IconRefresh,
} from "@tabler/icons-react";

// =============================================================================
// TYPES
// =============================================================================

type ThumbnailType = "graphic_text" | "face_text" | "object" | "typography" | "split";
type VisualStyle = "dramatic" | "clean" | "techy" | "illustrated" | "realistic";
type ColorMode = "auto" | "dark" | "light";
type TextPosition = "top_left" | "top_center" | "top_right" | "bottom" | "center";
type TextStyle = "bold_impact" | "clean_sans" | "handwritten";

interface ThumbnailBlueprint {
    thumbnailType: ThumbnailType | null;
    visualStyle: VisualStyle | null;
    colorMode: ColorMode;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    textPosition: TextPosition;
    textStyle: TextStyle;
    phrase: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const THUMBNAIL_TYPES = [
    { id: "graphic_text" as ThumbnailType, label: "Graphic + Text", icon: IconPalette, description: "Bold imagery with your phrase overlaid" },
    { id: "face_text" as ThumbnailType, label: "Face + Text", icon: IconUser, description: "Your face or reaction with phrase" },
    { id: "object" as ThumbnailType, label: "Object Focus", icon: IconBox, description: "Single striking object tells the story" },
    { id: "typography" as ThumbnailType, label: "Pure Typography", icon: IconTypography, description: "Text IS the thumbnail" },
    { id: "split" as ThumbnailType, label: "Split / Comparison", icon: IconColumns, description: "Before/after, vs, choices" },
];

const VISUAL_STYLES = [
    { id: "dramatic" as VisualStyle, label: "Dramatic", description: "High contrast, intense" },
    { id: "clean" as VisualStyle, label: "Clean & Modern", description: "Minimal, professional" },
    { id: "techy" as VisualStyle, label: "Techy", description: "Digital, futuristic" },
    { id: "illustrated" as VisualStyle, label: "Illustrated", description: "Artistic, stylized" },
    { id: "realistic" as VisualStyle, label: "Realistic", description: "Photo-real, natural" },
];

const EMOTION_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
    Curiosity: { primary: "#1E3A5F", secondary: "#00D9FF", accent: "#FFFFFF" },
    Fear: { primary: "#CC0000", secondary: "#FF6B00", accent: "#000000" },
    FOMO: { primary: "#CC0000", secondary: "#FF6B00", accent: "#000000" },
    Excitement: { primary: "#FFD93D", secondary: "#FFC107", accent: "#000000" },
    Hope: { primary: "#2BD899", secondary: "#00A896", accent: "#FFFFFF" },
    Anger: { primary: "#8B0000", secondary: "#1A1A1A", accent: "#FFFFFF" },
};

const TEXT_POSITIONS = [
    { id: "top_left" as TextPosition, label: "Top Left" },
    { id: "top_center" as TextPosition, label: "Top Center" },
    { id: "top_right" as TextPosition, label: "Top Right" },
    { id: "bottom" as TextPosition, label: "Bottom Banner" },
    { id: "center" as TextPosition, label: "Center Large" },
];

const TEXT_STYLES = [
    { id: "bold_impact" as TextStyle, label: "Bold Impact", fontClass: "font-black uppercase" },
    { id: "clean_sans" as TextStyle, label: "Clean Sans", fontClass: "font-semibold" },
    { id: "handwritten" as TextStyle, label: "Handwritten", fontClass: "font-medium italic" },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function BlueprintPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");
    const topicId = searchParams.get("topic_id");

    // Wizard step (1-5)
    const [currentStep, setCurrentStep] = useState(1);

    // Blueprint state
    const [blueprint, setBlueprint] = useState<ThumbnailBlueprint>({
        thumbnailType: null,
        visualStyle: null,
        colorMode: "auto",
        primaryColor: "#1E3A5F",
        secondaryColor: "#00D9FF",
        accentColor: "#FFFFFF",
        textPosition: "top_center",
        textStyle: "bold_impact",
        phrase: "YOUR PHRASE HERE",
    });

    // Data from SuperTopic
    const [phrase, setPhrase] = useState("");
    const [emotion, setEmotion] = useState("Curiosity");
    const [mindset, setMindset] = useState("");
    const [phrases, setPhrases] = useState<string[]>([]);
    const [selectedTitle, setSelectedTitle] = useState("");
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [primaryBucket, setPrimaryBucket] = useState("");
    const [subFormat, setSubFormat] = useState("");
    const [channelNiche, setChannelNiche] = useState("");

    // New: User hint and format selection
    const [userHint, setUserHint] = useState("");
    const [selectedFormat, setSelectedFormat] = useState(""); // Narrowed from selected_formats

    // AI enhancement state
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedPrompt, setEnhancedPrompt] = useState("");

    // Load full SuperTopic data from database
    useEffect(() => {
        const loadSuperTopic = async () => {
            if (!topicId) return;

            try {
                const response = await fetch(`/api/super-topics/get?id=${topicId}`);
                if (!response.ok) throw new Error('Failed to load topic');

                const { topic } = await response.json();

                // Set all available data
                setPhrase(topic.phrase || "");
                setSelectedTitle(topic.locked_title || "");
                setEmotion(topic.primary_emotion || "Curiosity");
                setMindset(topic.mindset || "");
                setPrimaryBucket(topic.primary_bucket || "");
                setSubFormat(topic.sub_format || "");
                setSelectedFormats(topic.selected_formats || []);
                setChannelNiche(topic.channel?.niche || "");

                // Set phrase in blueprint
                setBlueprint((prev) => ({ ...prev, phrase: topic.phrase || "YOUR PHRASE HERE" }));

                // Set colors based on emotion
                const emotionKey = topic.primary_emotion || "Curiosity";
                if (EMOTION_COLORS[emotionKey]) {
                    const colors = EMOTION_COLORS[emotionKey];
                    setBlueprint((prev) => ({
                        ...prev,
                        primaryColor: colors.primary,
                        secondaryColor: colors.secondary,
                        accentColor: colors.accent,
                    }));
                }
            } catch (error) {
                console.error('[Blueprint] Error loading topic:', error);
            }
        };

        loadSuperTopic();
    }, [topicId]);

    // ==========================================================================
    // HANDLERS
    // ==========================================================================

    const handleNext = () => {
        if (currentStep < 5) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleCopyPrompt = () => {
        const prompt = enhancedPrompt || generateBasicPrompt();
        navigator.clipboard.writeText(prompt);
        // TODO: Show toast notification
    };

    const generateBasicPrompt = () => {
        const typeLabel = THUMBNAIL_TYPES.find((t) => t.id === blueprint.thumbnailType)?.label || "Graphic";
        const styleLabel = VISUAL_STYLES.find((s) => s.id === blueprint.visualStyle)?.label || "Dramatic";
        const positionLabel = TEXT_POSITIONS.find((p) => p.id === blueprint.textPosition)?.label || "Top Center";
        const textStyleLabel = TEXT_STYLES.find((s) => s.id === blueprint.textStyle)?.label || "Bold Impact";

        return `YouTube thumbnail, 16:9 aspect ratio

TOPIC: "${blueprint.phrase}"
VIDEO TITLE: "${selectedTitle}"

STYLE: ${styleLabel}, high contrast
COLORS: Primary ${blueprint.primaryColor}, Secondary ${blueprint.secondaryColor}, Text ${blueprint.accentColor}
COMPOSITION: ${typeLabel} layout

TEXT: "${blueprint.phrase}"
- Position: ${positionLabel}
- Font style: ${textStyleLabel}
- Color: ${blueprint.accentColor}

IMAGERY:
- ${blueprint.thumbnailType === "face_text" ? "Person with expressive reaction" : "Bold graphic elements"}
- ${blueprint.visualStyle === "techy" ? "Tech/circuit patterns in background" : "Clean background"}
- Dramatic lighting
- ${blueprint.colorMode === "dark" ? "Dark background" : "Contrasting background"}

EMOTION: ${emotion}`;
    };

    const handleEnhancePrompt = async () => {
        if (!blueprint.thumbnailType || !blueprint.visualStyle) return;

        setIsEnhancing(true);

        try {
            const response = await fetch('/api/thumbnail/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phrase: blueprint.phrase,
                    title: selectedTitle,
                    thumbnailType: blueprint.thumbnailType,
                    visualStyle: blueprint.visualStyle,
                    textPosition: blueprint.textPosition,
                    textStyle: blueprint.textStyle,
                    primaryColor: blueprint.primaryColor,
                    secondaryColor: blueprint.secondaryColor,
                    accentColor: blueprint.accentColor,
                    emotion,
                    mindset,
                    userHint: userHint || undefined,
                    channelNiche: channelNiche || undefined,
                    videoFormat: selectedFormat || subFormat || undefined,
                }),
            });

            if (response.ok) {
                const { enhancedPrompt: prompt, stats } = await response.json();
                setEnhancedPrompt(prompt);
                console.log(`[Blueprint] Enhanced prompt in ${stats.durationMs}ms (${stats.costCents}¢)`);
            }
        } catch (error) {
            console.error('[Blueprint] Enhancement error:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    // Auto-enhance when reaching step 5
    useEffect(() => {
        if (currentStep === 5 && !enhancedPrompt && !isEnhancing) {
            handleEnhancePrompt();
        }
    }, [currentStep]);

    // ==========================================================================
    // RENDER HELPERS
    // ==========================================================================

    const canProceed = () => {
        if (currentStep === 1) return blueprint.thumbnailType !== null;
        if (currentStep === 2) return blueprint.visualStyle !== null;
        return true;
    };

    // Step indicator - now uses blue theme
    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
                <div
                    key={step}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step === currentStep
                        ? "bg-gradient-to-b from-[#5AACFF]/20 to-[#4A9CFF]/20 border-2 border-[#5AACFF]/50 text-[#A0DCFF] shadow-[0_0_12px_rgba(90,172,255,0.15)]"
                        : step < currentStep
                            ? "bg-[#2BD899]/20 border-2 border-[#2BD899]/40 text-[#4AE8B0]"
                            : "bg-white/5 border-2 border-white/10 text-white/40"
                        }`}
                >
                    {step < currentStep ? <IconCheck className="w-5 h-5" /> : step}
                </div>
            ))}
        </div>
    );

    // ==========================================================================
    // STEP RENDERS
    // ==========================================================================

    const renderStep1 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">What kind of thumbnail?</h2>
            <p className="text-white/60 text-center">Choose the style that fits your video</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {THUMBNAIL_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = blueprint.thumbnailType === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setBlueprint({ ...blueprint, thumbnailType: type.id })}
                            className={`p-6 rounded-xl border-2 transition-all text-left ${isSelected
                                ? "border-[#5AACFF] bg-[#5AACFF]/15 shadow-[0_0_15px_rgba(90,172,255,0.1)]"
                                : "border-white/10 bg-white/5 hover:border-[#5AACFF]/40 hover:bg-white/10"
                                }`}
                        >
                            <Icon className={`w-8 h-8 mb-3 ${isSelected ? "text-[#5AACFF]" : "text-white/60"}`} />
                            <h3 className="text-lg font-semibold text-white">{type.label}</h3>
                            <p className="text-sm text-white/50 mt-1">{type.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">What&apos;s the vibe?</h2>
            <p className="text-white/60 text-center">Choose a visual style for your thumbnail</p>

            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                {VISUAL_STYLES.map((style) => {
                    const isSelected = blueprint.visualStyle === style.id;
                    return (
                        <button
                            key={style.id}
                            onClick={() => setBlueprint({ ...blueprint, visualStyle: style.id })}
                            className={`px-6 py-3 rounded-full border-2 transition-all ${isSelected
                                ? "border-[#5AACFF] bg-[#5AACFF]/15 text-[#A0DCFF] shadow-[0_0_10px_rgba(90,172,255,0.1)]"
                                : "border-white/20 bg-white/5 text-white/70 hover:border-[#5AACFF]/40"
                                }`}
                        >
                            <span className="font-semibold">{style.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Colors</h2>
            <p className="text-white/60 text-center">
                Based on your emotion ({emotion}), we suggest these colors
            </p>

            {/* Color swatches */}
            <div className="flex justify-center gap-4">
                <div className="text-center">
                    <div
                        className="w-16 h-16 rounded-xl border-2 border-white/20"
                        style={{ backgroundColor: blueprint.primaryColor }}
                    />
                    <p className="text-xs text-white/50 mt-2">Primary</p>
                </div>
                <div className="text-center">
                    <div
                        className="w-16 h-16 rounded-xl border-2 border-white/20"
                        style={{ backgroundColor: blueprint.secondaryColor }}
                    />
                    <p className="text-xs text-white/50 mt-2">Secondary</p>
                </div>
                <div className="text-center">
                    <div
                        className="w-16 h-16 rounded-xl border-2 border-white/20"
                        style={{ backgroundColor: blueprint.accentColor }}
                    />
                    <p className="text-xs text-white/50 mt-2">Text</p>
                </div>
            </div>

            {/* Color mode toggle */}
            <div className="flex justify-center gap-3">
                {(["auto", "dark", "light"] as ColorMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setBlueprint({ ...blueprint, colorMode: mode })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${blueprint.colorMode === mode
                            ? "border-[#5AACFF] bg-[#5AACFF]/15 text-[#A0DCFF]"
                            : "border-white/20 text-white/60 hover:border-[#5AACFF]/40"
                            }`}
                    >
                        {mode === "auto" ? "Suggested" : mode === "dark" ? "Dark Mode" : "Light Mode"}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Text Layout</h2>
            <p className="text-white/60 text-center">Where should your phrase appear?</p>

            {/* Phrase display */}
            <div className="text-center">
                <p className="text-lg text-white/80 mb-4">Your phrase:</p>
                <p className="text-2xl font-bold text-[#5AACFF]">&quot;{blueprint.phrase}&quot;</p>
            </div>

            {/* Position selector */}
            <div className="flex flex-wrap justify-center gap-3">
                {TEXT_POSITIONS.map((pos) => (
                    <button
                        key={pos.id}
                        onClick={() => setBlueprint({ ...blueprint, textPosition: pos.id })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${blueprint.textPosition === pos.id
                            ? "border-[#5AACFF] bg-[#5AACFF]/15 text-[#A0DCFF]"
                            : "border-white/20 text-white/60 hover:border-[#5AACFF]/40"
                            }`}
                    >
                        {pos.label}
                    </button>
                ))}
            </div>

            {/* Text style selector */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
                {TEXT_STYLES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setBlueprint({ ...blueprint, textStyle: style.id })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${style.fontClass} ${blueprint.textStyle === style.id
                            ? "border-[#5AACFF] bg-[#5AACFF]/15 text-[#A0DCFF]"
                            : "border-white/20 text-white/60 hover:border-[#5AACFF]/40"
                            }`}
                    >
                        {style.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Your Thumbnail Blueprint</h2>
            <p className="text-white/60 text-center">AI-enhanced prompt ready to use</p>

            {/* Optional user hint */}
            <div className="max-w-2xl mx-auto space-y-3">
                <label className="block text-sm font-medium text-white/70">
                    💡 Want to guide the visual? (Optional)
                </label>
                <input
                    type="text"
                    value={userHint}
                    onChange={(e) => setUserHint(e.target.value)}
                    onBlur={handleEnhancePrompt}
                    placeholder='e.g., "Show a robot", "Use dark colors", "Make it look scary"'
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#5AACFF]/50"
                />
                <p className="text-xs text-white/40">Leave blank for AI to decide</p>
            </div>

            {/* Enhanced prompt display */}
            <div className="max-w-3xl mx-auto">
                {isEnhancing ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <IconLoader2 className="w-8 h-8 text-[#5AACFF] animate-spin mx-auto mb-4" />
                        <p className="text-white/60">Enhancing your prompt with GPT-5 mini...</p>
                    </div>
                ) : enhancedPrompt ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Enhanced Prompt</h3>
                            <button
                                onClick={handleEnhancePrompt}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-sm transition-all"
                            >
                                <IconRefresh className="w-4 h-4" />
                                Regenerate
                            </button>
                        </div>
                        <pre className="text-sm text-white/75 whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-lg overflow-x-auto">
                            {enhancedPrompt}
                        </pre>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <pre className="text-sm text-white/75 whitespace-pre-wrap font-mono">
                            {generateBasicPrompt()}
                        </pre>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                    <IconCopy className="w-5 h-5" />
                    <span>Copy Prompt</span>
                </button>
                <button
                    disabled
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/50 text-white/50 cursor-not-allowed"
                    title="Coming soon!"
                >
                    <IconSparkles className="w-5 h-5" />
                    <span>Generate (Coming Soon)</span>
                </button>
            </div>
        </div>
    );

    // ==========================================================================
    // MAIN RENDER
    // ==========================================================================

    if (!topicId) {
        return (
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-white/60 text-lg">No topic selected.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Step content */}
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
            </div>

            {/* Step indicator - moved to bottom */}
            <StepIndicator />

            {/* Navigation */}
            {currentStep < 5 && (
                <div className="flex justify-center gap-4">
                    {currentStep > 1 && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all"
                        >
                            <IconArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold transition-all ${canProceed()
                            ? "bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15 hover:from-[#5AACFF]/20 hover:to-[#4A9CFF]/20 text-[#A0DCFF] border-2 border-[#5AACFF]/40 shadow-[0_0_10px_rgba(90,172,255,0.1)] hover:shadow-[0_0_12px_rgba(90,172,255,0.15)]"
                            : "bg-[#5AACFF]/10 border-2 border-[#5AACFF]/20 text-[#A0DCFF]/50 cursor-not-allowed"
                            }`}
                    >
                        <IconArrowLeft className="w-5 h-5 rotate-180" />
                        <span>Next</span>
                        <IconArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
