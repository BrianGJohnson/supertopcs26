"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { IconX, IconChevronLeft } from "@tabler/icons-react";
import { authFetch } from "@/lib/supabase";
import {
  type ViewerLandscape,
  type VibeCategory,
  type SignalLevel,
  getSignalColorClass,
  getSignalBgClass,
  getVibeIcon,
  getVibeLabel,
  getVibeBgClass,
} from "@/lib/viewer-landscape";

interface ViewerLandscapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed: string;
  onCreateSession?: (seed: string) => void;
  onPass?: () => void;
}

interface ApiResponse {
  landscape: ViewerLandscape;
}

// SuperTopic threshold - ONLY for phrases with rich data (not parent-informed)
// Must be VERY high - SuperTopic is special!
const SUPERTOPIC_THRESHOLD = 92;

// Data quality thresholds
const SPARSE_DATA_THRESHOLD = 4;  // ≤4 suggestions = sparse data, need parent context
const MIN_SUGGESTIONS_FOR_GO = 6;  // Need at least 6 suggestions for confident "Go" signal

/**
 * Convert suggestion count to points (0-50 scale)
 * Used for demand scoring algorithm
 */
function suggestionCountToPoints(count: number): number {
  const pointsMap: Record<number, number> = {
    14: 50,
    13: 47,
    12: 44,
    11: 40,
    10: 36,
    9: 32,
    8: 28,
    7: 24,
    6: 20,
    5: 16,
    4: 12,
    3: 8,
    2: 4,
    1: 2,
    0: 0,
  };
  return pointsMap[Math.min(count, 14)] ?? 0;
}

/**
 * Calculate demand score using Parent + Child algorithm
 * Returns 0-100 score based on combined suggestion counts
 */
function calculateDemandScore(childSuggestions: number, parentSuggestions: number | null): number {
  const childPoints = suggestionCountToPoints(childSuggestions);
  
  if (parentSuggestions !== null) {
    // Have parent context - use combined scoring
    const parentPoints = suggestionCountToPoints(parentSuggestions);
    return parentPoints + childPoints;
  }
  
  // No parent context - double the child points (treat as both parent and child)
  // This way a top-level phrase with 14 suggestions still scores high
  return childPoints * 2;
}

/**
 * Capitalize each word in a phrase
 */
