"use client";

import React, { useState } from "react";
import { IconLock, IconExternalLink, IconFileDescription, IconStarFilled, IconTrophy, IconMoodSmile, IconTarget, IconFlame, IconArrowUp } from "@tabler/icons-react";

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
    algorithmTargets: string[]; // 2-3 tags from 14 options
    primaryEmotion: string;
    porchTalk: string; // 2 sentences - the personalized pitch
    viewerIntentScore: number; // 0-99
    clickabilityScore: number; // 0-99 - how compelling the phrase is
    // New text sections
    viewerGoalDescription?: string;
    whyThisCouldWork?: string;
    algorithmAngleDescription?: string;
    hook?: string;
}

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
// MOCK DATA - With tier assignments
// =============================================================================

const INITIAL_CANDIDATES: SuperTopicCandidate[] = [
    {
        id: "1",
        phrase: "YouTube Algorithm Secrets",
        growthScore: 92,
        tier: "winner",
        format: "Tutorial",
        algorithmTargets: ["Long-Term Views", "Secret Strategy", "High Intent"],
        primaryEmotion: "Curiosity",
        porchTalk: "Everyone thinks the algorithm is out to get them. I'm going to show you exactly how it actually works so you can stop guessing.",
        viewerIntentScore: 87,
        clickabilityScore: 78,
        viewerGoalDescription: "These viewers want to finally understand how the algorithm works. Intent is high. They're ready to take action and apply what they learn.",
        whyThisCouldWork: "This fits your authority-building style. Viewers expect clear explanations without fluff. Works great as a tutorial or first impressions video.",
        algorithmAngleDescription: "This is a Long-Term Views play with Secret Strategy appeal. High curiosity plus strong intent makes this a winner.",
        hook: "The algorithm isn't broken. You are.",
    },
    {
        id: "2",
        phrase: "YouTube Shorts Algorithm 2025",
        growthScore: 88,
        tier: "runner-up",
        format: "Commentary",
        algorithmTargets: ["Velocity Spike", "Trending"],
        primaryEmotion: "FOMO",
        porchTalk: "Shorts are changing everything. Here's what's actually working right now.",
        viewerIntentScore: 82,
        clickabilityScore: 85,
    },
    {
        id: "3",
        phrase: "Why YouTube Shorts Fail",
        growthScore: 85,
        tier: "runner-up",
        format: "Analysis",
        algorithmTargets: ["High CTR", "Click Trigger"],
        primaryEmotion: "Fear",
        porchTalk: "You're doing everything right but your Shorts still flop. Here's why.",
        viewerIntentScore: 74,
        clickabilityScore: 91,
    },
    {
        id: "4",
        phrase: "How to Beat the Algorithm",
        growthScore: 82,
        tier: "runner-up",
        format: "Tutorial",
        algorithmTargets: ["Evergreen", "Watch Time Booster"],
        primaryEmotion: "Hope",
        porchTalk: "Stop fighting the algorithm. Start working with it.",
        viewerIntentScore: 79,
        clickabilityScore: 72,
    },
];

