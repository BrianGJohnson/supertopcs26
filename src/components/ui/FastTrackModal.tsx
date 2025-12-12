"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconX, IconRocket, IconLoader2 } from "@tabler/icons-react";

// Video format taxonomy - maps bucket to sub-formats
const BUCKET_FORMATS: Record<string, { description: string; formats: string[] }> = {
    "Info": {
        description: "Teaching something specific",
        formats: ["Tutorial", "How-To", "Explainer", "Walkthrough", "Crash Course", "Masterclass"],
    },
    "Opinion": {
        description: "Your perspective on something",
        formats: ["Commentary", "Hot Take", "Rant", "Reaction", "My Take", "Unpopular Opinion"],
    },
    "Review": {
        description: "Evaluating something",
        formats: ["Product Review", "First Impressions", "Comparison", "Honest Review", "Long-Term Review", "Buyer's Guide"],
    },
    "Entertainment": {
        description: "Engaging, fun, or lifestyle",
        formats: ["Vlog", "Lifestyle", "Challenge", "Behind-the-Scenes", "Story", "Day in the Life", "Q&A"],
    },
    "Analysis": {
        description: "Going deep on a topic",
        formats: ["Deep Dive", "Breakdown", "Case Study", "Postmortem", "Research Report", "Why X Happened"],
    },
    "News": {
        description: "What's happening now",
        formats: ["Update", "Announcement", "Trending Coverage", "Recap", "Breaking", "Weekly Roundup"],
    },
    "List": {
        description: "Curated collections",
        formats: ["Top 10", "Ranking", "Roundup", "Best Of", "Tier List", "X Things You Need"],
    },
};

interface FastTrackModalProps {
    isOpen: boolean;
    onClose: () => void;
    phrase: string;
    demandScore: number;
    opportunityScore: number;
    // Pre-analyzed data from GPT
    primaryBucket: string;
    recommendedFormat: string;
    alternateFormats: string[];
    onConfirm: (selectedFormats: string[]) => void;
    isSaving?: boolean;
}

