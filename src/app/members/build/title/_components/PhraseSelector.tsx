"use client";

import React from "react";
import { IconCheck } from "@tabler/icons-react";

// =============================================================================
// PHRASE SELECTOR COMPONENT
// =============================================================================

interface PhraseSelectorProps {
    compelling: string[];
    wildCards: string[];
    selectedPhrases: string[];
    onPhraseClick: (phrase: string) => void;
    isLoading?: boolean;
}

export function PhraseSelector({
    compelling,
    wildCards,
    selectedPhrases,
    onPhraseClick,
    isLoading = false,
}: PhraseSelectorProps) {
    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 w-32 bg-white/10 rounded" />
                <div className="flex gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 w-24 bg-white/10 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    const renderPhraseButton = (phrase: string) => {
        const isSelected = selectedPhrases.includes(phrase);

        return (
            <button
                key={phrase}
                onClick={() => onPhraseClick(phrase)}
                className={`relative px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${isSelected
                        ? "bg-[#2BD899]/20 border-2 border-[#2BD899] text-[#2BD899]"
                        : "bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                    }`}
            >
                {phrase}
                {isSelected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2BD899] rounded-full flex items-center justify-center">
                        <IconCheck className="w-3 h-3 text-black" />
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="space-y-6">
            {/* Compelling phrases */}
            <div className="space-y-3">
                <h4 className="text-base font-semibold text-white/70 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#2BD899] rounded-full" />
                    Compelling
                </h4>
                <div className="flex flex-wrap gap-3">
                    {compelling.map(renderPhraseButton)}
                </div>
            </div>

            {/* Wild Cards */}
            <div className="space-y-3">
                <h4 className="text-base font-semibold text-white/70 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#F59E0B] rounded-full" />
                    Wild Cards
                </h4>
                <div className="flex flex-wrap gap-3">
                    {wildCards.map(renderPhraseButton)}
                </div>
            </div>

            {/* Selection count */}
            {selectedPhrases.length > 0 && (
                <p className="text-sm text-white/50">
                    Selected: {selectedPhrases.join(" + ")}
                </p>
            )}
        </div>
    );
}
