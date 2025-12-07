"use client";

import React, { useState } from "react";
import { IconLock, IconExternalLink, IconFileDescription, IconStarFilled, IconTrophy, IconMoodSmile, IconTarget, IconBulb, IconFlame, IconArrowUp } from "@tabler/icons-react";

// Mock data for development - will be replaced with real data from GPT-5-mini
interface SuperTopicCandidate {
    id: string;
    phrase: string;
    growthScore: number;
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

// Placeholder candidates for UI development
const INITIAL_CANDIDATES: SuperTopicCandidate[] = [
    {
        id: "1",
        phrase: "YouTube Algorithm Secrets",
        growthScore: 92,
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

// Fill to 13 candidates for testing
while (INITIAL_CANDIDATES.length < 13) {
    const baseIndex = INITIAL_CANDIDATES.length % 4;
    INITIAL_CANDIDATES.push({
        ...INITIAL_CANDIDATES[baseIndex],
        id: String(INITIAL_CANDIDATES.length + 1),
        phrase: `Video Concept ${INITIAL_CANDIDATES.length + 1}`,
        growthScore: 78 - (INITIAL_CANDIDATES.length - 4) * 2,
    });
}

// Tier configuration
const TIER_CONFIG = {
    gold: {
        bg: "bg-[#FFD700]/5",
        border: "border-[#FFD700]/40",
        text: "text-[#FFD700]",
        label: "Top Candidate",
        icon: IconTrophy,
    },
    silver: {
        bg: "bg-white/[0.03]",
        border: "border-white/20",
        text: "text-white/70",
        label: "Runner-Up",
    },
    blue: {
        bg: "bg-[#39C7D8]/5",
        border: "border-[#39C7D8]/20",
        text: "text-[#39C7D8]",
        label: "Contender",
    },
};

export function SuperPageContent() {
    const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
    const [isLocked, setIsLocked] = useState(false);

    // Position 0 = Top Candidate (Gold)
    // Position 1-3 = Runner-Ups (Silver)
    // Position 4-12 = Contenders (Blue)
    const topCandidate = candidates[0];
    const runnerUps = candidates.slice(1, 4);
    const contenders = candidates.slice(4);

    const handleSwap = (candidateId: string) => {
        // Find the candidate to promote
        const indexToPromote = candidates.findIndex((c) => c.id === candidateId);
        if (indexToPromote <= 0) return; // Already at top or not found

        // Bubble up: move the selected candidate to position 0
        const newCandidates = [...candidates];
        const [promoted] = newCandidates.splice(indexToPromote, 1);
        newCandidates.unshift(promoted);
        setCandidates(newCandidates);
    };

    const handleLock = () => {
        setIsLocked(true);
        // TODO: Save to database, reveal Title Lab
    };

    return (
        <div className="space-y-10">
            {/* ============================================ */}
            {/* TOP CANDIDATE (GOLD) - 1.7x Taller */}
            {/* ============================================ */}
            <div className={`
        relative p-8 rounded-3xl border-2 transition-all
        ${isLocked
                    ? "bg-[#2BD899]/10 border-[#2BD899]/40"
                    : `${TIER_CONFIG.gold.bg} ${TIER_CONFIG.gold.border}`
                }
      `}>
                {/* Badge - sits ON TOP of border with solid background */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className={`
            flex items-center gap-2 px-5 py-2 rounded-full 
            ${isLocked ? "bg-[#2BD899]" : "bg-[#FFD700]"}
            shadow-lg
          `}>
                        <IconTrophy className={`w-4 h-4 ${isLocked ? "text-white" : "text-[#1a1a1a]"}`} />
                        <span className={`text-sm font-bold ${isLocked ? "text-white" : "text-[#1a1a1a]"}`}>
                            {isLocked ? "Winning Super Topic" : "Top Candidate"}
                        </span>
                    </div>
                </div>

                {/* Content Grid - More vertical space */}
                <div className="grid grid-cols-[280px_1fr] gap-8 mt-6">
                    {/* Left: Thumbnail Mock */}
                    <div className={`
            aspect-video rounded-xl flex items-center justify-center
            ${isLocked
                            ? "bg-gradient-to-br from-[#2BD899]/30 to-[#2BD899]/10 border border-[#2BD899]/30"
                            : "bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/20"
                        }
          `}>
                        <IconStarFilled className={`w-16 h-16 ${isLocked ? "text-[#2BD899]/50" : "text-[#FFD700]/40"}`} />
                    </div>

                    {/* Right: Rich Info Panel */}
                    <div className="flex flex-col">
                        {/* Phrase */}
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {topCandidate.phrase}
                        </h2>

                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-medium">
                                {topCandidate.format}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-[#2BD899]/20 text-[#2BD899] text-sm font-medium">
                                {topCandidate.bucket}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-sm font-medium">
                                {topCandidate.mindset}
                            </span>
                        </div>

                        {/* Porch Pitch */}
                        <p className="text-white/60 text-base leading-relaxed mb-5">
                            {topCandidate.porchPitch}
                        </p>

                        {/* NEW: Expanded Data Section */}
                        <div className="grid grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                            {/* Emotion */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[#FF6B6B]/20">
                                    <IconMoodSmile className="w-5 h-5 text-[#FF6B6B]" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wide">Emotion</p>
                                    <p className="text-sm text-white font-medium">{topCandidate.primaryEmotion}</p>
                                    <p className="text-xs text-white/50">+ {topCandidate.secondaryEmotion}</p>
                                </div>
                            </div>

                            {/* Intent */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[#39C7D8]/20">
                                    <IconTarget className="w-5 h-5 text-[#39C7D8]" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wide">Viewer Intent</p>
                                    <p className="text-sm text-white font-medium">{topCandidate.intent}</p>
                                </div>
                            </div>

                            {/* The Angle */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[#FFD700]/20">
                                    <IconBulb className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wide">The Angle</p>
                                    <p className="text-sm text-white font-medium">{topCandidate.angle}</p>
                                </div>
                            </div>

                            {/* Why It Wins */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[#2BD899]/20">
                                    <IconFlame className="w-5 h-5 text-[#2BD899]" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wide">Why It Wins</p>
                                    <p className="text-sm text-white/80 leading-snug">{topCandidate.whyItWins}</p>
                                </div>
                            </div>
                        </div>

                        {/* Growth Score */}
                        <div className="flex items-center gap-3">
                            <span className="text-white/40 text-sm font-medium">Growth Fit</span>
                            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#2BD899] to-[#39C7D8] rounded-full transition-all duration-500"
                                    style={{ width: `${topCandidate.growthScore}%` }}
                                />
                            </div>
                            <span className="text-[#2BD899] font-bold text-xl">{topCandidate.growthScore}</span>
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

            {/* ============================================ */}
            {/* RUNNER-UPS (SILVER) - Positions 2-4 */}
            {/* ============================================ */}
            <div className="space-y-5">
                <h3 className="text-xl font-semibold text-white/60 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white/30"></span>
                    Runner-Ups
                </h3>
                <div className="grid grid-cols-3 gap-6">
                    {runnerUps.map((candidate, index) => (
                        <div
                            key={candidate.id}
                            className={`
                                p-6 rounded-2xl transition-all hover:border-white/30
                                ${TIER_CONFIG.silver.bg} border-2 ${TIER_CONFIG.silver.border}
                            `}
                        >
                            {/* Mini Thumbnail - Taller */}
                            <div className="aspect-[16/10] rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 mb-4 flex items-center justify-center">
                                <span className="text-white/30 text-3xl font-bold">#{index + 2}</span>
                            </div>

                            {/* Phrase - Larger */}
                            <h4 className="text-xl font-bold text-white/90 mb-3 line-clamp-2 leading-tight">
                                {candidate.phrase}
                            </h4>

                            {/* Tags - Larger */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1 rounded-lg text-sm bg-white/10 text-white/60 font-medium">
                                    {candidate.primaryEmotion}
                                </span>
                                <span className="px-3 py-1 rounded-lg text-sm bg-primary/15 text-primary/80 font-medium">
                                    {candidate.format}
                                </span>
                            </div>

                            {/* Growth Score - Larger */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white/50 text-base font-medium">Growth Fit</span>
                                <span className="text-[#39C7D8] font-bold text-xl">{candidate.growthScore}</span>
                            </div>

                            {/* Swap Button - Larger */}
                            <button
                                onClick={() => handleSwap(candidate.id)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-base font-medium hover:bg-white/10 hover:text-white transition-all"
                            >
                                <IconArrowUp className="w-5 h-5" />
                                Swap
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============================================ */}
            {/* CONTENDERS (BLUE) - Bar Chart Leaderboard */}
            {/* ============================================ */}
            <div className="space-y-5">
                <h3 className="text-xl font-semibold text-white/60 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#39C7D8]/50"></span>
                    Contenders
                </h3>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    {contenders.map((candidate, index) => (
                        <div
                            key={candidate.id}
                            className={`
                                flex items-center gap-5 px-6 py-4 transition-all hover:bg-white/[0.03]
                                ${index !== contenders.length - 1 ? "border-b border-white/5" : ""}
                            `}
                        >
                            {/* Rank Number */}
                            <span className="w-8 text-center text-base font-semibold text-[#39C7D8]/70">
                                {index + 5}
                            </span>

                            {/* Progress Bar with Phrase Inside */}
                            <div className="flex-1 h-10 bg-white/5 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-gradient-to-r from-[#39C7D8]/40 to-[#39C7D8]/20 rounded-full transition-all duration-300"
                                    style={{ width: `${candidate.growthScore}%` }}
                                />
                                {/* Phrase inside bar */}
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-white font-medium truncate max-w-[90%]">
                                    {candidate.phrase}
                                </span>
                            </div>

                            {/* Score */}
                            <span className="w-14 text-right text-lg font-bold text-[#39C7D8]">
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
                    ))}
                </div>
            </div>
        </div>
    );
}
