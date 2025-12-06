"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { authFetch } from "@/lib/supabase";

import { ViewModeToggle } from "@/components/ui/ViewModeToggle";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import {
    type ViewerLandscape,
    type VibeCategory,
    getVibeIcon,
    getVibeLabel,
    getVibeBgClass,
} from "@/lib/viewer-landscape";
import { createSession } from "@/hooks/useSessions";
import { addSeeds } from "@/hooks/useSeedPhrases";
import { IconSearch, IconChevronLeft, IconChevronRight, IconPencil, IconSparkles } from "@tabler/icons-react";

// =============================================================================
// TYPES
// =============================================================================

interface DrillDownContext {
    phrase: string;
    position: number;
    parentPhrase: string;
    level: number;
    fullPath: string[];
    parentDemandScore?: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function capitalizePhrase(phrase: string): string {
    return phrase
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function getWordCount(phrase: string): number {
    return phrase.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function getSignalBadge(
    demandScore: number,
    isSuperTopic?: boolean
): {
    icon: string;
    label: string;
    color: string;
    bgColor: string;
} {
    if (isSuperTopic) {
        return {
            icon: 'logo',
            label: 'SuperTopic',
            color: 'text-[#FFD700]',
            bgColor: 'bg-[#FFD700]/15 border-[#FFD700]/40'
        };
    }
    if (demandScore >= 95) return { icon: '🔥', label: 'Extreme Demand', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
    if (demandScore >= 85) return { icon: '⚡', label: 'Very High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
    if (demandScore >= 77) return { icon: '📊', label: 'High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
    if (demandScore >= 67) return { icon: '💪', label: 'Strong Demand', color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
    if (demandScore >= 57) return { icon: '✓', label: 'Good Opportunity', color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
    if (demandScore >= 47) return { icon: '💡', label: 'Moderate Interest', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
    if (demandScore >= 37) return { icon: '🔍', label: 'Some Interest', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
    return { icon: '❄️', label: 'Limited Interest', color: 'text-[#94A3B8]', bgColor: 'bg-[#94A3B8]/15 border-[#94A3B8]/40' };
}

function getScoreColorClasses(score: number): { color: string; bgColor: string } {
    if (score >= 70) return { color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
    if (score >= 50) return { color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
    if (score >= 35) return { color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
    return { color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
}

export default function TopicDeepDivePage() {
    const router = useRouter();

    // Input State
    const [searchInput, setSearchInput] = useState("");
    const [analyzedPhrase, setAnalyzedPhrase] = useState("");

    // Data State
    const [landscape, setLandscape] = useState<ViewerLandscape | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Drill Down State
    const [drillDownStack, setDrillDownStack] = useState<DrillDownContext[]>([]);

    // Display Mode
    const { mode, isFull, setMode } = useDisplayMode();

    const currentContext = drillDownStack.length > 0 ? drillDownStack[drillDownStack.length - 1] : null;
    const currentPhrase = currentContext ? currentContext.phrase : analyzedPhrase;
    const currentLevel = currentContext?.level || 0;

    const wordCount = useMemo(() => getWordCount(currentPhrase), [currentPhrase]);
    const isOpportunityMode = wordCount >= 3;

    const fetchLandscape = async (phrase: string, context?: DrillDownContext) => {
        if (!phrase.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const requestBody: { seed: string; parentDemandScore?: number; level?: number } = {
                seed: phrase.trim(),
            };
            if (context) {
                requestBody.parentDemandScore = context.parentDemandScore;
                requestBody.level = context.level;
            }

            const response = await authFetch("/api/seed-signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error("Failed to analyze topic");

            const data = await response.json();
            setLandscape(data.landscape);

            // If this is a new Top Level search, clear stack and set analyzed phrase
            if (!context) {
                setAnalyzedPhrase(phrase);
                setDrillDownStack([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchInput.trim().length < 2) return;
        fetchLandscape(searchInput);
    };

    const handleDrillDown = (phrase: string, position: number) => {
        const fullPath = currentContext
            ? [...currentContext.fullPath, phrase]
            : [analyzedPhrase, phrase];

        const context: DrillDownContext = {
            phrase,
            position,
            parentPhrase: currentPhrase,
            level: (currentContext?.level || 0) + 1,
            fullPath,
            parentDemandScore: landscape?.demandScore,
        };

        setDrillDownStack(prev => [...prev, context]);
        fetchLandscape(phrase, context);
    };

    const handleGoBack = () => {
        const newStack = drillDownStack.slice(0, -1);
        const prevContext = newStack.length > 0 ? newStack[newStack.length - 1] : undefined;
        const prevPhrase = prevContext ? prevContext.phrase : analyzedPhrase;

        setDrillDownStack(newStack);
        fetchLandscape(prevPhrase, prevContext);
    };

    const getDisplayVibes = () => {
        if (!landscape) return [];
        const vibes: { vibe: VibeCategory; percent: number }[] = [
            { vibe: 'learning', percent: landscape.vibeDistribution.learning },
            { vibe: 'frustrated', percent: landscape.vibeDistribution.frustrated },
            { vibe: 'current', percent: landscape.vibeDistribution.current },
            { vibe: 'problem-solving', percent: landscape.vibeDistribution.problemSolving },
            { vibe: 'curious', percent: landscape.vibeDistribution.curious },
            { vibe: 'action-ready', percent: landscape.vibeDistribution.actionReady },
            { vibe: 'comparing', percent: landscape.vibeDistribution.comparing },
        ];
        return vibes
            .filter(v => v.percent > 0)
            .sort((a, b) => b.percent - a.percent)
            .slice(0, isOpportunityMode ? 3 : 4);
    };

    const handleBuildTopic = async () => {
        if (!currentPhrase) return;

        try {
            // Create a new session
            const newSession = await createSession(currentPhrase, currentPhrase);

            // Add the seed phrase
            await addSeeds(newSession.id, [{
                phrase: currentPhrase,
                generationMethod: "deep_dive",
            }]);

            // Redirect to Title Builder (Page 5)
            router.push(`/members/build/title?session_id=${newSession.id}`);
        } catch (error) {
            console.error("Failed to create session:", error);
            // Fallback to just navigating
            router.push(`/members/build/title?seed=${encodeURIComponent(currentPhrase)}`);
        }
    };

    return (
        <PageShell>
            <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
                <MemberHeader />

                {/* Header Section */}
                <div className="flex flex-col gap-6 items-center text-center mt-8">
                    <div className="w-20 h-20 rounded-2xl bg-[#7A5CFA]/20 flex items-center justify-center border border-[#7A5CFA]/30 shadow-[0_0_40px_rgba(122,92,250,0.15)]">
                        <IconSearch size={40} className="text-[#7A5CFA]" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Topic Deep Dive</h1>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            Deep dive into any topic to uncover viewer demand, competition, and content opportunities.
                        </p>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="w-full max-w-2xl mt-4 relative">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Enter a topic to analyze..."
                            className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-xl text-white placeholder:text-white/30 focus:border-[#7A5CFA] focus:outline-none focus:ring-2 focus:ring-[#7A5CFA]/20 transition-all pl-14"
                            autoFocus
                        />
                        <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={24} />
                        <button
                            type="submit"
                            disabled={searchInput.trim().length < 2 || isLoading}
                            className="absolute right-3 top-2.5 bottom-2.5 px-6 bg-[#7A5CFA] hover:bg-[#684DEC] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {landscape && !isLoading && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[#1A1E24] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">

                            {/* Navigation Bar */}
                            <div className="flex items-center justify-between mb-8">
                                {drillDownStack.length > 0 ? (
                                    <button
                                        onClick={handleGoBack}
                                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                                    >
                                        <IconChevronLeft size={20} />
                                        <span>Back to {drillDownStack.length === 1 ? 'Search' : 'Previous'}</span>
                                    </button>
                                ) : (
                                    <div />
                                )}
                                <ViewModeToggle mode={mode} onModeChange={setMode} />
                            </div>

                            {/* Title & Badge */}
                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                {(() => {
                                    const badge = getSignalBadge(landscape.demandScore, landscape.isSuperTopic);
                                    return (
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${badge.bgColor}`}>
                                            {badge.icon === 'logo' ? (
                                                <img src="/logo-supertopics.svg" alt="SuperTopic" className="h-6 w-6" />
                                            ) : (
                                                <span className="text-xl">{badge.icon}</span>
                                            )}
                                            <span className={`font-bold text-base ${badge.color}`}>{badge.label}</span>
                                        </div>
                                    );
                                })()}
                                <h2 className="text-3xl font-bold text-white">{capitalizePhrase(currentPhrase)}</h2>
                                {currentLevel > 0 && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                        <span className="text-white/50 text-xs">Level {currentLevel + 1}</span>
                                    </div>
                                )}
                            </div>

                            {/* Signal Message */}
                            <p className="text-xl text-white/80 leading-relaxed mb-4 max-w-3xl">
                                {landscape.signalMessage}
                            </p>

                            {/* YouTube Competition Check Link */}
                            <div className="mb-8">
                                <a
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentPhrase)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[#5AACFF] hover:text-[#7BC0FF] transition-colors text-base"
                                >
                                    <span>Check Competition on YouTube</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>


                            {/* OPPORTUNITY MODE: Score breakdown (3+ words) */}
                            {isOpportunityMode && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                        {/* Demand Score */}
                                        <div className={`p-6 rounded-2xl border ${getScoreColorClasses(landscape.demandScore).bgColor}`}>
                                            <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">Viewer Demand</h4>
                                            <div className="flex items-end justify-between">
                                                <span className={`text-4xl font-bold ${getScoreColorClasses(landscape.demandScore).color}`}>
                                                    {landscape.demandScore}
                                                </span>
                                                <span className={`text-xl font-medium ${getScoreColorClasses(landscape.demandScore).color}`}>
                                                    {landscape.demandLabel}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Opportunity Score */}
                                        <div className={`p-6 rounded-2xl border ${getScoreColorClasses(landscape.opportunityScore).bgColor}`}>
                                            <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">Creator Opportunity</h4>
                                            <div className="flex items-end justify-between">
                                                <span className={`text-4xl font-bold ${getScoreColorClasses(landscape.opportunityScore).color}`}>
                                                    {landscape.opportunityScore}
                                                </span>
                                                <span className={`text-xl font-medium ${getScoreColorClasses(landscape.opportunityScore).color}`}>
                                                    {landscape.opportunityLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badges Row */}
                                    <div className="flex flex-wrap gap-3 mb-10">
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 text-sm font-medium">
                                            📊 {landscape.suggestionCount} suggestion{landscape.suggestionCount !== 1 ? 's' : ''}
                                        </span>
                                        {isFull && (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm font-medium">
                                                📊 Topic Match {landscape.topicMatchPercent}%
                                            </span>
                                        )}
                                        {isFull && (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm font-medium">
                                                📊 Exact Match {landscape.exactMatchPercent}%
                                            </span>
                                        )}
                                        {landscape.intentMatches && landscape.intentMatches.length > 0 && (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6BB6FF]/20 text-[#6BB6FF] text-sm font-medium">
                                                🎯 Viewer Intent
                                            </span>
                                        )}
                                        {landscape.hasEvergreenIntent && (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B794F6]/10 text-[#B794F6] text-sm font-medium border border-[#B794F6]/20">
                                                ♾️ Long-Term Views
                                            </span>
                                        )}
                                        {landscape.isLowCompetition && (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2BD899]/20 text-[#2BD899] text-sm font-medium">
                                                📈 Low Comp Signal
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* DISCOVERY MODE: Match stats only in detailed view */}
                            {!isOpportunityMode && isFull && (
                                <div className="my-4 space-y-1">
                                    <p className="text-white/50 text-lg">
                                        <span className="text-white/70 font-medium">{landscape.exactMatchCount} of {landscape.suggestionCount}</span> exact match
                                        {" • "}
                                        <span className="text-white/70 font-medium">{landscape.topicMatchCount} of {landscape.suggestionCount}</span> topic match
                                    </p>
                                </div>
                            )}

                            <div className="my-8 border-t border-white/10" />

                            {/* Who's Watching - only in discovery mode */}
                            {!isOpportunityMode && (
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-white/80 mb-4">Who&apos;s Watching</h3>
                                    <div className="space-y-4">
                                        {getDisplayVibes().map(({ vibe, percent }) => (
                                            <div key={vibe} className="flex items-center gap-4">
                                                <span className="text-2xl w-9">{getVibeIcon(vibe)}</span>
                                                <span className="text-white/80 text-lg w-36">{getVibeLabel(vibe)}</span>
                                                <div className="flex-1 h-3.5 bg-white/20 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${getVibeBgClass(vibe)}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Viewer Landscape Insight */}
                            <div className={isOpportunityMode ? "" : "mt-6"}>
                                <h3 className="text-2xl font-bold text-white/80 mb-3">Viewer Landscape</h3>
                                <p className="text-white/80 text-lg leading-relaxed">
                                    {landscape.insight}
                                </p>
                            </div>

                            {/* Popular Topics - Only in Detailed mode */}
                            {isFull && (
                                <>
                                    <div className="my-6 border-t border-white/10" />
                                    <div className="pt-4">
                                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            Popular Topics
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(landscape.topFourteen || landscape.topFive)
                                                .filter(item => item.phrase.toLowerCase().trim() !== currentPhrase.toLowerCase().trim())
                                                .slice(0, 14).map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleDrillDown(item.phrase, item.position)}
                                                        className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group text-left border border-transparent hover:border-white/10"
                                                    >
                                                        <span className="text-white/30 font-mono w-6">{idx + 1}</span>
                                                        <span className="flex-1 text-white font-medium truncate group-hover:text-[#2BD899] transition-colors">
                                                            {capitalizePhrase(item.phrase)}
                                                        </span>
                                                        <span title={getVibeLabel(item.vibe)} className="text-xl opacity-70 group-hover:opacity-100">
                                                            {item.vibeIcon}
                                                        </span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Anchor Words - only in discovery mode AND detailed view */}
                            {isFull && !isOpportunityMode && landscape.anchorWords.length > 0 && (
                                <>
                                    <div className="my-6 border-t border-white/10" />
                                    <div>
                                        <h3 className="text-xl font-bold text-white/80 mb-4">Words Viewers Use</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {landscape.anchorWords.map((word) => (
                                                <span
                                                    key={word}
                                                    className="px-4 py-2 bg-[#2BD899]/15 border border-[#2BD899]/40 rounded-full text-[#2BD899] text-base font-medium"
                                                >
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Action Buttons - Two equal columns */}
                            <div className="flex gap-4 mt-12 pb-8">
                                <button
                                    onClick={handleBuildTopic}
                                    className="flex-1 px-6 py-4 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/25 hover:to-[#25C78A]/25 text-[#2BD899] font-bold text-lg rounded-xl transition-all border-2 border-[#2BD899]/30 shadow-[0_0_15px_rgba(43,216,153,0.15)] hover:shadow-[0_0_25px_rgba(43,216,153,0.25)] flex items-center justify-center gap-2"
                                >
                                    <IconSparkles size={22} />
                                    Build This Topic
                                </button>
                                <button
                                    onClick={() => {
                                        setSearchInput("");
                                        const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
                                        if (inputEl) inputEl.focus();
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="flex-1 px-6 py-4 bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15 hover:from-[#5AACFF]/25 hover:to-[#4A9CFF]/25 text-[#5AACFF] font-bold text-lg rounded-xl transition-all border-2 border-[#5AACFF]/30 shadow-[0_0_15px_rgba(90,172,255,0.15)] hover:shadow-[0_0_25px_rgba(90,172,255,0.25)] flex items-center justify-center gap-2"
                                >
                                    <IconPencil size={22} />
                                    New Phrase
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </PageShell>
    );
}
