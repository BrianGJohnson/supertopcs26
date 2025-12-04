"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
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

/**
 * ViewerLandscapeModal
 * 
 * Displays comprehensive viewer landscape analysis for a seed phrase:
 * - Demand level with color-coded badge
 * - Top 3 searches with vibe icons
 * - Viewer vibe distribution (weighted progress bars)
 * - Insight message
 * - Create Session / Pass action buttons
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

  // Fetch data when modal opens
  useEffect(() => {
    if (!isOpen || !seed) return;

    const fetchLandscape = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/seed-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seed: seed.trim() }),
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
  }, [isOpen, seed]);

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
      .slice(0, 4); // Show top 4 max
  };

  // Don't render on server or if not open
  if (!mounted || !isOpen) return null;

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
        <div className="relative w-full max-w-3xl bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col my-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <IconX size={24} />
          </button>

          {/* Content */}
          <div className="px-10 py-10">
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
              <p className="mt-5 text-white/50 text-xl">Analyzing viewer landscape...</p>
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
              {/* Traffic Light Signal Badge with Topic */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-full border ${getSignalBgClass(landscape.signal)}`}>
                  <span className="text-3xl">{landscape.signalIcon}</span>
                  <span className={`font-bold text-2xl ${getSignalColorClass(landscape.signal)}`}>
                    {landscape.signalLabel}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-white/90 truncate max-w-md">
                  {seed}
                </h2>
              </div>

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

              {/* Divider */}
              <div className="my-6 border-t border-white/10" />

              {/* Popular Topics */}
              <div>
                <h3 className="text-2xl font-bold text-white/80 mb-4">Popular Topics</h3>
                <div className="space-y-2">
                  {landscape.topFive.map((item) => (
                    <div
                      key={item.position}
                      className="flex items-center gap-4 px-5 py-4 bg-white/5 rounded-xl"
                    >
                      <span className="text-white/40 text-lg font-bold w-7">
                        {item.position}.
                      </span>
                      <span className="flex-1 text-white/90 text-lg truncate">
                        {item.phrase}
                      </span>
                      <span className="text-2xl" title={getVibeLabel(item.vibe)}>
                        {item.vibeIcon}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anchor Words - only show if we have some */}
              {landscape.anchorWords.length > 0 && (
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
              <div className="my-5 border-t border-white/10" />

              {/* Who's Watching - simplified, no percentages */}
              <div>
                <h3 className="text-xl font-bold text-white/80 mb-4">Who's Watching</h3>
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

              {/* Divider */}
              <div className="my-5 border-t border-white/10" />

              {/* Viewer Landscape Insight */}
              <div>
                <h3 className="text-xl font-bold text-white/80 mb-3">Viewer Landscape</h3>
                <p className="text-white/80 text-lg leading-relaxed">
                  {landscape.insight}
                </p>
              </div>

              {/* YouTube Link */}
              <div className="mt-5">
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
                  onClick={() => onCreateSession?.(seed)}
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
