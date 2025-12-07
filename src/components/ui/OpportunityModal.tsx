"use client";

import React, { useState } from "react";
import { IconX, IconExternalLink, IconCheck, IconLoader2, IconSparkles, IconSearch, IconCircleCheck, IconCircleDot, IconStar, IconStarFilled, IconArrowDown } from "@tabler/icons-react";
import { toTitleCase } from "@/lib/utils";
import {
  calculateOpportunityScore,
  buildHotAnchors,
  type SessionContext
} from "@/lib/opportunity-scoring";
import { authFetch } from "@/lib/supabase";
import { hasNonEnglishIndicator, isOutdatedPhrase } from "@/lib/phrase-filtering";

// ============================================================================
// TYPES
// ============================================================================

interface PhraseData {
  id: string;
  phrase: string;
  demand: number | null;
  suggestionCount: number;
  exactMatchCount: number;
  topicMatchCount: number;
  generationMethod: string | null;
}

interface AutocompleteSuggestion {
  phrase: string;
  isExactMatch: boolean;
  isTopicMatch: boolean;
  inSession: boolean;
  sessionDemand?: number | null;
  vibe?: string;
  vibeIcon?: string;
}

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrase: PhraseData | null;
  sessionPhrases: Array<{ phrase: string; demand: number | null }>;
  seedPhrase: string;
  isStarred?: boolean;
  onToggleStar?: (phraseId: string) => void;
}

// ============================================================================
// COLOR SYSTEM - Consistent tiers
// ============================================================================

function getScoreStyle(score: number): { color: string; bgColor: string; borderColor: string } {
  if (score >= 80) return {
    color: '#4DD68A',
    bgColor: 'bg-[#4DD68A]/10',
    borderColor: 'border-[#4DD68A]/30'
  };
  if (score >= 60) return {
    color: '#A3E635',
    bgColor: 'bg-[#A3E635]/10',
    borderColor: 'border-[#A3E635]/30'
  };
  if (score >= 40) return {
    color: '#FACC15',
    bgColor: 'bg-[#FACC15]/10',
    borderColor: 'border-[#FACC15]/30'
  };
  if (score >= 20) return {
    color: '#FB923C',
    bgColor: 'bg-[#FB923C]/10',
    borderColor: 'border-[#FB923C]/30'
  };
  return {
    color: '#F87171',
    bgColor: 'bg-[#F87171]/10',
    borderColor: 'border-[#F87171]/30'
  };
}