// Fill positions 5-13 as contenders
for (let i = 5; i <= 13; i++) {
    const baseIndex = (i - 5) % 4;
    const base = INITIAL_CANDIDATES[baseIndex];
    INITIAL_CANDIDATES.push({
        ...base,
        id: String(i),
        phrase: `Video Concept ${i}`,
        growthScore: 78 - (i - 5) * 2,
        tier: "contender",
        algorithmTargets: base.algorithmTargets || ["Contender"],
        porchTalk: base.porchTalk || "A compelling video concept.",
        viewerIntentScore: base.viewerIntentScore || 65,
        clickabilityScore: base.clickabilityScore || 60,
    });
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SuperPageContent() {
    // candidates[0] is always displayed in the Top Tile
    const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
    const [isLocked, setIsLocked] = useState(false);

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

    const handleLock = () => {
        setIsLocked(true);
        // TODO: Save to database, reveal Title Lab
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

    // Early return if no candidates
    if (!topTileCandidate) {
        return <div className="text-white/50">Loading candidates...</div>;
    }

    return (
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
                            {/* Thumbnail - Dynamic tier-based styling */}
                            <div className={`aspect-video rounded-xl bg-gradient-to-br ${style.thumbnailGradient} border ${style.thumbnailBorder} ${style.thumbnailShadow} relative overflow-hidden`}>
                                {/* Glass Shine Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                                {/* Top Left: Score + Growth Fit Label */}
                                <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                                    <div className="px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
                                        <span className={`font-bold text-3xl ${style.text}`}>{topTileCandidate.growthScore}</span>
                                    </div>
                                    <span className="text-2xl font-medium text-white tracking-wide">Growth Fit</span>
                                </div>
                            </div>

                            {/* Info Panel */}
                            <div className="flex flex-col">
                                {/* Phrase Title */}
                                <h2 className="text-3xl font-bold text-white mb-4">
                                    {topTileCandidate.phrase}
                                </h2>

                                {/* Scores Row: Emotion + Viewer Intent + Clickability - Now directly under title */}
                                <div className="flex items-center gap-8 mb-8 p-5 rounded-xl bg-white/[0.03] border border-white/10">
                                    {/* Primary Emotion */}
                                    <div className="flex items-center gap-3">
                                        <IconMoodSmile className="w-6 h-6 text-[#FF6B6B]" />
                                        <span className="text-lg text-white font-medium">{topTileCandidate.primaryEmotion}</span>
                                    </div>

                                    <div className="w-px h-8 bg-white/20"></div>

                                    {/* Viewer Intent Score */}
                                    <div className="flex items-center gap-3">
                                        <IconTarget className="w-6 h-6 text-[#39C7D8]" />
                                        <span className="text-base text-white/60">Intent</span>
                                        <span className="text-2xl font-bold text-[#39C7D8]">{topTileCandidate.viewerIntentScore}</span>
                                    </div>

                                    <div className="w-px h-8 bg-white/20"></div>

                                    {/* Clickability Score */}
                                    <div className="flex items-center gap-3">
                                        <IconFlame className="w-6 h-6 text-[#FFD700]" />
                                        <span className="text-base text-white/60">Clickability</span>
                                        <span className="text-2xl font-bold text-[#FFD700]">{topTileCandidate.clickabilityScore}</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-b border-white/10 mb-6"></div>

                                {/* Why This Topic (Porch Talk + Hook) */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-white/[0.82] uppercase tracking-wide mb-2">Why This Topic:</h4>
                                    <p className="text-white/70 text-lg leading-relaxed">
                                        {topTileCandidate.porchTalk} Open with: "{topTileCandidate.hook || "The algorithm isn't broken. You are."}"
                                    </p>
                                </div>

                                {/* Text Sections - 2 sections */}
                                <div className="space-y-6 mb-6">
                                    {/* Section 1: Viewer Goal (merged with Why This Could Work) */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-white/[0.82] uppercase tracking-wide mb-2">Viewer Goal:</h4>
                                        <p className="text-white/70 text-lg leading-relaxed">
                                            {topTileCandidate.viewerGoalDescription || "These viewers want to finally understand how the algorithm works. Intent is high. They're ready to take action and apply what they learn."}{" "}
                                            {topTileCandidate.whyThisCouldWork || "This fits your authority-building style. Works great as a tutorial or first impressions video."}
                                        </p>
                                    </div>

                                    {/* Section 2: Algorithm Angle */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-white/[0.82] uppercase tracking-wide mb-2">Algorithm Angle:</h4>
                                        <p className="text-white/70 text-lg leading-relaxed">
                                            {topTileCandidate.algorithmAngleDescription || "This is a Long-Term Views play with Secret Strategy appeal. High curiosity plus strong intent makes this a winner."}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons - All same size for consistency */}
                                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                                    {!isLocked ? (
                                        <button
                                            onClick={handleLock}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2BD899]/15 border border-[#2BD899]/40 text-[#2BD899] text-base font-semibold hover:bg-[#2BD899]/25 transition-all"
                                        >
                                            <IconLock className="w-5 h-5" />
                                            Lock This Video
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2BD899]/20 border border-[#2BD899]/50 text-[#2BD899] text-base font-semibold">
                                            <IconLock className="w-5 h-5" />
                                            Locked as Winner
                                        </div>
                                    )}
                                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-base font-medium hover:bg-white/10 transition-all">
                                        <IconFileDescription className="w-5 h-5" />
                                        Report
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-base font-medium hover:bg-white/10 transition-all">
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
    );
}
