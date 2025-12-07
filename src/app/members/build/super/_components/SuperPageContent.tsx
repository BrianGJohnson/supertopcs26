"use client";

import React, { useState } from "react";
import { IconLock, IconExternalLink, IconFileDescription, IconStarFilled, IconTrophy, IconMoodSmile, IconTarget, IconBulb, IconFlame, IconArrowUp } from "@tabler/icons-react";

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
    subType: string;
    bucket: string;
    intent: string;
    mindset: string;
    primaryEmotion: string;
    secondaryEmotion: string;
    porchPitch: string;
    angle: string;
    whyItWins: string;
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
        thumbnailGradient: "from-[#FFD700]/20 to-[#FFD700]/5",
        thumbnailBorder: "border-[#FFD700]/20",
    },
    "runner-up": {
        bg: "bg-white/[0.03]",
        border: "border-white/20",
        text: "text-white/70",
        label: "Runner-Up",
        pillBg: "bg-white/20",
        pillText: "text-white",
        thumbnailGradient: "from-white/10 to-white/5",
        thumbnailBorder: "border-white/10",
    },
    contender: {
        bg: "bg-[#39C7D8]/5",
        border: "border-[#39C7D8]/20",
        text: "text-[#39C7D8]",
        label: "Contender",
        pillBg: "bg-[#39C7D8]/20",
        pillText: "text-[#39C7D8]",
        thumbnailGradient: "from-[#39C7D8]/20 to-[#39C7D8]/5",
        thumbnailBorder: "border-[#39C7D8]/20",
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
        tier: "winner", // AI-determined winner
        format: "The Tutorial",
        subType: "Masterclass",
        bucket: "Evergreen Asset",
        intent: "Learn/Solve",
        mindset: "Active",
        primaryEmotion: "Curiosity",
        secondaryEmotion: "Hope",
        porchPitch: "Everyone thinks the algorithm is out to get them. I'm going to show you exactly how it actually works so you can stop guessing.",
        angle: "Demystifying the black box",
        whyItWins: "High search volume with strong intent signals. Perfect for establishing authority.",
    },
    {
        id: "2",
        phrase: "YouTube Shorts Algorithm 2025",
        growthScore: 88,
        tier: "runner-up",
        format: "The Commentary",
        subType: "News Update",
        bucket: "Velocity Spike",
        intent: "Learn/Solve",
        mindset: "Active",
        primaryEmotion: "FOMO",
        secondaryEmotion: "Curiosity",
        porchPitch: "Shorts are changing everything. Here's what's actually working right now.",
        angle: "The 2025 playbook",
        whyItWins: "Trending topic with strong seasonal relevance.",
    },
    {
        id: "3",
        phrase: "Why YouTube Shorts Fail",
        growthScore: 85,
        tier: "runner-up",
        format: "The Analysis",
        subType: "Warning",
        bucket: "High CTR",
        intent: "Vent/Validate",
        mindset: "Active",
        primaryEmotion: "Fear",
        secondaryEmotion: "Frustration",
        porchPitch: "You're doing everything right but your Shorts still flop. Here's why.",
        angle: "The hidden mistakes",
        whyItWins: "Fear-based emotion drives high CTR.",
    },
    {
        id: "4",
        phrase: "How to Beat the Algorithm",
        growthScore: 82,
        tier: "runner-up",
        format: "The Tutorial",
        subType: "Quick Fix",
        bucket: "Evergreen Asset",
        intent: "Learn/Solve",
        mindset: "Active",
        primaryEmotion: "Hope",
        secondaryEmotion: "Determination",
        porchPitch: "Stop fighting the algorithm. Start working with it.",
        angle: "The partnership mindset",
        whyItWins: "Action-oriented searchers with high retention potential.",
    },
];