function getScoreLabel(score: number, type: 'demand' | 'opportunity'): string {
  if (type === 'demand') {
    if (score >= 90) return 'Extreme';
    if (score >= 75) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 45) return 'Moderate';
    if (score >= 30) return 'Low';
    return 'Very Low';
  } else {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Limited';
    return 'Low';
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OpportunityModal({
  isOpen,
  onClose,
  phrase,
  sessionPhrases,
  seedPhrase,
  isStarred,
  onToggleStar,
}: OpportunityModalProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Reset state when modal closes or phrase changes
  React.useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setSuggestionsError(null);
    }
  }, [isOpen, phrase?.id]);

  if (!isOpen || !phrase) return null;

  // Calculate word count for length analysis
  const wordCount = phrase.phrase.trim().split(/\s+/).length;

  // Build session context
  const hotAnchors = buildHotAnchors(sessionPhrases);
  const context: SessionContext = {
    allPhrases: sessionPhrases,
    hotAnchors,
    seedPhrase,
  };

  // Calculate opportunity
  const result = calculateOpportunityScore(
    {
      phrase: phrase.phrase,
      demand: phrase.demand,
      suggestionCount: phrase.suggestionCount,
      exactMatchCount: phrase.exactMatchCount,
      topicMatchCount: phrase.topicMatchCount,
      generationMethod: phrase.generationMethod,
    },
    context
  );

  const demandScore = phrase.demand ?? 0;
  const oppScore = result.score;

  const demandStyle = getScoreStyle(demandScore);
  const oppStyle = getScoreStyle(oppScore);

  // Build breakdown items (only show non-zero)
  const breakdownItems = [
    { label: 'Demand Base', value: result.breakdown.demandBase, max: 30 },
    { label: 'Low Comp Signal', value: result.breakdown.lowCompSignal, max: 25 },
    { label: 'Long-Term Views', value: result.breakdown.longTermViews, max: 25 },
    { label: 'Hot Anchor', value: result.breakdown.hotAnchor, max: 15 },
    { label: 'Related Phrases', value: result.breakdown.relatedPhrase, max: 15 },
  ].filter(item => item.value > 0);

  // Filter related phrases: 
  // 1. Remove non-English phrases
  // 2. Remove outdated phrases
  // 3. Use absolute word counts: 3-4 = shorter, 5+ = longer
  const allRelated = [...result.relatedPhrases.shorter, ...result.relatedPhrases.longer];
  const filteredAll = allRelated.filter(p => {
    if (hasNonEnglishIndicator(p.phrase)) return false;
    if (isOutdatedPhrase(p.phrase, seedPhrase)) return false;
    return true;
  });
  const filteredRelatedPhrases = {
    shorter: filteredAll.filter(p => {
      const wc = p.phrase.split(' ').length;
      return wc >= 3 && wc <= 4;
    }),
    longer: filteredAll.filter(p => {
      const wc = p.phrase.split(' ').length;
      return wc >= 5;
    }),
  };

  // Fetch autocomplete suggestions
  const handleExploreSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);

    try {
      const response = await authFetch("/api/seed-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: phrase.phrase }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();

      // Build session phrase lookup for cross-referencing
      const sessionLookup = new Map<string, number | null>();
      sessionPhrases.forEach(p => {
        sessionLookup.set(p.phrase.toLowerCase(), p.demand);
      });

      // Get suggestions from the landscape response
      const rawSuggestions: string[] = data.landscape?.suggestions || data.suggestions || [];
      const rankedSuggestions = data.landscape?.rankedSuggestions || [];

      // Process suggestions
      const processed: AutocompleteSuggestion[] = rawSuggestions.map((suggestionPhrase: string, index: number) => {
        const phraseLower = suggestionPhrase.toLowerCase();
        const seedLower = phrase.phrase.toLowerCase();
        const inSession = sessionLookup.has(phraseLower);

        // Check if exact match (starts with seed)
        const isExactMatch = phraseLower.startsWith(seedLower);

        // Check if topic match (shares significant words with seed)
        const seedWords = new Set(seedLower.split(/\s+/).filter(w => w.length > 2));
        const phraseWords = phraseLower.split(/\s+/).filter(w => w.length > 2);
        const sharedWords = phraseWords.filter(w => seedWords.has(w));
        const isTopicMatch = sharedWords.length > 0;

        // Get vibe from ranked suggestions if available
        const ranked = rankedSuggestions[index];
        const vibe = ranked?.vibe;
        const vibeIcon = ranked?.vibeIcon;

        return {
          phrase: suggestionPhrase,
          isExactMatch,
          isTopicMatch,
          inSession,
          sessionDemand: inSession ? sessionLookup.get(phraseLower) : undefined,
          vibe,
          vibeIcon,
        };
      });

      setSuggestions(processed);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestionsError("Failed to load suggestions. Please try again.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Hidden scrollbar with fade hint */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#1a1f2e] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Scrollable content area with hidden scrollbar */}
        <div
          className="overflow-y-auto max-h-[85vh] px-8 py-8"
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}
        >
          {/* Hide scrollbar for webkit browsers */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {/* Top right buttons */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
            {onToggleStar && (
              <button
                onClick={() => onToggleStar(phrase.id)}
                className={`p-2 rounded-full transition-colors ${isStarred
                  ? 'bg-[#FFD700]/20 hover:bg-[#FFD700]/30'
                  : 'hover:bg-white/10'
                  }`}
                title={isStarred ? 'Remove from starred' : 'Star this phrase'}
              >
                {isStarred ? (
                  <IconStarFilled className="w-5 h-5 text-[#FFD700]" />
                ) : (
                  <IconStar className="w-5 h-5 text-white/60" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <IconX className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="p-10">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start gap-3">
                <h2 className="text-2xl font-bold text-white mb-3 pr-16">
                  {toTitleCase(phrase.phrase)}
                </h2>
              </div>
              <p className="text-white/60 text-base">
                {phrase.suggestionCount} suggestions • {phrase.exactMatchCount} exact match • {phrase.topicMatchCount} topic match • {wordCount} words
              </p>
            </div>

            {/* Score Cards - Side by Side */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Demand Card */}
              <div className={`p-6 rounded-2xl border ${demandStyle.bgColor} ${demandStyle.borderColor}`}>
                <p className="text-base font-medium text-white/60 uppercase tracking-wider mb-3">
                  Demand
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold" style={{ color: demandStyle.color }}>
                    {getScoreLabel(demandScore, 'demand')}
                  </span>
                  <span className="text-4xl font-bold" style={{ color: demandStyle.color }}>
                    {demandScore}
                  </span>
                </div>
              </div>

              {/* Opportunity Card */}
              <div className={`p-6 rounded-2xl border ${oppStyle.bgColor} ${oppStyle.borderColor}`}>
                <p className="text-base font-medium text-white/60 uppercase tracking-wider mb-3">
                  Opportunity
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold" style={{ color: oppStyle.color }}>
                    {getScoreLabel(oppScore, 'opportunity')}
                  </span>
                  <span className="text-4xl font-bold" style={{ color: oppStyle.color }}>
                    {oppScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Opportunity Breakdown */}
            {breakdownItems.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white/90 mb-5">Score Breakdown</h3>
                <div className="space-y-4">
                  {breakdownItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-base text-white/80">{item.label}</span>
                      <div className="flex items-center gap-3">
                        {/* Progress bar */}
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#6B9BD1]"
                            style={{ width: `${(item.value / item.max) * 100}%` }}
                          />
                        </div>
                        <span className="text-base font-medium text-white/90 w-12 text-right">
                          +{item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="mb-8 p-6 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-[#F59E0B] text-base mb-2">
                      {wordCount} words with high demand may face more competition.
                    </p>
                    <p className="text-white/60 text-base">
                      The upside? Short phrases leave room for compelling titles — you can add your own words to stand out.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Why This Works - Insights */}
            {result.insights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white/90 mb-5">Why This Works</h3>
                <ul className="space-y-4">
                  {result.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-3 text-base text-white/80">
                      <IconCheck className="w-5 h-5 text-[#4DD68A] flex-shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Explore Deeper - shows when NO warnings (for longer phrases) */}
            {result.warnings.length === 0 && (
              <div className="mb-8 p-6 rounded-xl bg-[#6B9BD1]/10 border border-[#6B9BD1]/30">
                <div className="flex items-start gap-3">
                  <IconSearch className="w-5 h-5 text-[#6B9BD1] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[#6B9BD1] text-base mb-2">
                      {wordCount} words — great length for specific intent!
                    </p>
                    <p className="text-white/60 text-base mb-4">
                      Longer phrases often signal clearer viewer intent and less competition.
                    </p>

                    {/* Explore CTA */}
                    {suggestions.length === 0 && !isLoadingSuggestions && (
                      <button
                        onClick={handleExploreSuggestions}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9BD1]/20 hover:bg-[#6B9BD1]/30 border border-[#6B9BD1]/40 text-[#6B9BD1] text-base font-medium rounded-lg transition-colors"
                      >
                        <IconArrowDown className="w-4 h-4" />
                        <span>See What YouTube Suggests</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingSuggestions && (
                  <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-black/20">
                    <IconLoader2 className="w-5 h-5 text-[#6B9BD1] animate-spin" />
                    <span className="text-white/60">Fetching suggestions...</span>
                  </div>
                )}

                {/* Error State */}
                {suggestionsError && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-base">{suggestionsError}</p>
                    <button
                      onClick={handleExploreSuggestions}
                      className="mt-2 text-sm text-[#6B9BD1] hover:text-[#8BB5E0]"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-lg ${s.inSession
                          ? 'bg-[#6B9BD1]/20 border border-[#6B9BD1]/40'
                          : 'bg-black/20'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {s.vibeIcon && (
                            <span className="text-base" title={s.vibe}>{s.vibeIcon}</span>
                          )}
                          <span className="text-white/80">{toTitleCase(s.phrase)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.isExactMatch && (
                            <span className="flex items-center gap-1 text-sm text-[#4DD68A]">
                              <IconCircleCheck className="w-4 h-4" />
                              <span>Exact</span>
                            </span>
                          )}
                          {s.isTopicMatch && !s.isExactMatch && (
                            <span className="flex items-center gap-1 text-sm text-[#6B9BD1]">
                              <IconCircleDot className="w-4 h-4" />
                              <span>Topic</span>
                            </span>
                          )}
                          {s.inSession && (
                            <span className="px-2 py-0.5 bg-[#6B9BD1]/30 text-[#6B9BD1] text-sm rounded-full">
                              In Session
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Related Phrases - Filtered */}
            {(filteredRelatedPhrases.shorter.length > 0 || filteredRelatedPhrases.longer.length > 0) && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white/90 mb-5">Related in Session</h3>

                {filteredRelatedPhrases.shorter.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">
                      Shorter Variants (3-4 words)
                    </p>
                    <div className="space-y-2">
                      {filteredRelatedPhrases.shorter.map((p, i) => (
                        <p key={i} className="text-base text-white/80">
                          • {toTitleCase(p.phrase)}
                          {p.demand !== null && (
                            <span className="text-white/50 ml-2">({p.demand})</span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {filteredRelatedPhrases.longer.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">
                      Longer Variants (5+ words)
                    </p>
                    <div className="space-y-2">
                      {filteredRelatedPhrases.longer.slice(0, 4).map((p, i) => (
                        <p key={i} className="text-base text-white/80">
                          • {toTitleCase(p.phrase)}
                          {p.demand !== null && (
                            <span className="text-white/50 ml-2">({p.demand})</span>
                          )}
                        </p>
                      ))}
                      {filteredRelatedPhrases.longer.length > 4 && (
                        <p className="text-base text-white/50">
                          +{filteredRelatedPhrases.longer.length - 4} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hot Anchors */}
            {result.matchedAnchors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white/90 mb-5">Hot Anchors</h3>
                <div className="flex flex-wrap gap-2">
                  {result.matchedAnchors.map((a, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-base font-medium"
                    >
                      {a.word} <span className="text-[#FFD700]/60">({a.count}×)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Link */}
            <div>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(phrase.phrase)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#6B9BD1] hover:text-[#8BB5E0] text-base transition-colors"
              >
                <span>Check competition on YouTube</span>
                <IconExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        {/* Close scrollable content div */}
      </div>

      {/* Bottom fade gradient hint for more content */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1a1f2e] to-transparent pointer-events-none rounded-b-3xl" />
    </div>
  );
}
