"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { authFetch } from "@/lib/supabase";

import { ViewModeToggle } from "@/components/ui/ViewModeToggle";
import { FastTrackModal } from "@/components/ui/FastTrackModal";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import {
    type ViewerLandscape,
    type VibeCategory,
    getVibeIcon,
    getVibeLabel,
    getVibeBgClass,
} from "@/lib/viewer-landscape";
import { IconSearch, IconChevronLeft, IconPencil, IconSparkles, IconSeedling, IconLoader2 } from "@tabler/icons-react";

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

    // Navigation History - stores the full path of phrases explored
    const [phraseHistory, setPhraseHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Cache landscape results by phrase (key = phrase, value = landscape data)
    const landscapeCache = useRef<Map<string, ViewerLandscape>>(new Map());

    // Data State
    const [landscape, setLandscape] = useState<ViewerLandscape | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Display Mode
    const { mode, isFull, setMode } = useDisplayMode();

    // Current phrase is derived from history
    const currentPhrase = historyIndex >= 0 ? phraseHistory[historyIndex] : "";
    const currentLevel = historyIndex; // -1 = none, 0 = first search, 1+ = drill down

    const wordCount = useMemo(() => getWordCount(currentPhrase), [currentPhrase]);
    const isOpportunityMode = wordCount >= 3;

    // Sync URL with current phrase (for sharing/bookmarking)
    useEffect(() => {
        if (currentPhrase && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            const urlPhrase = url.searchParams.get('phrase');
            if (urlPhrase !== currentPhrase) {
                url.searchParams.set('phrase', currentPhrase);
                url.searchParams.set('level', String(currentLevel));
                window.history.replaceState({}, '', url.toString());
            }
        }
    }, [currentPhrase, currentLevel]);

    // Handle browser back/forward
    useEffect(() => {
        const handlePopState = () => {
            // Go back one level in our history if possible
            if (historyIndex > 0) {
                const prevIndex = historyIndex - 1;
                const prevPhrase = phraseHistory[prevIndex];
                setHistoryIndex(prevIndex);

                // Use cached data if available
                const cached = landscapeCache.current.get(prevPhrase);
                if (cached) {
                    setLandscape(cached);
                }
            } else if (historyIndex === 0) {
                // Going back from first search - reset to initial state
                setHistoryIndex(-1);
                setLandscape(null);
                setPhraseHistory([]);

                // Clear URL
                const url = new URL(window.location.href);
                url.searchParams.delete('phrase');
                url.searchParams.delete('level');
                window.history.replaceState({}, '', url.toString());
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [historyIndex, phraseHistory]);

    // Fetch landscape data (with caching)
    const fetchLandscape = async (phrase: string, parentDemandScore?: number, level?: number) => {
        if (!phrase.trim()) return;

        // Check cache first
        const cached = landscapeCache.current.get(phrase);
        if (cached) {
            setLandscape(cached);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const requestBody: { seed: string; parentDemandScore?: number; level?: number } = {
                seed: phrase.trim(),
            };
            if (parentDemandScore !== undefined) {
                requestBody.parentDemandScore = parentDemandScore;
            }
            if (level !== undefined) {
                requestBody.level = level;
            }

            const response = await authFetch("/api/seed-signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error("Failed to analyze topic");

            const data = await response.json();

            // Cache the result
            landscapeCache.current.set(phrase, data.landscape);
            setLandscape(data.landscape);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle new search from input
    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        const phrase = searchInput.trim();
        if (phrase.length < 2) return;

        // Add to history (this is a new top-level search)
        setPhraseHistory([phrase]);
        setHistoryIndex(0);

        // Push to browser history
        window.history.pushState({}, '', `?phrase=${encodeURIComponent(phrase)}&level=0`);

        // Fetch the data
        fetchLandscape(phrase, undefined, 0);
    };

    // Handle drill-down into a related topic
    const handleDrillDown = (phrase: string, position: number) => {
        // Add to our history array
        const newHistory = [...phraseHistory.slice(0, historyIndex + 1), phrase];
        const newIndex = newHistory.length - 1;

        setPhraseHistory(newHistory);
        setHistoryIndex(newIndex);
        setSearchInput(phrase); // Sync search input with current phrase

        // Push to browser history
        window.history.pushState({}, '', `?phrase=${encodeURIComponent(phrase)}&level=${newIndex}`);

        // Fetch with parent context
        fetchLandscape(phrase, landscape?.demandScore, newIndex);
    };

    // Handle back navigation via UI button
    const handleGoBack = () => {
        window.history.back();
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

    // Fast-Track state
    const [fastTrackModalOpen, setFastTrackModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analyzeData, setAnalyzeData] = useState<{
        channelId: string;
        phrase: string;
        growthFitScore: number;
        clickabilityScore: number;
        intentScore: number;
        demand: number;
        opportunity: number;
        primaryBucket: string;
        subFormat: string;
        alternateFormats: string[];
        primaryEmotion: string;
        secondaryEmotion: string;
        mindset: string;
        viewerGoal: string;
        algorithmTargets: string[];
        viewerAngle: string;
        porchTalk: string;
        hook: string;
        viewerGoalDescription: string;
        whyThisCouldWork: string;
        algorithmAngle: string;
    } | null>(null);

    // Step 1: User clicks button → Call analyze API
    const handleBuildTopic = async () => {
        if (!currentPhrase || !landscape) return;

        setIsAnalyzing(true);
        try {
            const response = await authFetch("/api/deep-dive/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phrase: currentPhrase,
                    demandScore: landscape.demandScore || 50,
                    opportunityScore: landscape.opportunityScore || 50,
                }),
            });

            if (!response.ok) {
                throw new Error("Analysis failed");
            }

            const data = await response.json();
            console.log("[Deep Dive] Analysis complete:", data);

            // Store the data and open modal
            setAnalyzeData(data);
            setFastTrackModalOpen(true);
        } catch (error) {
            console.error("[Deep Dive] Analysis error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Step 2: User confirms formats → Save to DB
    const handleFastTrackConfirm = async (selectedFormats: string[]) => {
        if (!analyzeData) return;

        setIsSaving(true);
        try {
            const response = await authFetch("/api/deep-dive/fast-track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...analyzeData,
                    selectedFormats,
                }),
            });

            if (!response.ok) {
                throw new Error("Save failed");
            }

            const data = await response.json();
            console.log("[Deep Dive] Fast-track complete:", data);

            // Redirect to Title page
            router.push(`/members/build/title?session_id=${data.sessionId}&topic_id=${data.superTopicId}`);
        } catch (error) {
            console.error("[Deep Dive] Save error:", error);
            setIsSaving(false);
        }
    };

    const handleCloseModal = () => {
        setFastTrackModalOpen(false);
        setAnalyzeData(null);
    };

    const handleExpandTopic = async () => {
        if (!currentPhrase) return;

        try {
            // Create session and add seed, then go to Seed page for full expansion
            const response = await authFetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: currentPhrase,
                    seedPhrase: currentPhrase,
                }),
            });

            if (response.ok) {
                const session = await response.json();
                router.push(`/members/build/seed?session_id=${session.id}`);
            } else {
                // Fallback
                router.push(`/members/build/seed`);
            }
        } catch (error) {
            console.error("Failed to create session:", error);
            router.push(`/members/build/seed`);
        }
    };

    return (
        <PageShell>
            <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
                <MemberHeader />

                {/* Header Section */}
                <div className="flex flex-col gap-6 items-center text-center mt-8">
                    <div className="w-20 h-20 rounded-2xl bg-[#5AACFF]/20 flex items-center justify-center border border-[#5AACFF]/30 shadow-[0_0_40px_rgba(90,172,255,0.15)]">
                        <IconSearch size={40} className="text-[#5AACFF]" />
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
                            className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-xl text-white/80 placeholder:text-white/30 focus:border-[#5AACFF] focus:outline-none focus:ring-2 focus:ring-[#5AACFF]/20 transition-all pl-14"
                            autoFocus
                        />
                        <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={24} />
                        <button
                            type="submit"
                            disabled={searchInput.trim().length < 2 || isLoading}
                            className={`absolute right-3 top-2.5 bottom-2.5 px-6 font-bold rounded-xl transition-all flex items-center justify-center ${searchInput.trim().length < 2 || isLoading
                                ? "bg-[#5AACFF]/20 border-2 border-[#5AACFF]/40 text-white/80 cursor-not-allowed"
                                : "bg-[#5AACFF]/30 hover:bg-[#5AACFF]/40 text-white border-2 border-[#5AACFF]/60 shadow-[0_0_15px_rgba(90,172,255,0.3)]"
                                }`}
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
                                {historyIndex > 0 ? (
                                    <button
                                        onClick={handleGoBack}
                                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                                    >
                                        <IconChevronLeft size={20} />
                                        <span>Back to {historyIndex === 1 ? 'Search' : 'Previous'}</span>
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

                            {/* Action Buttons - Three options */}
                            <div className="flex flex-col gap-4 mt-12 pb-8">
                                {/* Primary: Fast-Track to Titles - Premium glass style */}
                                <button
                                    onClick={handleBuildTopic}
                                    disabled={isAnalyzing}
                                    className={`w-full px-6 py-5 font-bold text-xl rounded-xl transition-all flex items-center justify-center gap-3 border-2 ${isAnalyzing
                                        ? "bg-[#7A5CFA]/10 border-[#7A5CFA]/20 text-[#C3B6EB]/50 cursor-wait"
                                        : "bg-gradient-to-b from-[#7A5CFA]/15 to-[#6548E5]/15 hover:from-[#7A5CFA]/20 hover:to-[#6548E5]/20 text-[#C3B6EB] border-[#7A5CFA]/40 shadow-[0_0_10px_rgba(122,92,250,0.1)] hover:shadow-[0_0_12px_rgba(122,92,250,0.15)]"
                                        }`}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <IconLoader2 size={24} className="animate-spin" />
                                            Analyzing Topic...
                                        </>
                                    ) : (
                                        <>
                                            <IconSparkles size={24} />
                                            Fast-Track to Titles
                                        </>
                                    )}
                                </button>

                                {/* Secondary row: Expand + New Phrase */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleExpandTopic}
                                        className="flex-1 px-6 py-4 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] font-bold text-lg rounded-xl transition-all border-2 border-[#2BD899]/40 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)] flex items-center justify-center gap-2"
                                    >
                                        <IconSeedling size={22} />
                                        Expand Topic
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSearchInput("");
                                            const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
                                            if (inputEl) inputEl.focus();
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="flex-1 px-6 py-4 bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15 hover:from-[#5AACFF]/20 hover:to-[#4A9CFF]/20 text-[#A0DCFF] font-bold text-lg rounded-xl transition-all border-2 border-[#5AACFF]/40 shadow-[0_0_8px_rgba(90,172,255,0.08)] hover:shadow-[0_0_10px_rgba(90,172,255,0.12)] flex items-center justify-center gap-2"
                                    >
                                        <IconPencil size={22} />
                                        New Phrase
                                    </button>
                                </div>

                                {/* Helper text */}
                                <p className="text-center text-white/40 text-sm">
                                    <span className="text-[#A78BFA]">Fast-Track</span> goes straight to title generation.
                                    <span className="text-[#4AE8B0]"> Expand Topic</span> finds related phrases first.
                                </p>
                            </div>

                        </div>
                    </div>
                )}

                {/* Fast-Track Modal */}
                {analyzeData && (
                    <FastTrackModal
                        isOpen={fastTrackModalOpen}
                        onClose={handleCloseModal}
                        phrase={analyzeData.phrase}
                        demandScore={analyzeData.demand}
                        opportunityScore={analyzeData.opportunity}
                        primaryBucket={analyzeData.primaryBucket}
                        recommendedFormat={analyzeData.subFormat}
                        alternateFormats={analyzeData.alternateFormats}
                        onConfirm={handleFastTrackConfirm}
                        isSaving={isSaving}
                    />
                )}

            </div>
        </PageShell>
    );
}