// Fill positions 5-13 as contenders
for (let i = 5; i <= 13; i++) {
    const baseIndex = (i - 5) % 4;
    INITIAL_CANDIDATES.push({
        ...INITIAL_CANDIDATES[baseIndex],
        id: String(i),
        phrase: `Video Concept ${i}`,
        growthScore: 78 - (i - 5) * 2,
        tier: "contender", // All remaining are contenders
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
                                <IconTrophy className={`w-4 h-4 ${style.pillText}`} />
                                <span className={`text-sm font-bold ${style.pillText}`}>
                                    {style.label}
                                </span>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-[280px_1fr] gap-8 mt-6">
                            {/* Thumbnail - Styled by tier */}
                            <div className={`aspect-video rounded-xl flex items-center justify-center bg-gradient-to-br ${style.thumbnailGradient} border ${style.thumbnailBorder}`}>
                                <IconStarFilled className={`w-16 h-16 ${style.text} opacity-40`} />
                            </div>

                            {/* Info Panel */}
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    {topTileCandidate.phrase}
                                </h2>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-medium">
                                        {topTileCandidate.format}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-[#2BD899]/20 text-[#2BD899] text-sm font-medium">
                                        {topTileCandidate.bucket}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-sm font-medium">
                                        {topTileCandidate.mindset}
                                    </span>
                                </div>

                                {/* Porch Pitch */}
                                <p className="text-white/60 text-base leading-relaxed mb-5">
                                    {topTileCandidate.porchPitch}
                                </p>

                                {/* Data Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-[#FF6B6B]/20">
                                            <IconMoodSmile className="w-5 h-5 text-[#FF6B6B]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wide">Emotion</p>
                                            <p className="text-sm text-white font-medium">{topTileCandidate.primaryEmotion}</p>
                                            <p className="text-xs text-white/50">+ {topTileCandidate.secondaryEmotion}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-[#39C7D8]/20">
                                            <IconTarget className="w-5 h-5 text-[#39C7D8]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wide">Viewer Intent</p>
                                            <p className="text-sm text-white font-medium">{topTileCandidate.intent}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-[#FFD700]/20">
                                            <IconBulb className="w-5 h-5 text-[#FFD700]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wide">The Angle</p>
                                            <p className="text-sm text-white font-medium">{topTileCandidate.angle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-[#2BD899]/20">
                                            <IconFlame className="w-5 h-5 text-[#2BD899]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wide">Why It Wins</p>
                                            <p className="text-sm text-white/80 leading-snug">{topTileCandidate.whyItWins}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Growth Score */}
                                <div className="flex items-center gap-3">
                                    <span className="text-white/40 text-sm font-medium">Growth Fit</span>
                                    <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#2BD899] to-[#39C7D8] rounded-full transition-all duration-500"
                                            style={{ width: `${topTileCandidate.growthScore}%` }}
                                        />
                                    </div>
                                    <span className="text-[#2BD899] font-bold text-xl">{topTileCandidate.growthScore}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-white/10">
                            {!isLocked ? (
                                <button
                                    onClick={handleLock}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2BD899]/15 border border-[#2BD899]/40 text-[#2BD899] font-semibold hover:bg-[#2BD899]/25 transition-all"
                                >
                                    <IconLock className="w-5 h-5" />
                                    Lock This Video
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2BD899]/20 border border-[#2BD899]/50 text-[#2BD899] font-semibold">
                                    <IconLock className="w-5 h-5" />
                                    Locked as Winner
                                </div>
                            )}
                            <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-all">
                                <IconFileDescription className="w-5 h-5" />
                                Report
                            </button>
                            <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-all">
                                <IconExternalLink className="w-5 h-5" />
                                View on YouTube
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* ================================================================== */}
            {/* SECONDARY CARDS (Positions 1-3) - Styling follows each card's TIER */}
            {/* ================================================================== */}
            <div className="space-y-5">
                <h3 className="text-xl font-semibold text-white/60">More Options</h3>
                <div className="grid grid-cols-3 gap-6">
                    {secondaryCards.map((candidate) => {
                        const style = getStyle(candidate.tier);
                        return (
                            <div
                                key={candidate.id}
                                className={`p-6 rounded-2xl transition-all hover:scale-[1.02] ${style.bg} border-2 ${style.border}`}
                            >
                                {/* Tier Badge */}
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${style.pillBg} ${style.pillText}`}>
                                    {style.label}
                                </div>

                                {/* Thumbnail */}
                                <div className={`aspect-[16/10] rounded-xl bg-gradient-to-br ${style.thumbnailGradient} border ${style.thumbnailBorder} mb-4 flex items-center justify-center`}>
                                    <IconStarFilled className={`w-10 h-10 ${style.text} opacity-30`} />
                                </div>

                                {/* Phrase */}
                                <h4 className="text-xl font-bold text-white/90 mb-3 line-clamp-2 leading-tight">
                                    {candidate.phrase}
                                </h4>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 rounded-lg text-sm bg-white/10 text-white/60 font-medium">
                                        {candidate.primaryEmotion}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg text-sm bg-primary/15 text-primary/80 font-medium">
                                        {candidate.format}
                                    </span>
                                </div>

                                {/* Growth Score */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-white/50 text-base font-medium">Growth Fit</span>
                                    <span className={`font-bold text-xl ${style.text}`}>{candidate.growthScore}</span>
                                </div>

                                {/* Swap Button */}
                                <button
                                    onClick={() => handleSwap(candidate.id)}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all`}
                                >
                                    <IconArrowUp className="w-5 h-5" />
                                    Swap to Top
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ================================================================== */}
            {/* CONTENDER ROWS (Positions 4-12) - Styling follows each row's TIER */}
            {/* ================================================================== */}
            <div className="space-y-5">
                <h3 className="text-xl font-semibold text-white/60">All Candidates</h3>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    {contenderRows.map((candidate, index) => {
                        const style = getStyle(candidate.tier);
                        return (
                            <div
                                key={candidate.id}
                                className={`flex items-center gap-5 px-6 py-4 transition-all hover:bg-white/[0.03] ${index !== contenderRows.length - 1 ? "border-b border-white/5" : ""}`}
                            >
                                {/* Rank Number */}
                                <span className={`w-8 text-center text-base font-semibold ${style.text}`}>
                                    {index + 5}
                                </span>

                                {/* Tier Badge */}
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${style.pillBg} ${style.pillText}`}>
                                    {candidate.tier === 'winner' ? '👑' : candidate.tier === 'runner-up' ? '🥈' : ''}
                                    {candidate.tier !== 'contender' && ' '}
                                    {style.label}
                                </span>

                                {/* Progress Bar with Phrase */}
                                <div className={`flex-1 h-10 bg-white/5 rounded-full overflow-hidden relative border ${style.thumbnailBorder}`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${candidate.tier === 'winner' ? 'bg-gradient-to-r from-[#FFD700]/40 to-[#FFD700]/20' : candidate.tier === 'runner-up' ? 'bg-gradient-to-r from-white/20 to-white/10' : 'bg-gradient-to-r from-[#39C7D8]/40 to-[#39C7D8]/20'}`}
                                        style={{ width: `${candidate.growthScore}%` }}
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-white font-medium truncate max-w-[90%]">
                                        {candidate.phrase}
                                    </span>
                                </div>

                                {/* Score */}
                                <span className={`w-14 text-right text-lg font-bold ${style.text}`}>
                                    {candidate.growthScore}
                                </span>

                                {/* Swap Button */}
                                <button
                                    onClick={() => handleSwap(candidate.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-[#39C7D8] hover:bg-[#39C7D8]/10 border border-white/10 hover:border-[#39C7D8]/30 transition-all"
                                >
                                    <IconArrowUp className="w-4 h-4" />
                                    Swap
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
