"use client";

import React from "react";
import { IconX, IconExternalLink, IconFlame, IconTarget, IconTrendingUp, IconLink, IconSparkles } from "@tabler/icons-react";
import { toTitleCase } from "@/lib/utils";
import { 
  calculateOpportunityScore, 
  buildHotAnchors, 
  getOpportunityTier,
  type OpportunityResult,
  type SessionContext 
} from "@/lib/opportunity-scoring";

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

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrase: PhraseData | null;
  sessionPhrases: Array<{ phrase: string; demand: number | null }>;
  seedPhrase: string;
  onSelect?: (phraseId: string) => void;
  onPass?: (phraseId: string) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ScoreCard({ 
  title, 
  score, 
  label, 
  color,
  children 
}: { 
  title: string;
  score: number;
  label: string;
  color: string;
  children?: React.ReactNode;
}) {
  const bgColor = score >= 60 
    ? 'bg-[#2BD899]/15 border-[#2BD899]/40' 
    : score >= 40 
    ? 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' 
    : score >= 20 
    ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40' 
    : 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40';

  return (
    <div className={`p-6 rounded-2xl border ${bgColor}`}>
      <h4 className="text-base font-semibold text-white/50 uppercase tracking-wide mb-4">
        {title}
      </h4>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-bold" style={{ color }}>
          {label}
        </span>
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      {children}
    </div>
  );
}

