"use client";

import React, { useState } from "react";
import { IconChevronLeft, IconChevronRight, IconLock, IconExternalLink, IconFileDescription, IconStarFilled, IconTrophy } from "@tabler/icons-react";

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
const MOCK_CANDIDATES: SuperTopicCandidate[] = [
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
    // Add more mock candidates as needed...
];

// Fill to 13 candidates for testing
while (MOCK_CANDIDATES.length < 13) {
    MOCK_CANDIDATES.push({
        ...MOCK_CANDIDATES[MOCK_CANDIDATES.length % 3],
        id: String(MOCK_CANDIDATES.length + 1),
        phrase: `Video Idea ${MOCK_CANDIDATES.length + 1}`,
        growthScore: 80 - MOCK_CANDIDATES.length,
    });
}

export function SuperPageContent() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    const candidates = MOCK_CANDIDATES;
    const currentCandidate = candidates[currentIndex];
    const runnerUps = candidates.filter((_, i) => i !== currentIndex).slice(0, 3);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? candidates.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === candidates.length - 1 ? 0 : prev + 1));
    };

    const handleSwap = (index: number) => {
        const newIndex = candidates.findIndex((c) => c.id === runnerUps[index].id);
        setCurrentIndex(newIndex);
    };

    const handleLock = () => {
        setIsLocked(true);
        // TODO: Save to database, reveal Title Lab
    };

    return (
        <div className="space-y-8">
            {/* Top Tile Container */}
            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={handlePrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all z-10"
                    aria-label="Previous candidate"
                >
                    <IconChevronLeft className="w-6 h-6" />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all z-10"
                    aria-label="Next candidate"
                >
                    <IconChevronRight className="w-6 h-6" />
                </button>

                {/* The Hero Card (Gold Border) */}
                <div className={`
          relative p-8 rounded-3xl border-2 transition-all
          ${isLocked
                        ? "bg-[#2BD899]/10 border-[#2BD899]/40"
                        : "bg-[#FFD700]/5 border-[#FFD700]/30"
                    }
        `}>
                    {/* Winner Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40">
                        <IconTrophy className="w-4 h-4 text-[#FFD700]" />
                        <span className="text-sm font-semibold text-[#FFD700]">
                            {isLocked ? "Winning Super Topic" : "Top Candidate"}
                        </span>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-[1fr_1.5fr] gap-8 mt-4">
                        {/* Left: Thumbnail Mock */}
                        <div className="aspect-video rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-center">
                            <IconStarFilled className="w-16 h-16 text-[#FFD700]/40" />
                        </div>

                        {/* Right: Info */}
                        <div className="flex flex-col justify-between">
                            {/* Phrase */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    {currentCandidate.phrase}
                                </h2>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-medium">
                                        {currentCandidate.format}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-[#2BD899]/20 text-[#2BD899] text-sm font-medium">
                                        {currentCandidate.bucket}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-sm font-medium">
                                        {currentCandidate.mindset}
                                    </span>
                                </div>

                                {/* Porch Pitch */}
                                <p className="text-white/60 text-base leading-relaxed">
                                    {currentCandidate.porchPitch}
                                </p>
                            </div>

                            {/* Growth Score */}
                            <div className="flex items-center gap-3 mt-4">
                                <span className="text-white/40 text-sm">Growth Fit</span>
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#2BD899] to-[#39C7D8] rounded-full transition-all duration-500"
                                        style={{ width: `${currentCandidate.growthScore}%` }}
                                    />
                                </div>
                                <span className="text-[#2BD899] font-bold text-lg">{currentCandidate.growthScore}</span>
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

                {/* Candidate Counter */}
                <div className="text-center mt-4 text-white/40 text-sm">
                    Showing {currentIndex + 1} of {candidates.length} candidates
                </div>
            </div>

            {/* Runner-Up Row */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/60">Runner-Ups</h3>
                <div className="grid grid-cols-3 gap-4">
                    {runnerUps.map((candidate, index) => (
                        <div
                            key={candidate.id}
                            className="p-5 rounded-2xl bg-white/[0.04] border-2 border-white/10 hover:border-white/20 transition-all"
                        >
                            {/* Mini Thumbnail */}
                            <div className="aspect-video rounded-lg bg-gradient-to-br from-white/10 to-white/5 mb-3 flex items-center justify-center">
                                <span className="text-white/20 text-2xl font-bold">#{index + 2}</span>
                            </div>

                            {/* Phrase */}
                            <h4 className="text-base font-semibold text-white mb-2 line-clamp-1">
                                {candidate.phrase}
                            </h4>

                            {/* Score */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white/40 text-sm">Growth</span>
                                <span className="text-[#39C7D8] font-semibold">{candidate.growthScore}</span>
                            </div>

                            {/* Swap Button */}
                            <button
                                onClick={() => handleSwap(index)}
                                className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
                            >
                                Swap ↑
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
