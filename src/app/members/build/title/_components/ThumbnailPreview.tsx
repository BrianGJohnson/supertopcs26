"use client";

import React from "react";

// =============================================================================
// EMOTION → COLOR MAPPING
// =============================================================================

export type EmotionType =
    | "Curiosity"
    | "Hope"
    | "Fear"
    | "Frustration"
    | "FOMO"
    | "Validation"
    | "Excitement"
    | "Relief";

export const EMOTION_GRADIENTS: Record<EmotionType, { from: string; to: string; accent: string }> = {
    Curiosity: { from: "#1e3a5f", to: "#0a1929", accent: "#60a5fa" },
    Hope: { from: "#1a4d2e", to: "#0d2818", accent: "#4ade80" },
    Fear: { from: "#5f1e1e", to: "#290a0a", accent: "#f87171" },
    Frustration: { from: "#5f3d1e", to: "#291a0a", accent: "#fb923c" },
    FOMO: { from: "#3d1e5f", to: "#1a0a29", accent: "#c084fc" },
    Validation: { from: "#5f4d1e", to: "#29210a", accent: "#fbbf24" },
    Excitement: { from: "#5f1e4d", to: "#290a21", accent: "#f472b6" },
    Relief: { from: "#1e5f5f", to: "#0a2929", accent: "#2dd4bf" },
};

// =============================================================================
// THUMBNAIL PREVIEW COMPONENT
// =============================================================================

interface ThumbnailPreviewProps {
    emotion: EmotionType;
    selectedPhrase: string | null;
    title: string;
    characterCount: number;
}

export function ThumbnailPreview({
    emotion,
    selectedPhrase,
    title,
    characterCount,
}: ThumbnailPreviewProps) {
    const colors = EMOTION_GRADIENTS[emotion] || EMOTION_GRADIENTS.Curiosity;

    return (
        <div className="space-y-4">
            {/* Mock Thumbnail */}
            <div
                className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl"
                style={{
                    background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                }}
            >
                {/* Phrase overlay */}
                {selectedPhrase && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="px-6 py-3 rounded-lg text-3xl md:text-4xl font-black tracking-tight"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.6)",
                                color: colors.accent,
                                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                            }}
                        >
                            {selectedPhrase}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!selectedPhrase && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-white/40 text-lg">Click a phrase to preview</p>
                    </div>
                )}
            </div>

            {/* Title below (like YouTube watch page) */}
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white leading-tight">{title}</h3>
                <div className="flex items-center gap-3 text-sm">
                    <span
                        className={`px-2 py-1 rounded font-medium ${characterCount <= 52
                                ? "bg-[#2BD899]/20 text-[#2BD899]"
                                : characterCount <= 60
                                    ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                                    : "bg-[#EF4444]/20 text-[#EF4444]"
                            }`}
                    >
                        {characterCount} chars
                    </span>
                    <span className="text-white/50">{emotion}</span>
                    <span className="text-white/50">•</span>
                    <span className="text-white/50">Recommended Mode</span>
                </div>
            </div>
        </div>
    );
}