function capitalizePhrase(phrase: string): string {
  return phrase
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get designation badge based on demand score
 * Returns icon, label, and styling for the header badge
 */
function getDesignationBadge(demandScore: number, isSuperTopic: boolean): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
} {
  if (isSuperTopic) {
    return { icon: '🏆', label: 'SuperTopic', color: 'text-[#FFD700]', bgColor: 'bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border-[#FFD700]/50' };
  } else if (demandScore >= 90) {
    return { icon: '🔥', label: 'Extreme Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (demandScore >= 70) {
    return { icon: '⚡', label: 'High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (demandScore >= 40) {
    return { icon: '💡', label: 'Moderate Demand', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  } else {
    return { icon: '❄️', label: 'Low Interest', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
  }
}

/**
 * Get demand label based on score (for the Demand card)
 */
function getDemandLabel(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 90) {
    return { label: 'Extreme Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (score >= 80) {
    return { label: 'Very High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (score >= 70) {
    return { label: 'High Demand', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (score >= 60) {
    return { label: 'Solid Demand', color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
  } else if (score >= 50) {
    return { label: 'Good Demand', color: 'text-[#6B9BD1]', bgColor: 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' };
  } else if (score >= 40) {
    return { label: 'Moderate Demand', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  } else if (score >= 30) {
    return { label: 'Low Demand', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  }
  return { label: 'Minimal Demand', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
}

/**
 * Get word count from a phrase
 */
function getWordCount(phrase: string): number {
  return phrase.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Assess child data quality based on suggestion count
 * Returns confidence level and demand weight multiplier
 */
function assessDataQuality(suggestionCount: number): {
  quality: 'excellent' | 'good' | 'moderate' | 'sparse';
  demandWeight: number;
  hasDemand: boolean;
  description: string;
} {
  if (suggestionCount >= 12) {
    return { 
      quality: 'excellent', 
      demandWeight: 1.0, 
      hasDemand: true,
      description: 'Strong demand signal'
    };
  } else if (suggestionCount >= 9) {
    return { 
      quality: 'good', 
      demandWeight: 0.85, 
      hasDemand: true,
      description: 'Good demand signal'
    };
  } else if (suggestionCount >= 5) {
    return { 
      quality: 'moderate', 
      demandWeight: 0.70, 
      hasDemand: true,
      description: 'Moderate demand signal'
    };
  }
  // ≤4 suggestions = sparse data
  return { 
    quality: 'sparse', 
    demandWeight: 0.40, 
    hasDemand: false,
    description: 'Limited data - need parent context'
  };
}

/**
 * Get demand level based on topic match and suggestion count
 * Now uses the sliding scale for data quality
 */
function getDemandLevel(topicMatchPercent: number, suggestionCount: number): { 
  level: 'high' | 'medium' | 'low'; 
  label: string;
  color: string;
  bgColor: string;
} {
  const dataQuality = assessDataQuality(suggestionCount);
  
  // If we have demand (5+ suggestions), assess level based on topic match
  if (dataQuality.hasDemand) {
    if (dataQuality.quality === 'excellent' || (suggestionCount >= 10 && topicMatchPercent >= 70)) {
      return { level: 'high', label: 'High', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
    } else if (topicMatchPercent >= 50) {
      return { level: 'medium', label: 'Medium', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
    }
    // 5+ suggestions but low topic match
    return { level: 'medium', label: 'Medium', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  }
  
  // Sparse data - can't reliably assess demand
  return { level: 'low', label: 'Low', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
}

/**
 * Get competition level based on exact match percent
 */
function getCompetitionLevel(exactMatchPercent: number): {
  level: 'low' | 'medium' | 'high';
  label: string;
  color: string;
  bgColor: string;
} {
  if (exactMatchPercent <= 25) {
    return { level: 'low', label: 'Low', color: 'text-[#2BD899]', bgColor: 'bg-[#2BD899]/15 border-[#2BD899]/40' };
  } else if (exactMatchPercent <= 50) {
    return { level: 'medium', label: 'Medium', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' };
  }
  return { level: 'high', label: 'High', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40' };
}

/**
 * Get progress bar color based on score
 */
function getScoreColor(score: number): string {
  if (score >= SUPERTOPIC_THRESHOLD) return 'bg-gradient-to-r from-[#FFD700] to-[#FFA500]';
  if (score >= 70) return 'bg-[#2BD899]';
  if (score >= 50) return 'bg-[#6B9BD1]';
  if (score >= 35) return 'bg-[#F59E0B]';
  return 'bg-[#FF6B6B]';
}

/**
 * Get signal based on effective score
 * Used when we have inherited/calculated score
 * 
 * NOTE: Parent-informed phrases should NOT get SuperTopic status
 * They cap at "Go" because they don't have enough direct data
 */
function getSignalFromEffectiveScore(score: number, isParentInformed: boolean = false): { 
  signal: SignalLevel; 
  label: string; 
  icon: string;
} {
  // Parent-informed phrases cap at "Go" - cannot be SuperTopic
  if (score >= 85 && !isParentInformed) {
    return { signal: 'go', label: 'SuperTopic', icon: '🌟' };
  } else if (score >= 70) {
    return { signal: 'go', label: 'Go', icon: '🟢' };
  } else if (score >= 50) {
    return { signal: 'go', label: 'Good', icon: '🟢' };
  } else if (score >= 35) {
    return { signal: 'caution', label: 'Caution', icon: '🟡' };
  }
  return { signal: 'stop', label: 'Stop', icon: '🔴' };
}

/**
 * Determine signal for a phrase based on suggestions and score
 * Stricter thresholds: need 6+ suggestions for confident "Go"
 */
function getStrictSignal(suggestionCount: number, rawScore: number, exactMatchPercent: number): {
  signal: SignalLevel;
  label: string;
  icon: string;
} {
  // Not enough data for confident assessment
  if (suggestionCount < MIN_SUGGESTIONS_FOR_GO) {
    // With sparse data, be cautious even if score looks good
    if (rawScore >= 70 && exactMatchPercent <= 30) {
      // Could be good, but not enough data to be sure
      return { signal: 'caution', label: 'Caution', icon: '🟡' };
    }
    return { signal: 'caution', label: 'Caution', icon: '🟡' };
  }
  
  // 6+ suggestions - use normal scoring
  if (rawScore >= SUPERTOPIC_THRESHOLD && suggestionCount >= 10) {
    return { signal: 'go', label: 'SuperTopic', icon: '🌟' };
  } else if (rawScore >= 70) {
    return { signal: 'go', label: 'Go', icon: '🟢' };
  } else if (rawScore >= 50) {
    return { signal: 'go', label: 'Good', icon: '🟢' };
  } else if (rawScore >= 35) {
    return { signal: 'caution', label: 'Caution', icon: '🟡' };
  }
  return { signal: 'stop', label: 'Stop', icon: '🔴' };
}

/**
 * Drill-down context - tracks where a phrase came from
 * Enhanced to support full breadcrumb path and depth tracking
 */
interface DrillDownContext {
  phrase: string;
  position: number;           // 1-14 position in parent's Popular Topics
  parentScore: number;        // Parent's opportunity score
  parentPhrase: string;       // The parent phrase
  siblingCount: number;       // How many siblings (parent's suggestion count)
  parentSuggestionCount: number; // Parent's suggestion count for demand calculation
  level: number;              // Depth level (1 = first drill, 2 = second, etc.)
  originalSeed: string;       // The phrase user originally typed
  fullPath: string[];         // Full breadcrumb path: [seed, level1, level2, ...]
  parentDemandScore: number;  // Parent's demand score for sustained demand check
}

/**
 * Calculate Opportunity Score
 * Combines multiple signals into a single 0-100 score
 * 
 * Components:
 * 1. Depth Boost (0-30): How many levels deep can we go?
 * 2. Low Comp Signal (0-25): Low exact match + high topic match
 * 3. Position Power (0-15): Top positions in parent's suggestions
 * 4. Relevancy Boost (0-15): Does child contain parent phrase?
 * 5. Long-Term Views Boost (0-15): Evergreen topic indicators
 */
function calculateOpportunityScore(
  exactMatchPercent: number,
  topicMatchPercent: number,
  suggestionCount: number,
  context: DrillDownContext | null,
  phrase: string
): { score: number; breakdown: { depth: number; lowComp: number; position: number; relevancy: number; longTerm: number } } {
  let depthBoost = 0;
  let lowCompBoost = 0;
  let positionBoost = 0;
  let relevancyBoost = 0;
  let longTermBoost = 0;
  let demandBaseBoost = 0;

  // Check for evergreen pattern early (needed for Level 1 boost)
  const phraseLowerForCheck = phrase.toLowerCase();
  const isStrongEvergreenPhrase = phraseLowerForCheck.startsWith('how to') || 
    phraseLowerForCheck.startsWith('what is') || 
    phraseLowerForCheck.startsWith('why') ||
    phraseLowerForCheck.includes('tutorial') ||
    phraseLowerForCheck.includes('beginner');

  // 0. DEMAND BASE (0-30)
  // Even Level 1 phrases deserve opportunity credit based on demand
  // High demand = baseline opportunity exists
  if (suggestionCount >= 12) {
    demandBaseBoost = 30; // Maximum demand
  } else if (suggestionCount >= 10) {
    demandBaseBoost = 25;
  } else if (suggestionCount >= 7) {
    demandBaseBoost = 18;
  } else if (suggestionCount >= 5) {
    demandBaseBoost = 12;
  } else if (suggestionCount >= 3) {
    demandBaseBoost = 5;
  }

  // 1. DEPTH BOOST (0-40)
  // DEEPER = EASIER TO RANK = HIGHER OPPORTUNITY
  // The deeper we go while maintaining suggestions, the better the opportunity
  if (context) {
    const level = context.level;
    if (level >= 4) {
      depthBoost = 35; // Maximum depth bonus - very easy to rank
    } else if (level === 3) {
      depthBoost = 30; // Great - 3 levels deep
    } else if (level === 2) {
      depthBoost = 22; // Good - 2 levels deep
    } else if (level === 1) {
      depthBoost = 12; // First drill-down
    }
    // Bonus if parent had strong suggestions (sustained demand)
    if (context.parentSuggestionCount >= 10) {
      depthBoost += 3;
    }
  } else {
    // Level 1 (no context) - but give bonus for already-specific phrases
    // Phrases like "How to introduce yourself on YouTube" are already long-tail
    // They don't NEED depth drilling - they ARE the specific phrase
    const wordCount = phrase.split(' ').length;
    if (wordCount >= 6 && isStrongEvergreenPhrase && suggestionCount >= 10) {
      depthBoost = 10; // Strong Level 1 phrase - already specific
    } else if (wordCount >= 5 && isStrongEvergreenPhrase && suggestionCount >= 8) {
      depthBoost = 6; // Good Level 1 phrase
    }
  }

  // 2. LOW COMP SIGNAL (0-25)
  // Low exact match + high topic match = opportunity signal
  if (exactMatchPercent <= 20 && topicMatchPercent >= 80) {
    lowCompBoost = 25; // Strong low comp signal
  } else if (exactMatchPercent <= 30 && topicMatchPercent >= 60) {
    lowCompBoost = 20; // Good low comp signal
  } else if (exactMatchPercent <= 40 && topicMatchPercent >= 50) {
    lowCompBoost = 12; // Moderate signal
  } else if (exactMatchPercent <= 50 && topicMatchPercent >= 40) {
    lowCompBoost = 5; // Slight signal
  }

  // 3. POSITION POWER (0-15)
  // Being #1 or #2 in parent's suggestions = YouTube thinks you're relevant
  if (context) {
    if (context.position === 1) {
      positionBoost = 15;
    } else if (context.position === 2) {
      positionBoost = 12;
    } else if (context.position <= 4) {
      positionBoost = 8;
    } else if (context.position <= 7) {
      positionBoost = 4;
    }
    // Extra boost if high position with many siblings
    if (context.position <= 2 && context.siblingCount >= 10) {
      positionBoost += 3;
    }
  }

  // 4. RELEVANCY BOOST (0-15)
  // Does child phrase contain parent phrase? (ranking ladder potential)
  if (context) {
    const parentLower = context.parentPhrase.toLowerCase();
    const childLower = phrase.toLowerCase();
    if (childLower.startsWith(parentLower)) {
      relevancyBoost = 15; // Child builds directly on parent
    } else if (childLower.includes(parentLower) || parentLower.includes(childLower.split(' ').slice(0, 3).join(' '))) {
      relevancyBoost = 10; // Strong relevancy
    }
    // Check grandparent relevancy through fullPath - modest bonus
    if (context.fullPath.length >= 2) {
      const grandparent = context.fullPath[context.fullPath.length - 2].toLowerCase();
      if (childLower.includes(grandparent.split(' ').slice(0, 2).join(' '))) {
        relevancyBoost += 3; // Bonus for grandparent relevancy
      }
    }
  }

  // 5. LONG-TERM VIEWS BOOST (0-25)
  // Evergreen topic indicators - comprehensive list matching semantic prefixes
  const phraseLower = phrase.toLowerCase();
  
  // Evergreen prefixes (question starters that indicate educational/how-to content)
  const evergreenPrefixes = [
    // Question words (match SEMANTIC_PREFIXES)
    'how', 'how to', 'how do', 'how does', 'how can', 'how should',
    'what', 'what is', 'what are', 'what does', 'what do', 'what should',
    'why', 'why is', 'why are', 'why does', 'why do', 'why should',
    'when', 'when to', 'when should', 'when do', 'when does',
    'where', 'where to', 'where can', 'where do',
    'which', 'which is', 'which are',
    'who', 'who is', 'who are', 'who can',
    // Intent phrases
    'can you', 'can i', 'should i', 'should you',
    'is it', 'are there', 'do i', 'do you',
    'learn', 'learn to', 'learn how',
    'guide to', 'guide for', 'introduction to',
    'ways to', 'steps to', 'ideas for',
    'best', 'best way', 'best ways', 'top',
    'improve', 'fix', 'solve',
  ];
  
  // Evergreen suffixes (can appear at end OR anywhere in phrase)
  const evergreenSuffixes = [
    // Instructional
    'tutorial', 'tutorials', 'guide', 'guides',
    'course', 'courses', 'class', 'classes',
    'lesson', 'lessons', 'training',
    'walkthrough', 'demonstration', 'demo',
    // Skill level
    'beginner', 'beginners', 'for beginners',
    'basics', 'basic', 'fundamentals', 'essentials',
    'advanced', 'intermediate', 'masterclass',
    // Improvement
    'tips', 'tricks', 'tips and tricks',
    'hacks', 'secrets', 'techniques',
    'strategies', 'tactics', 'methods',
    // Process
    'step by step', 'step-by-step', 'complete guide',
    'full guide', 'ultimate guide', 'explained',
    'introduction', 'intro', 'overview',
    // Review/comparison
    'review', 'reviews', 'comparison', 'vs',
    // Problem solving
    'fixed', 'solved', 'solution', 'solutions',
    'troubleshoot', 'troubleshooting',
    // Learning
    'learn', 'learning', 'teach', 'teaching',
    'practice', 'exercises', 'examples',
  ];
  
  const hasEvergreenPrefix = evergreenPrefixes.some(prefix => phraseLower.startsWith(prefix));
  const hasEvergreenSuffix = evergreenSuffixes.some(suffix => phraseLower.includes(suffix));
  const hasEvergreenPattern = hasEvergreenPrefix || hasEvergreenSuffix;
  
  if (hasEvergreenPattern) {
    const wordCount = phrase.split(' ').length;
    
    // Base boost depends on phrase length - longer phrases are more specific/valuable
    // Note: Demand is already rewarded in Demand Base, so we don't double-count here
    if (wordCount >= 6) {
      longTermBoost = 14; // Full base for long specific phrases
    } else if (wordCount === 5) {
      longTermBoost = 13; // Good length
    } else {
      longTermBoost = 12; // Moderate base for shorter phrases
    }
  }

  const totalScore = Math.min(100, demandBaseBoost + depthBoost + lowCompBoost + positionBoost + relevancyBoost + longTermBoost);

  return {
    score: totalScore,
    breakdown: {
      demandBase: demandBaseBoost,
      depth: depthBoost,
      lowComp: lowCompBoost,
      position: positionBoost,
      relevancy: relevancyBoost,
      longTerm: longTermBoost
    }
  };
}

/**
 * Check if phrase exhibits Low Comp Signal pattern
 */
function hasLowCompSignal(exactMatchPercent: number, topicMatchPercent: number, suggestionCount: number): boolean {
  return exactMatchPercent <= 30 && topicMatchPercent >= 60 && suggestionCount >= 5;
}

/**
 * Check if phrase exhibits Long-Term Views pattern
 */
function isLongTermViewsPattern(phrase: string, suggestionCount: number, context: DrillDownContext | null): boolean {
  const phraseLower = phrase.toLowerCase();
  
  // Evergreen prefixes
  const evergreenPrefixes = [
    'how', 'how to', 'what', 'what is', 'why', 'when', 'where', 'which',
    'learn', 'guide to', 'best', 'ways to', 'steps to',
  ];
  
  // Evergreen suffixes/keywords
  const evergreenSuffixes = [
    'tutorial', 'tutorials', 'guide', 'guides', 'course', 'beginner', 'beginners',
    'basics', 'tips', 'tricks', 'step by step', 'introduction', 'explained',
    'review', 'learn', 'for beginners',
  ];
  
  const hasPrefix = evergreenPrefixes.some(p => phraseLower.startsWith(p));
  const hasSuffix = evergreenSuffixes.some(s => phraseLower.includes(s));
  const hasPattern = hasPrefix || hasSuffix;
  
  const hasSustainedDemand = context ? context.parentDemandScore >= 70 : false;
  return (hasPattern && suggestionCount >= 8) || (hasSustainedDemand && suggestionCount >= 5);
}

/**
 * ViewerLandscapeModal
 * 
 * Adaptive modal that displays different levels of detail based on phrase length:
 * - 2-3 words: Discovery mode - Simple Go/Caution/Stop signal
 * - 4+ words: Opportunity mode - Full scoring with Demand/Competition breakdown
 * 
 * Supports drill-down navigation: clicking a Popular Topic opens that phrase's analysis.
 * Users can navigate back through the breadcrumb trail.
 * 
 * SCORING ALGORITHM:
 * 
 * 1. CHILD DATA QUALITY (based on suggestion count):
 *    - 12+ suggestions: Excellent (100% weight, scores on own merits)
 *    - 9-11 suggestions: Good (85% weight, scores on own merits)
 *    - 5-8 suggestions: Moderate (70% weight, scores on own merits)
 *    - ≤4 suggestions: Sparse (needs parent context)
 * 
 * 2. WHEN CHILD HAS SPARSE DATA + PARENT CONTEXT:
 *    - Demand inherited from parent
 *    - Competition = position among siblings (1 of 14 = low competition)
 *    - Score blends parent's score with position bonus
 * 
 * 3. WHEN CHILD HAS SPARSE DATA + NO PARENT:
 *    - Show "Limited data" message
 *    - Suggest trying a shorter phrase
 */
export function ViewerLandscapeModal({
  isOpen,
  onClose,
  seed,
  onCreateSession,
  onPass,
}: ViewerLandscapeModalProps) {
  const [landscape, setLandscape] = useState<ViewerLandscape | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Navigation stack for drill-down (stores context about each drilled phrase)
  const [drillDownStack, setDrillDownStack] = useState<DrillDownContext[]>([]);
  
  // Current context (if drilled down)
  const currentContext = drillDownStack.length > 0 ? drillDownStack[drillDownStack.length - 1] : null;
  
  // Current phrase being viewed (either the original seed or a drilled-down topic)
  const currentPhrase = currentContext ? currentContext.phrase : seed;
  const canGoBack = drillDownStack.length > 0;

  // Calculate word count and display mode based on CURRENT phrase
  // Opportunity mode (full breakdown) triggers at 3+ words now
  const wordCount = useMemo(() => getWordCount(currentPhrase), [currentPhrase]);
  const isOpportunityMode = wordCount >= 3;
  
  /**
   * Calculate effective score based on data quality and parent context
   * 
   * NEW ALGORITHM:
   * 
   * 1. If child has 5+ suggestions → scores on own merits (Low Comp formula)
   *    - Uses sliding scale: 12+ = 100%, 9-11 = 85%, 5-8 = 70%
   * 
   * 2. If child has ≤4 suggestions AND has parent context:
   *    - Demand inherited from parent
   *    - Position among siblings determines niche opportunity
   *    - Score = parent score adjusted by position
   * 
   * 3. If child has ≤4 suggestions AND no parent context:
   *    - Use raw score (will show "limited data" message in UI)
   */
  const calculateEffectiveScore = useCallback((rawChildScore: number, suggestionCount: number): {
    score: number;
    isParentInformed: boolean;
    dataQuality: ReturnType<typeof assessDataQuality>;
  } => {
    const dataQuality = assessDataQuality(suggestionCount);
    
    // CASE 1: Child has enough data (5+ suggestions) - scores on own merits
    if (dataQuality.hasDemand) {
      // Apply weight based on data quality
      // Higher suggestion count = more confidence in the score
      const weightedScore = Math.round(rawChildScore * dataQuality.demandWeight + (100 * (1 - dataQuality.demandWeight) * (rawChildScore / 100)));
      return {
        score: Math.min(100, Math.max(0, rawChildScore)), // Use raw score, quality affects display
        isParentInformed: false,
        dataQuality,
      };
    }
    
    // CASE 2: Child has sparse data (≤4 suggestions)
    if (!currentContext) {
      // No parent context - use raw score, UI will show "limited data"
      return {
        score: rawChildScore,
        isParentInformed: false,
        dataQuality,
      };
    }
    
    // CASE 3: Sparse data WITH parent context - use parent-informed scoring
    const parentScore = currentContext.parentScore;
    const position = currentContext.position;
    const siblingCount = currentContext.siblingCount;
    
    // Position-based scoring:
    // Being position #1 of 14 siblings is better than #5 of 14
    // Lower position = more prominent in autocomplete = more demand signal
    const positionBonus = Math.max(0, 20 - (position * 3)); // #1 = +17, #2 = +14, #3 = +11, #4 = +8, #5 = +5
    
    // Sibling competition factor:
    // 1 of 14 siblings = low competition (this phrase is 7% of the space)
    // 1 of 5 siblings = higher competition (this phrase is 20% of the space)
    const siblingCompetition = siblingCount > 0 ? (1 / siblingCount) : 0.1;
    const competitionBonus = siblingCompetition < 0.15 ? 10 : siblingCompetition < 0.25 ? 5 : 0;
    
    // Final score: parent score adjusted by position and competition
    // Parent score is the foundation (this phrase exists in a strong parent)
    // Position and competition bonuses reward specificity
    const inheritedScore = Math.round(parentScore * 0.85) + positionBonus + competitionBonus;
    
    return {
      score: Math.min(100, Math.max(0, inheritedScore)),
      isParentInformed: true,
      dataQuality,
    };
  }, [currentContext]);

  // Reset navigation when modal closes or seed changes
  useEffect(() => {
    if (!isOpen) {
      setDrillDownStack([]);
    }
  }, [isOpen, seed]);

  // Ensure we're on the client for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Lock scroll and attach escape listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Fetch data when modal opens or current phrase changes
  useEffect(() => {
    if (!isOpen || !currentPhrase) return;

    const fetchLandscape = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/seed-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seed: currentPhrase.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze seed phrase");
        }

        const data: ApiResponse = await response.json();
        setLandscape(data.landscape);
      } catch (err) {
        console.error("[ViewerLandscapeModal] Error:", err);
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandscape();
  }, [isOpen, currentPhrase]);

  /**
   * Navigate to a new phrase (drill down) with context
   * Enhanced to track full breadcrumb path and depth level
   */
  const handleDrillDown = useCallback((phrase: string, position: number) => {
    // Don't drill down to the same phrase
    if (phrase.toLowerCase().trim() === currentPhrase.toLowerCase().trim()) return;
    
    // Determine the current level and path
    const currentLevel = drillDownStack.length;
    const previousContext = drillDownStack[drillDownStack.length - 1];
    
    // Build the full path
    let fullPath: string[];
    let originalSeed: string;
    
    if (currentLevel === 0) {
      // First drill-down: seed is the current phrase (what user typed)
      fullPath = [currentPhrase, phrase];
      originalSeed = seed;
    } else if (previousContext) {
      // Subsequent drill-downs: extend the path
      fullPath = [...previousContext.fullPath, phrase];
      originalSeed = previousContext.originalSeed;
    } else {
      fullPath = [seed, phrase];
      originalSeed = seed;
    }
    
    // Create context for this drill-down
    const context: DrillDownContext = {
      phrase,
      position,
      parentScore: landscape?.signalScore || 0,
      parentPhrase: currentPhrase,
      siblingCount: landscape?.suggestionCount || 0,
      parentSuggestionCount: landscape?.suggestionCount || 0,
      level: currentLevel + 1,  // Level 1 = first drill, Level 2 = second, etc.
      originalSeed,
      fullPath,
      // Calculate parent demand score inline to avoid circular dependency
      parentDemandScore: calculateDemandScore(
        landscape?.suggestionCount || 0, 
        previousContext?.parentSuggestionCount ?? null
      ),
    };
    
    // Push onto the stack
    setDrillDownStack(prev => [...prev, context]);
  }, [currentPhrase, landscape?.signalScore, landscape?.suggestionCount, drillDownStack, seed]);

  /**
   * Navigate back to the previous phrase
   */
  const handleGoBack = useCallback(() => {
    setDrillDownStack(prev => prev.slice(0, -1));
  }, []);

  // Get vibes to display (only those with > 0%)
  const getDisplayVibes = (): { vibe: VibeCategory; percent: number }[] => {
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
    
    // Filter out 0% and sort by percent descending
    return vibes
      .filter(v => v.percent > 0)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, isOpportunityMode ? 3 : 4); // Show fewer in opportunity mode
  };

  // Don't render on server or if not open
  if (!mounted || !isOpen) return null;

  // Calculate effective score using new algorithm
  const rawScore = landscape?.signalScore || 0;
  const suggestionCount = landscape?.suggestionCount || 0;
  const scoreResult = calculateEffectiveScore(rawScore, suggestionCount);
  const effectiveScore = scoreResult.score;
  const isParentInformed = scoreResult.isParentInformed;
  const dataQuality = scoreResult.dataQuality;
  
  // Calculate NEW demand score using Parent + Child algorithm
  const parentSuggestionCount = currentContext?.parentSuggestionCount ?? null;
  const demandScore = calculateDemandScore(suggestionCount, parentSuggestionCount);
  const demandInfo = getDemandLabel(demandScore);
  
  // Calculate OPPORTUNITY score using multi-signal algorithm
  const exactMatchPercent = landscape?.exactMatchPercent || 0;
  const topicMatchPercent = landscape?.topicMatchPercent || 0;
  const opportunityResult = calculateOpportunityScore(
    exactMatchPercent,
    topicMatchPercent,
    suggestionCount,
    currentContext,
    currentPhrase
  );
  const opportunityScore = opportunityResult.score;
  const opportunityBreakdown = opportunityResult.breakdown;
  
  // Check for special patterns
  const hasLowComp = hasLowCompSignal(exactMatchPercent, topicMatchPercent, suggestionCount);
  const hasLongTermViews = isLongTermViewsPattern(currentPhrase, suggestionCount, currentContext);
  
  // Current depth level
  const currentLevel = currentContext?.level || 0;
  
  // Determine if we should show demand/competition cards
  // Show them when: child has enough data (5+ suggestions) OR no parent context
  // Hide them when: sparse data with parent context (would be misleading)
  const showDemandCompetitionCards = dataQuality.hasDemand || !currentContext;
  const showSparseDataMessage = !dataQuality.hasDemand && !currentContext;
  
  // Use effective score for all evaluations
  // SuperTopic requires: high score + NOT parent-informed + enough data (10+ suggestions)
  const isSuperTopic = effectiveScore >= SUPERTOPIC_THRESHOLD && !isParentInformed && suggestionCount >= 10;
  const demand = landscape ? getDemandLevel(landscape.topicMatchPercent, landscape.suggestionCount) : null;
  const competition = landscape ? getCompetitionLevel(landscape.exactMatchPercent) : null;
  
  // Get strict signal based on data quality
  const strictSignal = landscape ? getStrictSignal(suggestionCount, rawScore, landscape.exactMatchPercent) : null;

  // Use portal to render at document.body level, escaping any transform ancestors
  return createPortal(
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Centering container */}
      <div className="relative z-[10001] flex min-h-full items-center justify-center p-4">
        {/* Modal Card */}
        <div className="relative w-full max-w-5xl bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col my-8">
          {/* Navigation bar - Back button and Close button */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            {/* Back button (when drilled down) */}
            {canGoBack ? (
              <button
                onClick={handleGoBack}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <IconChevronLeft size={20} />
                <span className="text-sm">Back</span>
              </button>
            ) : (
              <div /> /* Spacer */
            )}
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <IconX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-10 pb-10 pt-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-14 h-14 animate-spin text-[#6B9BD1]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-5 text-white/50 text-xl">
                {isOpportunityMode ? "Analyzing opportunity..." : "Analyzing viewer landscape..."}
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-16">
              <p className="text-red-400 text-xl">{error}</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 text-lg"
              >
                Close
              </button>
            </div>
          )}

          {/* Success state */}
          {landscape && !isLoading && (
            <>
              {/* HEADER: Designation Badge + Capitalized Phrase + Level Indicator */}
              {(() => {
                const badge = getDesignationBadge(demandScore, isSuperTopic);
                return (
                  <div className="flex flex-col gap-3">
                    {/* Badge Row with Level Indicator */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-full border ${badge.bgColor}`}>
                        {isSuperTopic ? (
                          <img 
                            src="/logo-supertopics.svg" 
                            alt="SuperTopic" 
                            className="h-7 w-auto"
                          />
                        ) : (
                          <span className="text-2xl">{badge.icon}</span>
                        )}
                        <span className={`font-bold text-xl ${isSuperTopic ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent' : badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      {/* Level Indicator */}
                      {currentLevel > 0 && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                          <span className="text-white/50 text-sm">Level {currentLevel + 1}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/50 text-sm">{currentLevel + 1} deep</span>
                        </div>
                      )}
                    </div>
                    {/* Phrase - Capitalized */}
                    <h2 className="text-3xl font-semibold text-white">
                      {capitalizePhrase(currentPhrase)}
                    </h2>
                  </div>
                );
              })()}

              {/* OPPORTUNITY MODE: Full Scoring (3+ words) */}
              {isOpportunityMode && demand && competition && (
                <>
                  {/* Demand & Opportunity Cards - ALWAYS show both */}
                  <div className="grid grid-cols-2 gap-6 mt-8">
                    {/* Demand Card */}
                    <div className={`p-6 rounded-2xl border ${demandInfo.bgColor}`}>
                      <h4 className="text-base font-semibold text-white/50 uppercase tracking-wide mb-4">
                        Demand
                      </h4>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xl font-bold ${demandInfo.color}`}>
                          {demandInfo.label}
                        </span>
                        <span className={`text-3xl font-bold ${demandInfo.color}`}>
                          {demandScore}
                        </span>
                      </div>
                      <p className="text-white/60 text-base">
                        <span className="text-white/80 font-medium">
                          {landscape.exactMatchCount} of {landscape.suggestionCount}
                        </span>
                          {" "}exact match
                        </p>
                        <p className="text-white/60 text-base mt-1">
                          <span className="text-white/80 font-medium">
                            {landscape.topicMatchCount} of {landscape.suggestionCount}
                          </span>
                          {" "}topic match
                        </p>
                      </div>

                      {/* Opportunity Card - NEW ALGORITHM with breakdown */}
                      {(() => {
                        const oppColor = opportunityScore >= 60 ? 'text-[#2BD899]' : opportunityScore >= 40 ? 'text-[#6B9BD1]' : opportunityScore >= 20 ? 'text-[#F59E0B]' : 'text-[#FF6B6B]';
                        const oppBgColor = opportunityScore >= 60 ? 'bg-[#2BD899]/15 border-[#2BD899]/40' : opportunityScore >= 40 ? 'bg-[#6B9BD1]/15 border-[#6B9BD1]/40' : opportunityScore >= 20 ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40' : 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40';
                        const oppLabel = opportunityScore >= 70 ? 'Excellent' : opportunityScore >= 50 ? 'Strong' : opportunityScore >= 35 ? 'Good' : opportunityScore >= 20 ? 'Moderate' : 'Low';
                        
                        // Build breakdown items that have values
                        const breakdownItems = [
                          opportunityBreakdown.demandBase > 0 ? { label: 'Demand base', value: opportunityBreakdown.demandBase } : null,
                          opportunityBreakdown.depth > 0 ? { label: `Level ${currentLevel} depth`, value: opportunityBreakdown.depth } : null,
                          opportunityBreakdown.lowComp > 0 ? { label: 'Low comp signal', value: opportunityBreakdown.lowComp } : null,
                          opportunityBreakdown.position > 0 ? { label: 'Position power', value: opportunityBreakdown.position } : null,
                          opportunityBreakdown.relevancy > 0 ? { label: 'Relevancy', value: opportunityBreakdown.relevancy } : null,
                          opportunityBreakdown.longTerm > 0 ? { label: 'Long-term', value: opportunityBreakdown.longTerm } : null,
                        ].filter(Boolean) as { label: string; value: number }[];
                        
                        return (
                          <div className={`p-6 rounded-2xl border ${oppBgColor}`}>
                            <h4 className="text-base font-semibold text-white/50 uppercase tracking-wide mb-4">
                              Opportunity
                            </h4>
                            <div className="flex items-center justify-between mb-4">
                              <span className={`text-xl font-bold ${oppColor}`}>
                                {oppLabel}
                              </span>
                              <span className={`text-3xl font-bold ${oppColor}`}>
                                {opportunityScore}
                              </span>
                            </div>
                            {/* Show patterns detected - BIGGER PILLS */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {hasLowComp && (
                                <span className="px-3 py-1.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-sm font-medium">🎯 Low Comp</span>
                              )}
                              {hasLongTermViews && (
                                <span className="px-3 py-1.5 rounded-full bg-[#2BD899]/20 text-[#2BD899] text-sm font-medium">📈 Long-Term</span>
                              )}
                              {currentLevel >= 3 && (
                                <span className="px-3 py-1.5 rounded-full bg-[#6B9BD1]/20 text-[#6B9BD1] text-sm font-medium">🔍 Deep Topic</span>
                              )}
                              {opportunityBreakdown.position >= 12 && (
                                <span className="px-3 py-1.5 rounded-full bg-[#9B59B6]/20 text-[#9B59B6] text-sm font-medium">⭐ Top Position</span>
                              )}
                            </div>
                            {/* Breakdown - Two column layout */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-white/60 text-sm">
                              {breakdownItems.map((item, idx) => (
                                <p key={idx} className="flex justify-between">
                                  <span>{item.label}</span>
                                  <span className="text-white/80">+{item.value}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  {/* Parent-Informed Context Info (shown below cards when sparse data) */}
                  {isParentInformed && currentContext && (
                    <div className="mt-4 p-4 rounded-xl border border-[#6B9BD1]/30 bg-[#6B9BD1]/5">
                      <p className="text-white/60 text-sm">
                        Parent "<span className="text-white/80">{currentContext.parentPhrase}</span>": {currentContext.parentSuggestionCount} suggestions
                        {" • "}
                        Child: {suggestionCount} suggestions
                        {" • "}
                        Position #{currentContext.position} of {currentContext.siblingCount}
                      </p>
                    </div>
                  )}

                  {/* Sparse Data Warning (when no parent context available) */}
                  {showSparseDataMessage && (
                    <div className="mt-8 p-5 rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10">
                      <h4 className="text-base font-semibold text-[#F59E0B] uppercase tracking-wide mb-2">
                        Limited Data
                      </h4>
                      <p className="text-white/70 text-lg">
                        Only <span className="text-white font-medium">{suggestionCount}</span> suggestion{suggestionCount !== 1 ? 's' : ''} found.
                        Try a shorter phrase for better analysis.
                      </p>
                      <p className="text-white/60 text-base mt-2">
                        Phrases with 5+ suggestions give more reliable scoring.
                      </p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="my-8 border-t border-white/10" />

                  {/* Description - context-aware messaging */}
                  <p className="text-white/80 text-xl leading-relaxed">
                    {isParentInformed 
                      ? `This specific phrase has limited autocomplete data, but it appeared in "${currentContext?.parentPhrase}" which has strong demand. Position #${currentContext?.position} of ${currentContext?.siblingCount} siblings suggests this is a focused niche within a popular topic.`
                      : showSparseDataMessage
                        ? `This phrase returned only ${suggestionCount} suggestion${suggestionCount !== 1 ? 's' : ''}. Consider trying a shorter version for more reliable scoring data.`
                        : landscape.signalMessage
                    }
                  </p>
                </>
              )}

              {/* DISCOVERY MODE: Simple View (2-3 words) */}
              {!isOpportunityMode && (
                <>
                  {/* Signal Message */}
                  <p className="mt-5 text-white/90 text-xl">
                    {landscape.signalMessage}
                  </p>

                  {/* Match Stats - Exact and Topic */}
                  <div className="mt-4 space-y-1">
                    <p className="text-white/50 text-lg">
                      <span className="text-white/70 font-medium">{landscape.exactMatchCount} of {landscape.suggestionCount}</span> exact match
                      {" • "}
                      <span className="text-white/70 font-medium">{landscape.topicMatchCount} of {landscape.suggestionCount}</span> topic match
                    </p>
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="my-8 border-t border-white/10" />

              {/* Popular Topics - Clickable for drill-down - Now showing up to 14 in grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold text-white/80">Popular Topics</h3>
                  {currentLevel > 0 && (
                    <span className="text-sm text-white/40 bg-white/5 px-3 py-1 rounded-full">
                      Level {currentLevel + 1} • {currentContext?.fullPath?.length || 0} deep
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-base mb-5">Click a topic to explore its opportunity</p>
                <div className="grid grid-cols-2 gap-3">
                  {(landscape.topFourteen || landscape.topFive)
                    // Filter out phrases that match the current phrase (case-insensitive)
                    .filter((item) => item.phrase.toLowerCase().trim() !== currentPhrase.toLowerCase().trim())
                    .slice(0, 14)
                    .map((item, index) => (
                    <button
                      key={item.position}
                      onClick={() => handleDrillDown(item.phrase, item.position)}
                      className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left group"
                    >
                      <span className="text-white/40 text-base font-bold w-6 shrink-0">
                        {index + 1}.
                      </span>
                      <span className="flex-1 text-white text-base truncate group-hover:text-[#2BD899] transition-colors">
                        {capitalizePhrase(item.phrase)}
                      </span>
                      <span className="text-xl shrink-0" title={getVibeLabel(item.vibe)}>
                        {item.vibeIcon}
                      </span>
                      {/* Chevron to indicate clickable */}
                      <svg className="w-4 h-4 text-white/30 group-hover:text-[#2BD899] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              {/* Anchor Words - only show in discovery mode */}
              {!isOpportunityMode && landscape.anchorWords.length > 0 && (
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

              {/* Divider */}
              <div className="my-6 border-t border-white/10" />

              {/* Who's Watching - only in discovery mode */}
              {!isOpportunityMode && (
                <div>
                  <h3 className="text-2xl font-bold text-white/80 mb-4">Who's Watching</h3>
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

              {/* Opportunity Mode: Key Insight */}
              {isOpportunityMode && (
                <div>
                  <h3 className="text-2xl font-bold text-white/80 mb-3">Why This Works</h3>
                  <p className="text-white/70 text-xl leading-relaxed">
                    {isSuperTopic 
                      ? "This phrase has strong viewer demand with a low competition signal. High topic match with low exact match indicates an opportunity worth exploring."
                      : landscape.insight
                    }
                  </p>
                </div>
              )}

              {/* Discovery mode: Viewer Landscape Insight */}
              {!isOpportunityMode && (
                <>
                  <div className="my-6 border-t border-white/10" />
                  <div>
                    <h3 className="text-2xl font-bold text-white/80 mb-3">Viewer Landscape</h3>
                    <p className="text-white/80 text-lg leading-relaxed">
                      {landscape.insight}
                    </p>
                  </div>
                </>
              )}

              {/* YouTube Link */}
              <div className="mt-6">
                <a
                  href={landscape.youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#6B9BD1] hover:text-[#8BB5E0] text-lg transition-colors"
                >
                  <span>Check competition on YouTube</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-5 mt-8">
                <button
                  onClick={() => onCreateSession?.(currentPhrase)}
                  className="flex-1 px-8 py-5 bg-gradient-to-b from-[#4A7BB5] to-[#3A6195] text-white font-bold text-xl rounded-xl hover:from-[#5588C2] hover:to-[#4A7BB5] transition-all shadow-[0_4px_20px_rgba(74,123,181,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
                >
                  Create Session
                </button>
                <button
                  onClick={onPass || onClose}
                  className="flex-1 px-8 py-5 bg-white/5 text-white/80 font-bold text-xl rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10"
                >
                  Pass
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
