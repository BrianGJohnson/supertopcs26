"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconLock, IconExternalLink, IconFileDescription, IconStarFilled, IconTrophy, IconMoodSmile, IconArrowUp, IconVideo, IconTarget, IconFlame, IconBrain, IconLoader2, IconSparkles } from "@tabler/icons-react";
import { LockVideoModal } from "@/components/ui/LockVideoModal";

// =============================================================================
// TYPES
// =============================================================================

type CandidateTier = 'winner' | 'runner-up' | 'contender';

interface SuperTopicCandidate {
    id: string;
    phrase: string;
    growthScore: number;
    tier: CandidateTier; // FIXED by AI scoring - never changes on swap
    format: string;
    primaryBucket: string; // Info, Opinion, Review, etc.
    subFormat: string; // Tutorial, First Impressions, etc.
    alternateFormats?: string[]; // 2 backup formats
    algorithmTargets: string[]; // 2-3 tags from 13 options
    primaryEmotion: string;
    secondaryEmotion?: string;
    viewerGoal?: string; // Learn, Validate, Solve, Vent, Be Entertained
    mindset?: string; // Positive, Negative, Neutral, Insightful
    porchTalk: string; // 2 sentences - the personalized pitch
    viewerIntentScore: number; // 0-99
    clickabilityScore: number; // 0-99 - how compelling the phrase is
    demandScore: number; // 0-99
    opportunityScore: number; // 0-99
    audienceFitScore: number; // 0-99
    topicStrengthScore: number; // 0-99
    // New text sections
    viewerGoalDescription?: string;
    whyThisCouldWork?: string;
    algorithmAngleDescription?: string;
    hook?: string;
}

// Algorithm Target short names for pills
const ALGORITHM_TARGET_SHORT_NAMES: Record<string, string> = {
    "Long-Term Views": "Long-Term",
    "High Click Trigger": "Click Trigger",
    "View Multiplier": "Series Play",
    "High Intent": "High Intent",
    "Polarizing & Engaging": "Polarizing",
    "Return Viewer": "Return Viewer",
    "Masterclass Method": "Masterclass",
    "Trust Builder": "Trust Builder",
    "Transformational View Boost": "Journey Play",
    "Secret Strategy": "Secret",
    "Mistakes & Warnings": "Warnings",
    "Comparison Trigger": "Comparison",
    "Story Hook": "Story Hook",
    "Evergreen": "Evergreen",
    "Trending": "Trending",
    "Velocity Spike": "Velocity",
    "High CTR": "High CTR",
    "Watch Time Booster": "Watch Time",
};

// Algorithm Target colors for pills
const ALGORITHM_TARGET_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    "Long-Term Views": { bg: "bg-[#2BD899]/15", border: "border-[#2BD899]/40", text: "text-[#2BD899]" },
    "Evergreen": { bg: "bg-[#2BD899]/15", border: "border-[#2BD899]/40", text: "text-[#2BD899]" },
    "Secret Strategy": { bg: "bg-[#FFD700]/15", border: "border-[#FFD700]/40", text: "text-[#FFD700]" },
    "High Click Trigger": { bg: "bg-[#FFD700]/15", border: "border-[#FFD700]/40", text: "text-[#FFD700]" },
    "High CTR": { bg: "bg-[#FFD700]/15", border: "border-[#FFD700]/40", text: "text-[#FFD700]" },
    "Polarizing & Engaging": { bg: "bg-[#FF6B6B]/15", border: "border-[#FF6B6B]/40", text: "text-[#FF6B6B]" },
    "Trust Builder": { bg: "bg-[#FF6B6B]/15", border: "border-[#FF6B6B]/40", text: "text-[#FF6B6B]" },
    "High Intent": { bg: "bg-[#39C7D8]/15", border: "border-[#39C7D8]/40", text: "text-[#39C7D8]" },
    "Comparison Trigger": { bg: "bg-[#39C7D8]/15", border: "border-[#39C7D8]/40", text: "text-[#39C7D8]" },
    "Velocity Spike": { bg: "bg-[#F59E0B]/15", border: "border-[#F59E0B]/40", text: "text-[#F59E0B]" },
    "Trending": { bg: "bg-[#F59E0B]/15", border: "border-[#F59E0B]/40", text: "text-[#F59E0B]" },
    "View Multiplier": { bg: "bg-[#7A5CFA]/15", border: "border-[#7A5CFA]/40", text: "text-[#7A5CFA]" },
    "Story Hook": { bg: "bg-[#7A5CFA]/15", border: "border-[#7A5CFA]/40", text: "text-[#7A5CFA]" },
    "Mistakes & Warnings": { bg: "bg-[#EF4444]/15", border: "border-[#EF4444]/40", text: "text-[#EF4444]" },
};

