"use client";

import React, { useEffect, useState } from "react";
import { 
  type ViewerLandscape,
  getDemandColorClass,
  getDemandBgClass,
  getVibeIcon,
  getVibeLabel,
  getVibeBgClass,
  type VibeCategory,
} from "@/lib/viewer-landscape";
import type { SeedSignal } from "@/lib/seed-signal";

interface ApiResponse {
  landscape: ViewerLandscape;
  // Legacy fields
  signalStrength?: string;
  suggestionCount?: number;
}

interface SeedSignalIndicatorProps {
  seed: string;
  /** Minimum characters before validation triggers */
  minChars?: number;
  /** Debounce delay in ms (default 800ms for voice input tolerance) */
  debounceMs?: number;
  /** Optional callback when signal is calculated */
  onSignalChange?: (signal: SeedSignal | null) => void;
  /** Compact mode for inline display */
  compact?: boolean;
}

/**
 * SeedSignalIndicator
 * 
 * Displays real-time validation feedback for a seed phrase based on
 * YouTube autocomplete response volume and viewer landscape analysis.
 * 
 * Usage:
 * <SeedSignalIndicator seed={seedInput} />
 */
export function SeedSignalIndicator({
  seed,
  minChars = 3,
  debounceMs = 800,
  onSignalChange,
  compact = false,
}: SeedSignalIndicatorProps) {
  const [landscape, setLandscape] = useState<ViewerLandscape | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset if seed is too short
    if (!seed || seed.trim().length < minChars) {
      setLandscape(null);
      setError(null);
      onSignalChange?.(null);
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/seed-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seed: seed.trim() }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to validate seed");
        }

        const data: ApiResponse = await response.json();
        setLandscape(data.landscape);
        
        // Create legacy signal object for callback compatibility
        if (onSignalChange && data.landscape) {
          const legacySignal: SeedSignal = {
            seed: data.landscape.seed,
            signalStrength: data.landscape.demandLevel as 'strong' | 'moderate' | 'weak' | 'very-weak',
            message: data.landscape.demandLabel,
            explanation: data.landscape.insight,
            suggestionCount: data.landscape.suggestionCount,
            topicMatchCount: data.landscape.exactMatchCount,
            exactMatchCount: data.landscape.exactMatchCount,
            brandMatchCount: data.landscape.vibeDistribution.brand > 0 ? Math.round(data.landscape.suggestionCount * data.landscape.vibeDistribution.brand / 100) : 0,
            suggestions: data.landscape.suggestions,
          };
          onSignalChange(legacySignal);
        }
      } catch (err) {
        console.error("[SeedSignalIndicator] Error:", err);
        setError(err instanceof Error ? err.message : "Validation failed");
        setLandscape(null);
        onSignalChange?.(null);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [seed, minChars, debounceMs, onSignalChange]);

  // Don't render anything if no input yet
  if (!seed || seed.trim().length < minChars) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : 'p-5 rounded-xl bg-white/5 border border-white/10'}`}>
        <svg className="w-5 h-5 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-white/40 text-lg">Analyzing viewer demand...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return compact ? null : (
      <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-lg">
        {error}
      </div>
    );
  }

  // No landscape yet
  if (!landscape) {
    return null;
  }

  // Get top vibes for display
  const getDisplayVibes = (): { vibe: VibeCategory; percent: number }[] => {
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
      .slice(0, 2); // Show top 2 in compact inline view
  };

  // Compact mode - just show the badge
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-base font-medium border ${getDemandBgClass(landscape.demandLevel)}`}>
        <span className="text-lg">{landscape.demandIcon}</span>
        <span className={getDemandColorClass(landscape.demandLevel)}>
          {landscape.suggestionCount} suggestions
        </span>
      </div>
    );
  }

  // Full display mode - new viewer landscape style
  return (
    <div className={`p-5 rounded-xl border ${getDemandBgClass(landscape.demandLevel)}`}>
      {/* Header with demand badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{landscape.demandIcon}</span>
        <span className={`font-bold text-xl ${getDemandColorClass(landscape.demandLevel)}`}>
          {landscape.demandLabel}
        </span>
      </div>
      
      {/* Insight message */}
      <p className="text-white/70 text-lg leading-relaxed mb-4">
        {landscape.insight}
      </p>
      
      {/* Stats row */}
      <div className="flex items-center gap-6 text-base text-white/50">
        <span>
          <strong className="text-white/70">{landscape.suggestionCount}</strong> topic matches
        </span>
        {getDisplayVibes().length > 0 && (
          <div className="flex items-center gap-3">
            {getDisplayVibes().map(({ vibe, percent }) => (
              <span key={vibe} className="flex items-center gap-1.5">
                <span className="text-lg">{getVibeIcon(vibe)}</span>
                <span>{percent}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Show top suggestions for low demand */}
      {(landscape.demandLevel === 'low' || landscape.demandLevel === 'very-low') && 
       landscape.suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-white/40 mb-3">Consider one of these related topics:</p>
          <div className="flex flex-wrap gap-2">
            {landscape.suggestions.slice(0, 5).map((suggestion, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-white/5 rounded-lg text-base text-white/60"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
