"use client";

import React, { useState, useMemo } from "react";
import { toTitleCase } from "@/lib/utils";
import { IconStar, IconStarFilled, IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

// =============================================================================
// CONSTANTS
// =============================================================================

const ROWS_PER_PAGE = 30;

// =============================================================================
// TYPES
// =============================================================================

interface RefinePhrase {
  id: string;
  phrase: string;
  source: "seed" | "top10" | "child" | "az" | "prefix";
  topic: number | null;
  fit: number | null;
  pop: number | null;
  comp: number | null;
  spread: number | null;
  isStarred: boolean;
  isRejected: boolean;
}

type SortColumn = "phrase" | "source" | "topic" | "fit" | "pop" | "comp" | "spread" | "starred";
type SortDirection = "asc" | "desc";

// All scores from the session for percentile calculation (not just visible phrases)
interface AllScores {
  topic: number[];
  fit: number[];
  pop: number[];
  comp: number[];
  spread: number[];
}

interface RefineTableProps {
  phrases: RefinePhrase[];
  allScores: AllScores; // Used for percentile-based color coding
  onToggleStar: (id: string) => void;
  onToggleReject: (id: string) => void;
  onToggleSelect: (id: string) => void;
  selectedIds: Set<string>;
  starredCount: number;
}

// =============================================================================
// SOURCE ORDER (for sorting by source column)
// =============================================================================

const SOURCE_ORDER: Record<string, number> = {
  seed: 1,
  top10: 2,
  child: 3,
  az: 4,
  prefix: 5,
};

// =============================================================================
// SOURCE PILL STYLES
// =============================================================================

const SOURCE_STYLES: Record<string, { label: string; textColor: string; borderColor: string }> = {
  seed: {
    label: "Seed",
    textColor: "text-[#FF6B5B]",
    borderColor: "border-[#FF6B5B]/45",
  },
  top10: {
    label: "Top 10",
    textColor: "text-[#FF8A3D]",
    borderColor: "border-[#FF8A3D]/45",
  },
  child: {
    label: "Child",
    textColor: "text-[#D4E882]",
    borderColor: "border-[#D4E882]/45",
  },
  az: {
    label: "A-Z",
    textColor: "text-[#4DD68A]",
    borderColor: "border-[#4DD68A]/45",
  },
  prefix: {
    label: "Prefix",
    textColor: "text-[#39C7D8]",
    borderColor: "border-[#39C7D8]/45",
  },
};

// =============================================================================
// PERCENTILE-BASED SCORE COLOR SYSTEM
// =============================================================================
// Colors are assigned based on where a score ranks within the session
// Top 10% = Dark Green, 10-25% = Lime, 25-35% = Yellow-Green, 35-65% = Orange, Bottom 35% = Red

const SCORE_COLORS = {
  darkGreen: "text-[#4DD68A]",   // Top 10% - Elite
  lime: "text-[#A3E635]",        // 10-25% - Strong
  yellowGreen: "text-[#CDDC39]", // 25-35% - Good
  orange: "text-[#FB923C]",      // 35-65% - Moderate
  red: "text-[#F87171]",         // Bottom 35% - Weak
  null: "text-white/30",
};

/**
 * Calculate percentile thresholds for a set of scores
 * Returns the score values at each percentile boundary
 */
function calculatePercentileThresholds(
  scores: number[],
  inverted: boolean = false
): { p10: number; p25: number; p35: number; p65: number } {
  if (scores.length === 0) {
    return { p10: 0, p25: 0, p35: 0, p65: 0 };
  }
  
  // Sort: for normal scores, highest first; for inverted, lowest first
  const sorted = [...scores].sort((a, b) => inverted ? a - b : b - a);
  
  // Calculate index for each percentile (0-indexed)
  const getValueAtPercentile = (percentile: number) => {
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  };
  
  return {
    p10: getValueAtPercentile(10),
    p25: getValueAtPercentile(25),
    p35: getValueAtPercentile(35),
    p65: getValueAtPercentile(65),
  };
}

/**
 * Get color for a score based on its percentile rank within the session
 */
function getScoreColorByPercentile(
  score: number | null,
  thresholds: { p10: number; p25: number; p35: number; p65: number },
  inverted: boolean = false
): string {
  if (score === null) return SCORE_COLORS.null;
  
  if (inverted) {
    // For inverted (competition): lower scores are better
    if (score <= thresholds.p10) return SCORE_COLORS.darkGreen;
    if (score <= thresholds.p25) return SCORE_COLORS.lime;
    if (score <= thresholds.p35) return SCORE_COLORS.yellowGreen;
    if (score <= thresholds.p65) return SCORE_COLORS.orange;
    return SCORE_COLORS.red;
  } else {
    // For normal scores: higher scores are better
    if (score >= thresholds.p10) return SCORE_COLORS.darkGreen;
    if (score >= thresholds.p25) return SCORE_COLORS.lime;
    if (score >= thresholds.p35) return SCORE_COLORS.yellowGreen;
    if (score >= thresholds.p65) return SCORE_COLORS.orange;
    return SCORE_COLORS.red;
  }
}

/**
 * Get color for spread based on percentile
 */
function getSpreadColorByPercentile(
  spread: number | null,
  thresholds: { p10: number; p25: number; p35: number; p65: number }
): string {
  if (spread === null) return SCORE_COLORS.null;
  
  // Higher spread is better
  if (spread >= thresholds.p10) return SCORE_COLORS.darkGreen;
  if (spread >= thresholds.p25) return SCORE_COLORS.lime;
  if (spread >= thresholds.p35) return SCORE_COLORS.yellowGreen;
  if (spread >= thresholds.p65) return SCORE_COLORS.orange;
  return SCORE_COLORS.red;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RefineTable({
  phrases,
  allScores,
  onToggleStar,
  onToggleReject,
  onToggleSelect,
  selectedIds,
  starredCount,
}: RefineTableProps) {
  // Default sort by source (ascending = seed first, then top10, child, az, prefix)
  const [sortColumn, setSortColumn] = useState<SortColumn>("source");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate percentile thresholds from ALL session scores (not just visible)
  // This ensures color-coding is consistent regardless of filtering/hiding
  const scoreThresholds = useMemo(() => {
    const thresholds = {
      topic: calculatePercentileThresholds(allScores.topic, false),
      fit: calculatePercentileThresholds(allScores.fit, false),
      pop: calculatePercentileThresholds(allScores.pop, false),
      comp: calculatePercentileThresholds(allScores.comp, true), // Inverted: lower is better
      spread: calculatePercentileThresholds(allScores.spread, false),
    };
    
    // DEBUG: Log thresholds to understand the distribution
    console.log('[RefineTable] Score Thresholds (from ALL phrases):', {
      visiblePhrases: phrases.length,
      topicCount: allScores.topic.length,
      topicRange: allScores.topic.length > 0 ? `${Math.min(...allScores.topic)}-${Math.max(...allScores.topic)}` : 'N/A',
      topicThresholds: thresholds.topic,
      fitCount: allScores.fit.length,
      fitRange: allScores.fit.length > 0 ? `${Math.min(...allScores.fit)}-${Math.max(...allScores.fit)}` : 'N/A',
      fitThresholds: thresholds.fit,
      popCount: allScores.pop.length,
      popRange: allScores.pop.length > 0 ? `${Math.min(...allScores.pop)}-${Math.max(...allScores.pop)}` : 'N/A',
      popThresholds: thresholds.pop,
    });
    
    return thresholds;
  }, [allScores, phrases.length]);

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      // Source column defaults to asc (seed first), others default to desc (highest first)
      setSortDirection(column === "source" || column === "phrase" ? "asc" : "desc");
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Sort phrases
  const sortedPhrases = useMemo(() => {
    return [...phrases].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      
      switch (sortColumn) {
        case "phrase":
          return dir * a.phrase.localeCompare(b.phrase);
        case "source":
          // Sort by numeric order: seed=1, top10=2, child=3, az=4, prefix=5
          const orderA = SOURCE_ORDER[a.source] ?? 99;
          const orderB = SOURCE_ORDER[b.source] ?? 99;
          return dir * (orderA - orderB);
        case "topic":
          return dir * ((a.topic ?? -1) - (b.topic ?? -1));
        case "fit":
          return dir * ((a.fit ?? -1) - (b.fit ?? -1));
        case "pop":
          return dir * ((a.pop ?? -1) - (b.pop ?? -1));
        case "comp":
          return dir * ((a.comp ?? -1) - (b.comp ?? -1));
        case "spread":
          return dir * ((a.spread ?? -999) - (b.spread ?? -999));
        case "starred":
          return dir * (Number(a.isStarred) - Number(b.isStarred));
        default:
          return 0;
      }
    });
  }, [phrases, sortColumn, sortDirection]);

  // Filter out rejected phrases
  const visiblePhrases = useMemo(() => 
    sortedPhrases.filter(p => !p.isRejected),
    [sortedPhrases]
  );

  // Pagination
  const totalPages = Math.ceil(visiblePhrases.length / ROWS_PER_PAGE);
  const paginatedPhrases = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return visiblePhrases.slice(start, start + ROWS_PER_PAGE);
  }, [visiblePhrases, currentPage]);

  // Page navigation
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Sort indicator
  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  // Header cell component
  const HeaderCell = ({ 
    column, 
    label, 
    className = "" 
  }: { 
    column: SortColumn; 
    label: string; 
    className?: string;
  }) => (
    <th
      className={`py-3 text-xs font-semibold text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors ${className}`}
      onClick={() => handleSort(column)}
    >
      {label}
      <SortIndicator column={column} />
    </th>
  );

  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      {/* Portrait mode message */}
      <div className="lg:hidden flex flex-col items-center justify-center h-[300px] text-center p-8">
        <p className="text-white/60 text-lg">📱 Rotate for Full Experience</p>
        <p className="text-white/40 text-sm mt-2">This tool works best in landscape mode.</p>
      </div>

      {/* Table - hidden on small screens */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {/* Select circle - 40px */}
              <th className="w-[40px] pl-4 py-3 border-r border-white/[0.06]">
                <div className="w-[18px] h-[18px] rounded-full border-2 border-[#6B9BD1]/60 cursor-pointer hover:border-[#6B9BD1] transition-colors" />
              </th>
              
              {/* Phrase - constrained width */}
              <HeaderCell column="phrase" label="Phrase" className="pl-3 text-left border-r border-white/[0.06] max-w-[240px]" />
              
              {/* Star - 56px */}
              <th className="w-[56px] py-3 text-center border-r border-white/[0.06]">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>☆</span>
                  {starredCount > 0 && (
                    <span className="text-yellow-400 font-bold">{starredCount}</span>
                  )}
                </span>
              </th>
              
              {/* Reject - 48px */}
              <th className="w-[48px] py-3 text-center border-r border-white/[0.06]">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">✕</span>
              </th>
              
              {/* Source - 72px */}
              <HeaderCell column="source" label="Source" className="w-[72px] text-center border-r border-white/[0.06]" />
              
              {/* Topic - 76px */}
              <HeaderCell column="topic" label="Topic" className="w-[76px] text-center border-r border-white/[0.06]" />
              
              {/* Fit - 76px */}
              <HeaderCell column="fit" label="Fit" className="w-[76px] text-center border-r border-white/[0.06]" />
              
              {/* Pop - 76px */}
              <HeaderCell column="pop" label="Pop" className="w-[76px] text-center border-r border-white/[0.06]" />
              
              {/* Comp - 76px */}
              <HeaderCell column="comp" label="Comp" className="w-[76px] text-center border-r border-white/[0.06]" />
              
              {/* Spread - 80px (no right border - last column) */}
              <HeaderCell column="spread" label="Spread" className="w-[80px] text-center" />
            </tr>
          </thead>
          
          <tbody>
            {paginatedPhrases.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-white/40">
                  No phrases to display. Complete Step 1 to generate phrases.
                </td>
              </tr>
            ) : (
              paginatedPhrases.map((phrase) => {
                const sourceStyle = SOURCE_STYLES[phrase.source] || SOURCE_STYLES.seed;
                const isSelected = selectedIds.has(phrase.id);
                
                return (
                  <tr
                    key={phrase.id}
                    className={`
                      hover:bg-white/[0.04] transition-colors group border-b border-white/[0.06]
                      ${isSelected ? "bg-primary/10" : ""}
                    `}
                  >
                    {/* Select circle */}
                    <td className="pl-4 py-4 border-r border-white/[0.06]">
                      <button
                        onClick={() => onToggleSelect(phrase.id)}
                        className={`w-[18px] h-[18px] rounded-full border-2 transition-colors ${
                          isSelected 
                            ? "border-[#6B9BD1] bg-[#6B9BD1]" 
                            : "border-[#6B9BD1]/40 hover:border-[#6B9BD1]/70"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                    
                    {/* Phrase */}
                    <td className="pl-3 py-4 text-white/[0.75] group-hover:text-white/[0.85] transition-colors truncate border-r border-white/[0.06] max-w-[240px]">
                      {toTitleCase(phrase.phrase)}
                    </td>
                    
                    {/* Star */}
                    <td className="py-4 text-center border-r border-white/[0.06]">
                      <button
                        onClick={() => onToggleStar(phrase.id)}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      >
                        {phrase.isStarred ? (
                          <IconStarFilled className="w-[18px] h-[18px] text-yellow-400/85" />
                        ) : (
                          <IconStar className="w-[18px] h-[18px] text-white/30 hover:text-yellow-400/70" />
                        )}
                      </button>
                    </td>
                    
                    {/* Reject */}
                    <td className="py-4 text-center border-r border-white/[0.06]">
                      <button
                        onClick={() => onToggleReject(phrase.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <IconX className="w-[18px] h-[18px] text-white/30 hover:text-red-400" />
                      </button>
                    </td>
                    
                    {/* Source */}
                    <td className="py-4 text-center border-r border-white/[0.06]">
                      <span className={`
                        inline-block min-w-[52px] text-center px-2 py-1 
                        bg-gradient-to-b from-[#2A2E34] to-[#1E2228] 
                        rounded-full text-xs ${sourceStyle.textColor} 
                        border ${sourceStyle.borderColor} font-medium 
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                      `}>
                        {sourceStyle.label}
                      </span>
                    </td>
                    
                    {/* Topic */}
                    <td className={`py-4 text-center font-mono text-sm border-r border-white/[0.06] ${getScoreColorByPercentile(phrase.topic, scoreThresholds.topic, false)}`}>
                      {phrase.topic ?? "—"}
                    </td>
                    
                    {/* Fit */}
                    <td className={`py-4 text-center font-mono text-sm border-r border-white/[0.06] ${getScoreColorByPercentile(phrase.fit, scoreThresholds.fit, false)}`}>
                      {phrase.fit ?? "—"}
                    </td>
                    
                    {/* Pop */}
                    <td className={`py-4 text-center font-mono text-sm border-r border-white/[0.06] ${getScoreColorByPercentile(phrase.pop, scoreThresholds.pop, false)}`}>
                      {phrase.pop ?? "—"}
                    </td>
                    
                    {/* Comp - inverted colors (low is good) */}
                    <td className={`py-4 text-center font-mono text-sm border-r border-white/[0.06] ${getScoreColorByPercentile(phrase.comp, scoreThresholds.comp, true)}`}>
                      {phrase.comp ?? "—"}
                    </td>
                    
                    {/* Spread (no right border - last column) */}
                    <td className={`py-4 pr-4 text-center font-mono text-sm ${getSpreadColorByPercentile(phrase.spread, scoreThresholds.spread)}`}>
                      {phrase.spread ?? "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-sm text-white/50">
            Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1}–{Math.min(currentPage * ROWS_PER_PAGE, visiblePhrases.length)} of {visiblePhrases.length} phrases
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <IconChevronLeft className="w-4 h-4 text-white/70" />
            </button>
            
            <div className="flex items-center gap-1">
              {/* Page numbers - show up to 5 pages */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`
                      w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${currentPage === pageNum 
                        ? "bg-primary text-white" 
                        : "text-white/60 hover:bg-white/10"
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <IconChevronRight className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
