"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { IconSearch, IconSelector, IconCheck, IconEyeOff, IconChevronDown } from "@tabler/icons-react";

// =============================================================================
// TYPES
// =============================================================================

export type LengthFilter = "short" | "medium" | "long" | "extraLong";
export type LanguageFilter = "english" | "nonEnglish" | "all";
export type ScoreMetric = "topic" | "fit" | "pop" | "comp" | "spread";

export interface FilterState {
  lengths: Set<LengthFilter>;
  language: LanguageFilter;
  searchQuery: string;
  scoreMetric: ScoreMetric;
  scoreThreshold: number;
}

interface FilterToolbarProps {
  totalCount: number;
  visibleCount: number;
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  selectedCount: number;
  onSelectFiltered: () => void;
  onHideSelected: () => void;
  // Fixed preset value calculated once when scores load
  presetValue: number;
  // Score data for calculating default threshold
  scoreData?: {
    topic: number[];
    fit: number[];
    pop: number[];
    comp: number[];
    spread: number[];
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SCORE_METRIC_OPTIONS: { id: ScoreMetric; label: string; shortLabel: string }[] = [
  { id: "topic", label: "Topic Strength", shortLabel: "Topic" },
  { id: "fit", label: "Audience Fit", shortLabel: "Fit" },
  { id: "pop", label: "Popularity", shortLabel: "Pop" },
  { id: "comp", label: "Competition", shortLabel: "Comp" },
  { id: "spread", label: "Spread", shortLabel: "Spread" },
];

const LENGTH_OPTIONS: { id: LengthFilter; label: string; range: string }[] = [
  { id: "short", label: "Single", range: "1 word" },
  { id: "medium", label: "Short", range: "2-5 words" },
  { id: "long", label: "Medium", range: "6-9 words" },
  { id: "extraLong", label: "Long", range: "10+ words" },
];

const LANGUAGE_OPTIONS: { id: LanguageFilter; label: string }[] = [
  { id: "english", label: "English only" },
  { id: "nonEnglish", label: "Non-English only" },
  { id: "all", label: "All languages" },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterToolbar({ 
  totalCount, 
  visibleCount,
  filterState,
  onFilterChange,
  selectedCount,
  onSelectFiltered,
  onHideSelected,
  presetValue,
  scoreData,
}: FilterToolbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [metricDropdownPosition, setMetricDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const metricButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const metricDropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Preset button uses fixed value calculated once when scores loaded
  // Never changes after initial calculation - user is in control

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isMetricDropdownOpen && metricButtonRef.current) {
      const rect = metricButtonRef.current.getBoundingClientRect();
      setMetricDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isMetricDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        metricDropdownRef.current && 
        !metricDropdownRef.current.contains(target) &&
        metricButtonRef.current &&
        !metricButtonRef.current.contains(target)
      ) {
        setIsMetricDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle length filter
  const toggleLength = (id: LengthFilter) => {
    const newLengths = new Set(filterState.lengths);
    if (newLengths.has(id)) {
      newLengths.delete(id);
    } else {
      newLengths.add(id);
    }
    onFilterChange({ ...filterState, lengths: newLengths });
  };

  // Set language filter
  const setLanguage = (id: LanguageFilter) => {
    onFilterChange({ ...filterState, language: id });
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filterState, searchQuery: e.target.value });
  };

  // Handle score metric change
  const handleMetricChange = (metric: ScoreMetric) => {
    onFilterChange({ ...filterState, scoreMetric: metric });
    setIsMetricDropdownOpen(false);
  };

  // Handle threshold stepper (increments of 1)
  const handleThresholdDecrement = () => {
    onFilterChange({ ...filterState, scoreThreshold: Math.max(0, filterState.scoreThreshold - 1) });
  };
  
  const handleThresholdIncrement = () => {
    onFilterChange({ ...filterState, scoreThreshold: Math.min(99, filterState.scoreThreshold + 1) });
  };

  // Get current metric label
  const currentMetricLabel = SCORE_METRIC_OPTIONS.find(m => m.id === filterState.scoreMetric)?.shortLabel || "Topic";

  // Get filter summary for button label
  const getFilterSummary = () => {
    // Check if using non-default filters
    const defaultLengths = new Set(["medium", "long"]);
    const isDefaultLengths = filterState.lengths.size === defaultLengths.size && 
      [...filterState.lengths].every(l => defaultLengths.has(l));
    const isDefaultLanguage = filterState.language === "english";
    
    if (isDefaultLengths && isDefaultLanguage) {
      return "All";
    }
    return "Filtered";
  };

  // Shared button style - h-12 (48px) for chunkier, more accessible feel
  const btnBase = "h-12 flex items-center justify-center gap-2 px-5 bg-white/5 border border-white/5 rounded-lg text-white/70 text-sm hover:bg-white/10 transition-colors";

  // Dropdown portal
  const dropdown = isDropdownOpen && isMounted && createPortal(
    <div 
      ref={dropdownRef}
      className="fixed w-64 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 9999,
      }}
    >
      {/* Phrase Length Section */}
      <div className="p-3 border-b border-white/10">
        <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
          Phrase Length
        </div>
        <div className="space-y-1">
          {LENGTH_OPTIONS.map((option) => (
            <button
              key={option.id}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => toggleLength(option.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  filterState.lengths.has(option.id)
                    ? "bg-primary border-primary"
                    : "border-white/30"
                }`}>
                  {filterState.lengths.has(option.id) && (
                    <IconCheck className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-sm text-white">{option.label}</span>
              </div>
              <span className="text-xs text-white/40">{option.range}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Language Section */}
      <div className="p-3">
        <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
          Language
        </div>
        <div className="space-y-1">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setLanguage(option.id)}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                filterState.language === option.id
                  ? "border-primary"
                  : "border-white/30"
              }`}>
                {filterState.language === option.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm text-white">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

  // Metric dropdown portal
  const metricDropdown = isMetricDropdownOpen && isMounted && createPortal(
    <div 
      ref={metricDropdownRef}
      className="fixed w-48 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      style={{
        top: metricDropdownPosition.top,
        left: metricDropdownPosition.left,
        zIndex: 9999,
      }}
    >
      <div className="p-2">
        {SCORE_METRIC_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              filterState.scoreMetric === option.id
                ? "bg-primary/20 text-primary"
                : "hover:bg-white/5 text-white/80"
            }`}
            onClick={() => handleMetricChange(option.id)}
          >
            <span className="text-sm">{option.label}</span>
            {filterState.scoreMetric === option.id && (
              <IconCheck className="w-4 h-4" />
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="flex items-center justify-center gap-4 px-5 py-3.5">
      {/* Search Input with integrated Filter Dropdown */}
      <div className="h-12 flex items-center bg-white/5 border border-white/5 rounded-lg overflow-hidden">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search & Filter phrases"
            value={filterState.searchQuery}
            onChange={handleSearch}
            className="w-48 h-12 pl-9 pr-3 bg-transparent text-white/90 placeholder-white/40 text-sm focus:outline-none"
          />
        </div>
        <button 
          ref={buttonRef}
          className="h-12 flex items-center gap-1.5 px-5 border-l border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="max-w-[100px] truncate">{getFilterSummary()}</span>
          <IconSelector className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>
      
      {/* Filter Dropdown Portal */}
      {dropdown}
      
      {/* Select Button - immediately after search for text-based workflow */}
      <button 
        className={`${btnBase} ${selectedCount > 0 ? "bg-primary/20 border-primary/30 text-primary hover:bg-primary/30" : ""}`}
        onClick={onSelectFiltered}
      >
        {selectedCount > 0 ? (
          <IconCheck className="w-4 h-4" />
        ) : (
          <div className="w-4 h-4 border border-white/40 rounded" />
        )}
        <span>{selectedCount > 0 ? `${selectedCount} Selected` : "Select"}</span>
      </button>
      
      {/* Hide Button - paired with Select for quick workflow */}
      <button 
        className={`${btnBase} ${selectedCount > 0 ? "bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30" : ""}`}
        onClick={onHideSelected}
        disabled={selectedCount === 0}
      >
        <IconEyeOff className="w-4 h-4" />
        <span>Hide{selectedCount > 0 ? ` (${selectedCount})` : ""}</span>
      </button>
      
      {/* Score Metric Dropdown */}
      <button 
        ref={metricButtonRef}
        className={btnBase}
        onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
      >
        <span>{currentMetricLabel}</span>
        <IconChevronDown className="w-4 h-4 text-white/40" />
      </button>
      
      {/* Metric Dropdown Portal */}
      {metricDropdown}
      
      {/* Threshold Stepper Group */}
      <div className="h-12 flex items-center bg-white/5 border border-white/5 rounded-lg overflow-hidden">
        <button 
          className="w-10 h-12 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors border-r border-white/10 text-lg"
          onClick={handleThresholdDecrement}
        >
          −
        </button>
        <span className="w-12 h-12 flex items-center justify-center text-white font-medium text-sm bg-white/5">
          {filterState.scoreThreshold}
        </span>
        <button 
          className="w-10 h-12 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors border-l border-white/10 text-lg"
          onClick={handleThresholdIncrement}
        >
          +
        </button>
      </div>
      
      {/* Preset Button - fixed value set once when scores loaded */}
      <button 
        className="h-12 px-4 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
        onClick={() => onFilterChange({ ...filterState, scoreThreshold: presetValue })}
        title={`Set threshold to ${presetValue}`}
      >
        {presetValue}
      </button>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS (exported for use in parent)
// =============================================================================

export function getWordCount(phrase: string): number {
  return phrase.trim().split(/\s+/).length;
}

export function getLengthCategory(wordCount: number): LengthFilter {
  if (wordCount <= 1) return "short";      // Single: 1 word
  if (wordCount <= 5) return "medium";     // Short: 2-5 words
  if (wordCount <= 9) return "long";       // Medium: 6-9 words
  return "extraLong";                      // Long: 10+ words
}

// Language detection patterns
const LANGUAGE_PATTERNS: Record<string, RegExp> = {
  hindi: /\b(hindi|हिंदी)\b/i,
  tamil: /\b(tamil|தமிழ்)\b/i,
  telugu: /\b(telugu|తెలుగు)\b/i,
  malayalam: /\b(malayalam|മലയാളം)\b/i,
  bengali: /\b(bengali|bangla|বাংলা)\b/i,
  kannada: /\b(kannada|ಕನ್ನಡ)\b/i,
  marathi: /\b(marathi|मराठी)\b/i,
  gujarati: /\b(gujarati|ગુજરાતી)\b/i,
  punjabi: /\b(punjabi|ਪੰਜਾਬੀ)\b/i,
  urdu: /\b(urdu|اردو)\b/i,
  arabic: /\b(arabic|العربية)\b/i,
  spanish: /\b(español|spanish|en español)\b/i,
  portuguese: /\b(portuguese|português)\b/i,
  french: /\b(french|français)\b/i,
  german: /\b(german|deutsch)\b/i,
  russian: /\b(russian|русский)\b/i,
  japanese: /\b(japanese|日本語)\b/i,
  korean: /\b(korean|한국어)\b/i,
  chinese: /\b(chinese|中文|mandarin)\b/i,
  vietnamese: /\b(vietnamese|tiếng việt)\b/i,
  thai: /\b(thai|ไทย)\b/i,
  indonesian: /\b(indonesian|bahasa)\b/i,
  turkish: /\b(turkish|türkçe)\b/i,
  italian: /\b(italian|italiano)\b/i,
  dutch: /\b(dutch|nederlands)\b/i,
  polish: /\b(polish|polski)\b/i,
  amharic: /\b(amharic|አማርኛ)\b/i,
};

export function hasNonEnglishIndicator(phrase: string): boolean {
  return Object.values(LANGUAGE_PATTERNS).some(pattern => pattern.test(phrase));
}

export interface PhraseScores {
  topic: number | null;
  fit: number | null;
  pop: number | null;
  comp: number | null;
  spread: number | null;
}

export function phraseMatchesFilter(
  phrase: string, 
  filterState: FilterState, 
  scores?: PhraseScores
): boolean {
  const wordCount = getWordCount(phrase);
  const lengthCategory = getLengthCategory(wordCount);
  
  // Check length filter
  if (!filterState.lengths.has(lengthCategory)) {
    return false;
  }
  
  // Check language filter
  const isNonEnglish = hasNonEnglishIndicator(phrase);
  if (filterState.language === "english" && isNonEnglish) {
    return false;
  }
  if (filterState.language === "nonEnglish" && !isNonEnglish) {
    return false;
  }
  
  // Check search query - WORD-BASED search
  // Each word in the query must appear somewhere in the phrase
  // This allows searching for "favor" to find "what does youtube algorithm favor"
  if (filterState.searchQuery) {
    const normalizedPhrase = phrase.toLowerCase().trim();
    const queryWords = filterState.searchQuery.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
    
    // Every word in the query must be found in the phrase
    for (const word of queryWords) {
      if (!normalizedPhrase.includes(word)) {
        return false;
      }
    }
  }
  
  // Score threshold filtering is NOT applied here
  // The threshold is used for SELECTING phrases to hide, not for filtering the view
  // This keeps all phrases visible so the user can see what they're about to hide
  
  return true;
}

// Check if a phrase is BELOW the threshold (should be selected for hiding)
export function phraseBelowThreshold(
  filterState: FilterState,
  scores?: PhraseScores
): boolean {
  if (filterState.scoreThreshold === 0) return false;
  if (!scores) return false;
  
  const scoreValue = scores[filterState.scoreMetric];
  if (scoreValue === null || scoreValue === undefined) return false;
  
  return scoreValue < filterState.scoreThreshold;
}