// =============================================================================
// TIER STYLING - Gold/Silver/Blue follows the TIER, not position
// =============================================================================

const TIER_STYLES = {
    winner: {
        bg: "bg-[#FFD700]/5",
        border: "border-[#FFD700]/40",
        text: "text-[#FFD700]",
        label: "Top Candidate",
        pillBg: "bg-[#FFD700]",
        pillText: "text-[#1a1a1a]",
        // Deep rich gold background
        thumbnailGradient: "from-[#594d00] to-[#262000]",
        thumbnailBorder: "border-[#FFD700]/30",
        thumbnailShadow: "shadow-2xl shadow-[#FFD700]/10",
        thumbnailAccent: "text-[#FFD700]/90",
        thumbnailLabel: "text-[#FFD700]/60",
    },
    "runner-up": {
        bg: "bg-white/[0.03]",
        border: "border-white/20",
        text: "text-white/70",
        label: "Runner-Up",
        pillBg: "bg-white/20",
        pillText: "text-white",
        // Deep slate/gunmetal background
        thumbnailGradient: "from-[#334155] to-[#0f172a]",
        thumbnailBorder: "border-white/20",
        thumbnailShadow: "shadow-2xl shadow-white/5",
        thumbnailAccent: "text-white/80",
        thumbnailLabel: "text-white/50",
    },
    contender: {
        bg: "bg-[#39C7D8]/5",
        border: "border-[#39C7D8]/20",
        text: "text-[#39C7D8]",
        label: "Contender",
        pillBg: "bg-[#39C7D8]/20",
        pillText: "text-[#39C7D8]",
        // Deep navy/midnight blue background
        thumbnailGradient: "from-[#1e3a5f] to-[#0a1929]",
        thumbnailBorder: "border-[#39C7D8]/30",
        thumbnailShadow: "shadow-2xl shadow-[#39C7D8]/10",
        thumbnailAccent: "text-[#39C7D8]/90",
        thumbnailLabel: "text-[#39C7D8]/60",
    },
};

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