function BreakdownItem({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  if (value === 0) return null;
  return (
    <p className="flex justify-between items-center">
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      <span className="text-white/80">+{value}</span>
    </p>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span 
      className="px-3 py-1.5 rounded-full text-sm font-medium"
      style={{ 
        backgroundColor: `${color}20`,
        color: color 
      }}
    >
      {children}
    </span>
  );
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
  onSelect,
  onPass,
}: OpportunityModalProps) {
  if (!isOpen || !phrase) return null;

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

  const oppTier = getOpportunityTier(result.score);
  const demandTier = getDemandTier(phrase.demand);

  // Calculate match percentages for display
  const exactPct = phrase.suggestionCount > 0 
    ? Math.round((phrase.exactMatchCount / phrase.suggestionCount) * 100) 
    : 0;
  const topicPct = phrase.suggestionCount > 0 
    ? Math.round((phrase.topicMatchCount / phrase.suggestionCount) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1a1f2e] rounded-3xl shadow-2xl border border-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <IconX className="w-5 h-5 text-white/60" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {toTitleCase(phrase.phrase)}
            </h2>
            <p className="text-white/50 text-sm">
              {phrase.suggestionCount} suggestions • {phrase.exactMatchCount} exact • {phrase.topicMatchCount} topic match
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Demand Card */}
            <ScoreCard
              title="Demand"
              score={phrase.demand ?? 0}
              label={demandTier.label}
              color={demandTier.color}
            >
              <div className="text-white/60 text-sm space-y-1">
                <p>{phrase.exactMatchCount} of {phrase.suggestionCount} exact match</p>
                <p>{phrase.topicMatchCount} of {phrase.suggestionCount} topic match</p>
              </div>
            </ScoreCard>

            {/* Opportunity Card */}
            <ScoreCard
              title="Opportunity"
              score={result.score}
              label={oppTier.label}
              color={oppTier.color}
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {result.hasLowCompSignal && (
                  <Badge color="#FFD700">🎯 Low Comp</Badge>
                )}
                {result.hasLongTermPotential && (
                  <Badge color="#2BD899">📈 Long-Term</Badge>
                )}
              </div>
              
              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-white/60 text-sm">
                <BreakdownItem 
                  label="Demand base" 
                  value={result.breakdown.demandBase}
                  icon={<IconFlame className="w-3 h-3" />}
                />
                <BreakdownItem 
                  label="Low comp signal" 
                  value={result.breakdown.lowCompSignal}
                  icon={<IconTarget className="w-3 h-3" />}
                />
                <BreakdownItem 
                  label="Long-term" 
                  value={result.breakdown.longTermViews}
                  icon={<IconTrendingUp className="w-3 h-3" />}
                />
                <BreakdownItem 
                  label="Hot anchor" 
                  value={result.breakdown.hotAnchor}
                  icon={<IconSparkles className="w-3 h-3" />}
                />
                <BreakdownItem 
                  label="Related" 
                  value={result.breakdown.relatedPhrase}
                  icon={<IconLink className="w-3 h-3" />}
                />
              </div>
            </ScoreCard>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30">
              <p className="text-[#F59E0B] text-sm">
                ⚠️ {result.warnings[0]}
              </p>
            </div>
          )}

          {/* Related Phrases */}
          {(result.relatedPhrases.shorter.length > 0 || result.relatedPhrases.longer.length > 0) && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white/80 mb-4">Related Phrases in Session</h3>
              
              {result.relatedPhrases.shorter.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/50 text-sm mb-2">
                    SHORTER (ranking ladder potential):
                  </p>
                  <div className="space-y-1">
                    {result.relatedPhrases.shorter.map((p, i) => (
                      <p key={i} className="text-white/70 text-sm">
                        • {toTitleCase(p.phrase)} 
                        {p.demand !== null && (
                          <span className="text-white/40 ml-2">({p.demand} demand)</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {result.relatedPhrases.longer.length > 0 && (
                <div>
                  <p className="text-white/50 text-sm mb-2">
                    LONGER (drill-down opportunities):
                  </p>
                  <div className="space-y-1">
                    {result.relatedPhrases.longer.slice(0, 5).map((p, i) => (
                      <p key={i} className="text-white/70 text-sm">
                        • {toTitleCase(p.phrase)}
                        {p.demand !== null && (
                          <span className="text-white/40 ml-2">({p.demand} demand)</span>
                        )}
                      </p>
                    ))}
                    {result.relatedPhrases.longer.length > 5 && (
                      <p className="text-white/40 text-sm">
                        +{result.relatedPhrases.longer.length - 5} more...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hot Anchors */}
          {result.matchedAnchors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white/80 mb-3">Hot Anchors in This Phrase</h3>
              <div className="space-y-2">
                {result.matchedAnchors.map((a, i) => (
                  <p key={i} className="text-white/60 text-sm">
                    • <span className="text-[#FFD700] font-medium">"{a.word}"</span>
                    <span className="text-white/40 ml-2">
                      — appears in {a.count} session phrases, avg demand {a.avgDemand}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {result.insights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white/80 mb-3">Why This Works</h3>
              <ul className="space-y-2">
                {result.insights.map((insight, i) => (
                  <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                    <span className="text-[#2BD899]">✓</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* YouTube Link */}
          <div className="mb-8">
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(phrase.phrase)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#6B9BD1] hover:text-[#8BB5E0] text-sm transition-colors"
            >
              <span>Check competition on YouTube</span>
              <IconExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {onSelect && (
              <button
                onClick={() => {
                  onSelect(phrase.id);
                  onClose();
                }}
                className="flex-1 py-3 px-6 bg-[#6B9BD1] hover:bg-[#7BA8DA] text-white font-semibold rounded-xl transition-colors"
              >
                Select Topic
              </button>
            )}
            {onPass && (
              <button
                onClick={() => {
                  onPass(phrase.id);
                  onClose();
                }}
                className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 text-white/70 font-semibold rounded-xl transition-colors"
              >
                Pass
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getDemandTier(demand: number | null): { label: string; color: string } {
  if (demand === null) return { label: 'Unknown', color: '#666' };
  if (demand >= 90) return { label: 'Extreme', color: '#FF6B5B' };
  if (demand >= 75) return { label: 'Very High', color: '#4DD68A' };
  if (demand >= 60) return { label: 'High', color: '#A3E635' };
  if (demand >= 45) return { label: 'Moderate', color: '#CDDC39' };
  if (demand >= 30) return { label: 'Low', color: '#FB923C' };
  return { label: 'Very Low', color: '#F87171' };
}