export function FastTrackModal({
    isOpen,
    onClose,
    phrase,
    demandScore,
    opportunityScore,
    primaryBucket,
    recommendedFormat,
    alternateFormats,
    onConfirm,
    isSaving = false,
}: FastTrackModalProps) {
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    // Get formats for the identified bucket ONLY
    const bucketData = BUCKET_FORMATS[primaryBucket] || BUCKET_FORMATS["Info"];
    const availableFormats = bucketData.formats;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSaving) onClose();
        },
        [onClose, isSaving]
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

    // Pre-select recommended formats when modal opens
    useEffect(() => {
        if (isOpen) {
            const preSelected: string[] = [];
            // Pre-select recommended format
            if (recommendedFormat && availableFormats.includes(recommendedFormat)) {
                preSelected.push(recommendedFormat);
            }
            // Pre-select alternate formats
            alternateFormats.forEach(format => {
                if (availableFormats.includes(format) && !preSelected.includes(format)) {
                    preSelected.push(format);
                }
            });
            // If no pre-selections, default to first format
            if (preSelected.length === 0 && availableFormats.length > 0) {
                preSelected.push(availableFormats[0]);
            }
            setSelectedFormats(preSelected);
        }
    }, [isOpen, recommendedFormat, alternateFormats, availableFormats]);

    const toggleFormat = (format: string) => {
        if (isSaving) return;
        setSelectedFormats((prev) =>
            prev.includes(format)
                ? prev.filter((f) => f !== format)
                : [...prev, format]
        );
    };

    const selectAll = () => {
        if (isSaving) return;
        setSelectedFormats([...availableFormats]);
    };

    const handleConfirm = () => {
        onConfirm(selectedFormats);
    };

    if (!mounted || !isOpen) return null;

    // Get score color
    const getScoreColor = (score: number) => {
        if (score >= 70) return "#2BD899";
        if (score >= 50) return "#6B9BD1";
        if (score >= 35) return "#F59E0B";
        return "#EF4444";
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
                onClick={isSaving ? undefined : onClose}
            />

            {/* Centering container */}
            <div className="relative z-[10001] flex min-h-full items-center justify-center p-4">
                {/* Modal Card */}
                <div className="relative w-full max-w-xl bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col my-8">
                    {/* Close button */}
                    {!isSaving && (
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors z-10"
                        >
                            <IconX size={24} />
                        </button>
                    )}

                    {/* Content */}
                    <div className="px-10 py-10">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#5AACFF]/20 to-[#5AACFF]/5 border border-[#5AACFF]/30">
                                <IconRocket size={28} className="text-[#5AACFF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Fast-Track to Titles</h2>
                                <p className="text-white/50 text-lg mt-1">One more step before we generate titles.</p>
                            </div>
                        </div>

                        {/* Phrase display with scores */}
                        <div className="px-6 py-5 bg-gradient-to-br from-[#5AACFF]/10 to-[#5AACFF]/5 rounded-xl border border-[#5AACFF]/30 mb-6">
                            <p className="text-xl font-semibold text-white mb-3">{phrase}</p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-white/50 text-sm">Demand:</span>
                                    <span className="font-bold text-lg" style={{ color: getScoreColor(demandScore) }}>
                                        {demandScore}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white/50 text-sm">Opportunity:</span>
                                    <span className="font-bold text-lg" style={{ color: getScoreColor(opportunityScore) }}>
                                        {opportunityScore}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Format Selection - ONLY bucket formats */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                This looks like a <span className="text-white font-bold">{primaryBucket}</span> video
                            </h3>
                            <p className="text-white/50 text-lg mb-5">
                                {bucketData.description}. Select the formats you&apos;d consider:
                            </p>

                            {/* Format pills - All button first, GREEN style for prominence */}
                            <div className="flex flex-wrap gap-3">
                                {/* All Button - BRIGHT GREEN style */}
                                <button
                                    onClick={selectAll}
                                    disabled={isSaving}
                                    className={`px-5 py-3 rounded-xl text-base font-semibold transition-all border-2 ${selectedFormats.length === availableFormats.length
                                        ? "bg-[#2BD899]/30 text-[#2BD899] border-[#2BD899]/60 shadow-[0_0_15px_rgba(43,216,153,0.25)]"
                                        : "bg-[#2BD899]/15 text-[#2BD899] border-[#2BD899]/40 hover:bg-[#2BD899]/25 hover:border-[#2BD899]/60"
                                        }`}
                                >
                                    All
                                </button>

                                {/* Format pills - BLUE style */}
                                {availableFormats.map((format) => {
                                    const isSelected = selectedFormats.includes(format);
                                    const isRecommended = format === recommendedFormat;
                                    return (
                                        <button
                                            key={format}
                                            disabled={isSaving}
                                            onClick={() => toggleFormat(format)}
                                            className={`px-5 py-3 rounded-xl text-base font-semibold transition-all border-2 ${isSelected
                                                ? "bg-[#5AACFF]/30 text-[#A0DCFF] border-[#5AACFF]/60 shadow-[0_0_12px_rgba(90,172,255,0.2)]"
                                                : "bg-[#5AACFF]/15 text-[#A0DCFF] border-[#5AACFF]/40 hover:bg-[#5AACFF]/25 hover:border-[#5AACFF]/60"
                                                }`}
                                        >
                                            {format}
                                            {isRecommended && (
                                                <span className="ml-2 text-xs opacity-70">★</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-10">
                            {/* Generate Titles - GREEN CTA, requires at least 2 formats */}
                            <button
                                onClick={handleConfirm}
                                disabled={selectedFormats.length < 2 || isSaving}
                                className={`flex-1 px-8 py-5 font-bold text-xl rounded-xl transition-all flex items-center justify-center gap-3 border-2 ${selectedFormats.length < 2 || isSaving
                                    ? "bg-[#2BD899]/10 border-[#2BD899]/20 text-[#4AE8B0]/50 cursor-not-allowed"
                                    : "bg-gradient-to-b from-[#2BD899]/20 to-[#25C78A]/20 hover:from-[#2BD899]/30 hover:to-[#25C78A]/30 text-[#2BD899] border-[#2BD899]/50 shadow-[0_0_15px_rgba(43,216,153,0.15)] hover:shadow-[0_0_20px_rgba(43,216,153,0.25)]"
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <IconLoader2 size={22} className="animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <IconRocket size={22} />
                                        <span>Generate Titles</span>
                                    </>
                                )}
                            </button>
                            {!isSaving && (
                                <button
                                    onClick={onClose}
                                    className="px-8 py-5 bg-white/5 text-white/60 font-semibold text-lg rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        {/* Helper text */}
                        {selectedFormats.length > 0 && (
                            <p className={`text-center text-sm mt-5 ${selectedFormats.length < 2
                                ? "text-[#F59E0B]"
                                : "text-white/40"
                                }`}>
                                {selectedFormats.length < 2
                                    ? `Select at least 2 formats (${selectedFormats.length}/2)`
                                    : `${selectedFormats.length} format${selectedFormats.length > 1 ? "s" : ""} selected`
                                }
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