// Transform database record to UI candidate format
function transformDbToCandidate(dbRecord: {
    id: string;
    phrase: string;
    growth_fit_score?: number | null;
    clickability_score?: number | null;
    intent_score?: number | null;
    primary_bucket?: string | null;
    sub_format?: string | null;
    alternate_formats?: string[] | null;
    primary_emotion?: string | null;
    secondary_emotion?: string | null;
    mindset?: string | null;
    algorithm_targets?: string[] | null;
    viewer_goal?: string | null;
    viewer_angle?: string | null;
    porch_talk?: string | null;
    hook?: string | null;
    viewer_goal_description?: string | null;
    why_this_could_work?: string | null;
    algorithm_angle_description?: string | null;
    demand?: number | null;
    opportunity?: number | null;
    tier?: string | null;
    rank_order?: number | null;
    topic_strength?: number | null;
    audience_fit?: number | null;
}): SuperTopicCandidate {
    return {
        id: dbRecord.id,
        phrase: dbRecord.phrase,
        growthScore: dbRecord.growth_fit_score ?? 50,
        tier: (dbRecord.tier as CandidateTier) || "contender",
        format: dbRecord.sub_format || "Tutorial",
        primaryBucket: dbRecord.primary_bucket || "Info",
        subFormat: dbRecord.sub_format || "Tutorial",
        alternateFormats: dbRecord.alternate_formats || [],
        algorithmTargets: dbRecord.algorithm_targets || [],
        primaryEmotion: dbRecord.primary_emotion || "Curiosity",
        secondaryEmotion: dbRecord.secondary_emotion || undefined,
        viewerGoal: dbRecord.viewer_goal || undefined,
        mindset: dbRecord.mindset || undefined,
        porchTalk: dbRecord.porch_talk || "This topic has great potential.",
        viewerIntentScore: dbRecord.intent_score ?? 50,
        clickabilityScore: dbRecord.clickability_score ?? 50,
        demandScore: dbRecord.demand ?? 50,
        opportunityScore: dbRecord.opportunity ?? 50,
        audienceFitScore: dbRecord.audience_fit ?? 50,
        topicStrengthScore: dbRecord.topic_strength ?? 50,
        viewerGoalDescription: dbRecord.viewer_goal_description || undefined,
        whyThisCouldWork: dbRecord.why_this_could_work || undefined,
        algorithmAngleDescription: dbRecord.algorithm_angle_description || undefined,
        hook: dbRecord.hook || undefined,
    };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SuperPageContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    // State
    const [candidates, setCandidates] = useState<SuperTopicCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const router = useRouter();

    // Helper: Check if candidate has enrichment data
    const hasEnrichment = (c: SuperTopicCandidate) => Boolean(c.porchTalk && c.hook);

    // ==========================================================================
    // DATA LOADING
    // ==========================================================================

    // Fetch existing super topics or generate new ones
    const loadOrGenerateData = useCallback(async () => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // =====================================================================
            // ALWAYS GENERATE FRESH
            // =====================================================================
            // The generate API will:
            // 1. Delete any existing super_topics for this session
            // 2. Score all 13 starred phrases with GPT
            // 3. Assign ranks (1-13) based on stable sorting
            // 4. Assign tiers: rank 1 = winner, ranks 2-4 = runner-up, 5+ = contender
            // 5. Save to database with ONLY ONE winner
            //
            // Database is the single source of truth for tier assignment.
            // UI simply reads and displays what the database says.
            // =====================================================================

            setIsGenerating(true);
            console.log("[SuperPageContent] Generating fresh super topics...");

            const generateResponse = await fetch("/api/super-topics/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });

            if (!generateResponse.ok) {
                const errorData = await generateResponse.json();
                throw new Error(errorData.error || "Failed to generate super topics");
            }

            const result = await generateResponse.json();
            console.log("[SuperPageContent] Generation complete:", result.stats);

            // Transform and set the generated data
            // Tier comes directly from database - we don't recalculate it
            const transformed = result.topics.map(transformDbToCandidate);

            // Sort by growth fit score to establish display order
            transformed.sort((a: SuperTopicCandidate, b: SuperTopicCandidate) =>
                (a.growthScore > b.growthScore ? -1 : 1)
            );
            setCandidates(transformed);

        } catch (err) {
            console.error("[SuperPageContent] Error generating data:", err);
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setIsLoading(false);
            setIsGenerating(false);
        }
    }, [sessionId]);

    // Load data on mount
    useEffect(() => {
        loadOrGenerateData();
    }, [loadOrGenerateData]);

    // The candidate in the Top Tile (position 0)
    const topTileCandidate = candidates[0];

    // Runner-up positions (1-3) and Contender positions (4-12)
    // Note: These positions may contain ANY tier after swaps
    const secondaryCards = candidates.slice(1, 4);
    const contenderRows = candidates.slice(4);

    // ==========================================================================
    // SWAP LOGIC: Direct exchange - swap data, tier follows the data
    // ==========================================================================
    const handleSwap = (clickedId: string) => {
        const clickedIndex = candidates.findIndex((c) => c.id === clickedId);
        if (clickedIndex <= 0) return; // Already at top or not found

        // Direct swap: position 0 ↔ clicked position
        const newCandidates = [...candidates];
        [newCandidates[0], newCandidates[clickedIndex]] = [newCandidates[clickedIndex], newCandidates[0]];

        setCandidates(newCandidates);
    };

    // Open the lock modal instead of locking directly
    const handleLock = () => {
        if (!topTileCandidate) return;
        setShowLockModal(true);
    };

    // Called when user confirms in modal
    const handleLockConfirm = async (selectedFormats: string[]) => {
        if (!topTileCandidate) return;
        setShowLockModal(false);
        setIsLocked(true);

        // Save to database - set is_winner = true and store selected formats
        try {
            await fetch('/api/super-topics/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    superTopicId: topTileCandidate.id,
                    selectedFormats,
                }),
            });

            // Navigate to title page with this phrase
            router.push(`/members/build/title?session_id=${sessionId}&topic_id=${topTileCandidate.id}`);
        } catch (err) {
            console.error('Failed to lock:', err);
        }
    };

    // Unlock full report for a phrase (on-demand enrichment)
    const handleUnlockReport = async () => {
        if (!topTileCandidate || isEnriching) return;

        setIsEnriching(true);
        try {
            const response = await fetch('/api/super-topics/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ superTopicId: topTileCandidate.id }),
            });

            if (response.ok) {
                const result = await response.json();
                // Update the candidate with enrichment data
                const updated = transformDbToCandidate(result.topic);
                setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
            }
        } catch (err) {
            console.error('Failed to enrich:', err);
        } finally {
            setIsEnriching(false);
        }
    };

    // Get styling based on candidate's TIER (not position)
    const getStyle = (tier: CandidateTier) => TIER_STYLES[tier] || TIER_STYLES.contender;

    // Get verbal classification for Growth Fit score
    const getGrowthFitClassification = (score: number): string => {
        if (score >= 90) return "Extreme";
        if (score >= 80) return "Very High";
        if (score >= 70) return "High";
        if (score >= 60) return "Strong";
        if (score >= 50) return "Moderate";
        if (score >= 40) return "Fair";
        if (score >= 30) return "Limited";
        return "Low";
    };

    // ==========================================================================
    // LOADING STATES
    // ==========================================================================

    // No session
    if (!sessionId) {
        return (
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-white/60 text-lg">No session selected.</p>
                <p className="text-white/40 text-sm mt-2">
                    Please start from the Refine page with a session.
                </p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl p-12 text-center">
                <p className="text-red-400 text-lg">Something went wrong</p>
                <p className="text-white/50 text-sm mt-2">{error}</p>
                <button
                    onClick={() => loadOrGenerateData()}
                    className="mt-6 px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Loading / Generating state
    if (isLoading || isGenerating) {
        return (
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
                <div className="flex flex-col items-center gap-6">
                    <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
                    <div>
                        <p className="text-white/80 text-xl font-medium">
                            {isGenerating ? "Analyzing Your Topics with AI..." : "Loading..."}
                        </p>
                        {isGenerating && (
                            <p className="text-white/50 text-base mt-2">
                                GPT-5 mini is generating insights for 13 phrases. This may take 30-60 seconds.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // No candidates (shouldn't happen if generation succeeded)
    if (!topTileCandidate) {
        return <div className="text-white/50">No candidates found. Please try again.</div>;
    }

    return (
        <>
            <div className="space-y-10">
                {/* ================================================================== */}
                {/* TOP TILE - Styling follows the candidate's TIER */}
                {/* ================================================================== */}
                {(() => {
                    const style = getStyle(topTileCandidate.tier);
                    return (
                        <div className={`relative p-8 rounded-3xl border-2 transition-all ${style.bg} ${style.border}`}>
                            {/* Tier Badge - Shows the candidate's actual tier */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                <div className={`flex items-center gap-2 px-5 py-2 rounded-full shadow-lg ${style.pillBg}`}>
                                    <IconTrophy className={`w-5 h-5 ${style.pillText}`} />
                                    <span className={`text-base font-bold ${style.pillText}`}>
                                        {style.label}
                                    </span>
                                </div>
                            </div>

                            {/* Content Grid - 40/60 Split */}
                            <div className="grid grid-cols-[40%_1fr] gap-8 mt-6">
                                {/* Left Column: Thumbnail + Metrics + Breakdown */}
                                <div className="flex flex-col gap-6">
                                    {/* Thumbnail - Dynamic tier-based styling */}
                                    <div className={`aspect-video rounded-xl bg-gradient-to-br ${style.thumbnailGradient} border ${style.thumbnailBorder} ${style.thumbnailShadow} relative overflow-hidden`}>
                                        {/* Glass Shine Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                                        {/* Top Left: Stacked Format + Emotion Display */}
                                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                            {/* Format Display with video icon + 2 sub-formats */}
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
                                                <IconVideo className="w-5 h-5 text-white" />
                                                <span className="text-base font-medium text-white">
                                                    {topTileCandidate.primaryBucket}: {topTileCandidate.subFormat}
                                                    {topTileCandidate.alternateFormats?.[0] && ` / ${topTileCandidate.alternateFormats[0]}`}
                                                </span>
                                            </div>

                                            {/* Emotion Display with primary • secondary */}
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
                                                <IconMoodSmile className="w-5 h-5 text-[#FF6B6B]" />
                                                <span className="text-base font-medium text-white">{topTileCandidate.primaryEmotion}</span>
                                                <span className="text-white/50">•</span>
                                                <span className="text-base font-medium text-white">{topTileCandidate.secondaryEmotion || "Hope"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demand & Opportunity Boxes - Shorter */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Demand Box */}
                                        <div className="py-5 rounded-xl bg-gradient-to-br from-[#2BD899]/10 to-[#1a1a1a] border border-[#2BD899]/30 flex flex-col items-center justify-center">
                                            <span className="text-sm font-semibold text-[#2BD899]/70 uppercase tracking-wider mb-1">Demand</span>
                                            <span className="text-4xl font-bold text-[#2BD899]">{topTileCandidate.demandScore}</span>
                                        </div>

                                        {/* Opportunity Box */}
                                        <div className="py-5 rounded-xl bg-gradient-to-br from-[#FF9F43]/10 to-[#1a1a1a] border border-[#FF9F43]/30 flex flex-col items-center justify-center">
                                            <span className="text-sm font-semibold text-[#FF9F43]/70 uppercase tracking-wider mb-1">Opportunity</span>
                                            <span className="text-4xl font-bold text-[#FF9F43]">{topTileCandidate.opportunityScore}</span>
                                        </div>
                                    </div>

                                    {/* Algorithm Targets Pills */}
                                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                                        <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">Algorithm Targets</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {topTileCandidate.algorithmTargets.slice(0, 3).map((target, idx) => {
                                                const colors = ALGORITHM_TARGET_COLORS[target] || { bg: "bg-white/10", border: "border-white/20", text: "text-white" };
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`px-3 py-2.5 rounded-lg ${colors.bg} border ${colors.border} text-center`}
                                                    >
                                                        <span className={`text-sm font-medium ${colors.text}`}>
                                                            {ALGORITHM_TARGET_SHORT_NAMES[target] || target}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Score Breakdown Section */}
                                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5">
                                        <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Score Breakdown</h4>
                                        <div className="space-y-4">
                                            {/* Growth Fit Score */}
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-white/[0.72] w-28 shrink-0">Growth Fit</span>
                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#2BD899] to-[#2BD899]/60 rounded-full transition-all"
                                                        style={{ width: `${topTileCandidate.growthScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-[#2BD899] w-10 text-right">+{topTileCandidate.growthScore}</span>
                                            </div>

                                            {/* Audience Fit Score */}
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-white/[0.72] w-28 shrink-0">Audience Fit</span>
                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#39C7D8] to-[#39C7D8]/60 rounded-full transition-all"
                                                        style={{ width: `${topTileCandidate.audienceFitScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-[#39C7D8] w-10 text-right">+{topTileCandidate.audienceFitScore}</span>
                                            </div>

                                            {/* Topic Strength Score */}
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-white/[0.72] w-28 shrink-0">Topic Strength</span>
                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFD700]/60 rounded-full transition-all"
                                                        style={{ width: `${topTileCandidate.topicStrengthScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-[#FFD700] w-10 text-right">+{topTileCandidate.topicStrengthScore}</span>
                                            </div>

                                            {/* Intent Score */}
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-white/[0.72] w-28 shrink-0">Intent</span>
                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#F59E0B] to-[#F59E0B]/60 rounded-full transition-all"
                                                        style={{ width: `${topTileCandidate.viewerIntentScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-[#F59E0B] w-10 text-right">+{topTileCandidate.viewerIntentScore}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Panel */}
                                <div className="flex flex-col">
                                    {/* Phrase Title */}
                                    <h2 className="text-3xl font-bold text-white mb-4">
                                        {topTileCandidate.phrase}
                                    </h2>

                                    {/* Scores Row: Viewer Goal | Clickability | Mindset - Icons colored, text uniform */}
                                    <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                                        {/* Viewer Goal */}
                                        <div className="flex items-center gap-2">
                                            <IconTarget className="w-5 h-5 text-[#39C7D8]" />
                                            <span className="text-base font-medium text-white/[0.72]">Viewer Goal: {topTileCandidate.viewerGoal || "Learn"}</span>
                                        </div>

                                        <div className="w-px h-6 bg-white/20"></div>

                                        {/* Clickability Score */}
                                        <div className="flex items-center gap-2">
                                            <IconFlame className="w-5 h-5 text-[#FFD700]" />
                                            <span className="text-base font-medium text-white/[0.72]">Clickability: {topTileCandidate.clickabilityScore}</span>
                                        </div>

                                        <div className="w-px h-6 bg-white/20"></div>

                                        {/* Mindset */}
                                        <div className="flex items-center gap-2">
                                            <IconBrain className="w-5 h-5 text-[#A78BFA]" />
                                            <span className="text-base font-medium text-white/[0.72]">Mindset: {topTileCandidate.mindset || "Positive"}</span>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-b border-white/10 mb-6"></div>

                                    {/* Content Sections - Show enrichment or Unlock button */}
                                    {hasEnrichment(topTileCandidate) ? (
                                        <>
                                            {/* Why This Topic (Porch Talk) */}
                                            <div className="mb-6">
                                                <h4 className="text-lg font-semibold text-white/[0.82] uppercase tracking-wide mb-2">Why This Topic:</h4>
                                                <p className="text-white/[0.72] text-lg leading-relaxed">
                                                    {topTileCandidate.porchTalk}
                                                </p>
                                            </div>

                                            {/* Text Sections */}
                                            <div className="space-y-6 mb-6">
                                                {/* Viewer Goal */}
                                                <div>
                                                    <h4 className="text-lg font-semibold text-white/[0.82] uppercase tracking-wide mb-2">Viewer Goal:</h4>
                                                    <p className="text-white/[0.72] text-lg leading-relaxed">
                                                        {topTileCandidate.viewerGoalDescription}{" "}
                                                        {topTileCandidate.whyThisCouldWork}
                                                    </p>
                                                </div>

                                                {/* Algorithm Angle */}
                                                <div>
                                                    <h4 className="text-lg font-semibold text-white/[0.82] uppercase tracking-wide mb-2">Algorithm Angle:</h4>
                                                    <p className="text-white/[0.72] text-lg leading-relaxed">
                                                        {topTileCandidate.algorithmAngleDescription}
                                                    </p>
                                                </div>

                                                {/* Hook */}
                                                <div>
                                                    <h4 className="text-lg font-semibold text-white/[0.82] uppercase tracking-wide mb-2">Hook:</h4>
                                                    <p className="text-white/[0.72] text-lg leading-relaxed">
                                                        {topTileCandidate.hook}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Unlock Full Report - shown when no enrichment data */
                                        <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-[#7A5CFA]/10 to-[#39C7D8]/10 border border-[#7A5CFA]/30">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-[#7A5CFA]/20">
                                                    <IconSparkles className="w-6 h-6 text-[#7A5CFA]" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-white mb-2">Unlock Full Report</h4>
                                                    <p className="text-white/60 text-base mb-4">
                                                        Get the complete analysis for this phrase including Why This Topic, Viewer Goal, Algorithm Angle, and Opening Hook.
                                                    </p>
                                                    <button
                                                        onClick={handleUnlockReport}
                                                        disabled={isEnriching}
                                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A5CFA]/20 border border-[#7A5CFA]/40 text-[#7A5CFA] text-base font-medium hover:bg-[#7A5CFA]/30 transition-all disabled:opacity-50"
                                                    >
                                                        {isEnriching ? (
                                                            <><IconLoader2 className="w-5 h-5 animate-spin" /> Generating...</>
                                                        ) : (
                                                            <><IconSparkles className="w-5 h-5" /> Generate Report</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons - Equal width, distinct colors */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                                        {!isLocked ? (
                                            <button
                                                onClick={handleLock}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2BD899]/15 border border-[#2BD899]/40 text-[#2BD899] text-base font-semibold hover:bg-[#2BD899]/25 transition-all"
                                            >
                                                <IconLock className="w-5 h-5" />
                                                Lock This Video
                                            </button>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2BD899]/20 border border-[#2BD899]/50 text-[#2BD899] text-base font-semibold">
                                                <IconLock className="w-5 h-5" />
                                                Locked as Winner
                                            </div>
                                        )}
                                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-base font-medium hover:bg-[#F59E0B]/20 transition-all">
                                            <IconFileDescription className="w-5 h-5" />
                                            Report
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#39C7D8]/10 border border-[#39C7D8]/30 text-[#39C7D8] text-base font-medium hover:bg-[#39C7D8]/20 transition-all">
                                            <IconExternalLink className="w-5 h-5" />
                                            View on YouTube
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ================================================================== */}
                {/* RUNNERS-UP CARDS (Positions 1-3) - Styling follows each card's TIER */}
                {/* ================================================================== */}
                <div className="space-y-5">
                    <h3 className="text-2xl font-semibold text-white/70">Runners-Up</h3>
                    <div className="grid grid-cols-3 gap-6">
                        {secondaryCards.map((candidate) => {
                            const style = getStyle(candidate.tier);
                            return (
                                <div
                                    key={candidate.id}
                                    className={`p-6 rounded-2xl transition-all hover:scale-[1.02] ${style.bg} border-2 ${style.border}`}
                                >
                                    {/* Tier Badge */}
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${style.pillBg} ${style.pillText}`}>
                                        {style.label}
                                    </div>

                                    {/* Thumbnail with Growth Score Overlay */}
                                    <div className={`aspect-[16/10] rounded-xl bg-gradient-to-br ${style.thumbnailGradient} border ${style.thumbnailBorder} mb-4 flex items-center justify-center relative`}>
                                        <IconStarFilled className={`w-10 h-10 ${style.text} opacity-30`} />
                                        {/* Growth Score Badge */}
                                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
                                            <span className={`font-bold text-xl ${style.text}`}>{candidate.growthScore}</span>
                                        </div>
                                    </div>

                                    {/* Phrase */}
                                    <h4 className="text-2xl font-bold text-white/90 mb-3 line-clamp-2 leading-tight">
                                        {candidate.phrase}
                                    </h4>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="px-3 py-1.5 rounded-lg text-base bg-white/10 text-white/70 font-medium">
                                            {candidate.primaryEmotion}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg text-base bg-primary/15 text-primary/80 font-medium">
                                            {candidate.format}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleSwap(candidate.id)}
                                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all`}
                                        >
                                            <IconArrowUp className="w-5 h-5" />
                                            Swap to Top
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all">
                                                <IconFileDescription className="w-5 h-5" />
                                                Report
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all">
                                                <IconExternalLink className="w-5 h-5" />
                                                YouTube
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ================================================================== */}
                {/* CONTENDERS (Positions 4-12) - Grid layout matching Runners-Up */}
                {/* ================================================================== */}
                <div className="space-y-5">
                    <h3 className="text-2xl font-semibold text-[#39C7D8]">Contenders</h3>
                    <div className="grid grid-cols-3 gap-6">
                        {contenderRows.map((candidate) => {
                            const style = getStyle(candidate.tier);
                            return (
                                <div
                                    key={candidate.id}
                                    className={`p-6 rounded-2xl transition-all hover:scale-[1.02] ${style.bg} border-2 ${style.border}`}
                                >
                                    {/* Tier Badge */}
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${style.pillBg} ${style.pillText}`}>
                                        {style.label}
                                    </div>

                                    {/* Thumbnail with Growth Score Overlay */}
                                    <div className={`aspect-[16/10] rounded-xl bg-gradient-to-br ${style.thumbnailGradient} border ${style.thumbnailBorder} mb-4 flex items-center justify-center relative`}>
                                        <IconStarFilled className={`w-10 h-10 ${style.text} opacity-30`} />
                                        {/* Growth Score Badge */}
                                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
                                            <span className={`font-bold text-xl ${style.text}`}>{candidate.growthScore}</span>
                                        </div>
                                    </div>

                                    {/* Phrase */}
                                    <h4 className="text-2xl font-bold text-white/90 mb-3 line-clamp-2 leading-tight">
                                        {candidate.phrase}
                                    </h4>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="px-3 py-1.5 rounded-lg text-base bg-white/10 text-white/70 font-medium">
                                            {candidate.primaryEmotion}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg text-base bg-primary/15 text-primary/80 font-medium">
                                            {candidate.format}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleSwap(candidate.id)}
                                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all`}
                                        >
                                            <IconArrowUp className="w-5 h-5" />
                                            Swap to Top
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all">
                                                <IconFileDescription className="w-5 h-5" />
                                                Report
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all">
                                                <IconExternalLink className="w-5 h-5" />
                                                YouTube
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div >

            {/* Lock Video Modal */}
            <LockVideoModal
                isOpen={showLockModal}
                onClose={() => setShowLockModal(false)}
                phrase={topTileCandidate?.phrase || ""}
                primaryBucket={topTileCandidate?.primaryBucket}
                recommendedFormat={topTileCandidate?.subFormat}
                alternateFormats={topTileCandidate?.alternateFormats}
                onConfirm={handleLockConfirm}
            />
        </>
    );
}
