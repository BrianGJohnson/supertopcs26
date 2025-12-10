"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconX, IconLock } from "@tabler/icons-react";

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

interface LockVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    phrase: string;
    // AI-analyzed data from super_topics
    primaryBucket?: string;      // Info, Opinion, Review, etc.
    recommendedFormat?: string;  // AI's recommended sub-format
    alternateFormats?: string[]; // 2 alternate formats from AI
    onConfirm: (selectedFormats: string[]) => void;
}

export function LockVideoModal({
    isOpen,
    onClose,
    phrase,
    primaryBucket = "Info",
    recommendedFormat,
    alternateFormats = [],
    onConfirm,
}: LockVideoModalProps) {
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    // Get formats for the identified bucket
    const bucketData = BUCKET_FORMATS[primaryBucket] || BUCKET_FORMATS["Info"];
    const availableFormats = bucketData.formats;

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

    // Pre-select AI recommendations when modal opens
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
        setSelectedFormats((prev) =>
            prev.includes(format)
                ? prev.filter((f) => f !== format)
                : [...prev, format]
        );
    };

    const selectAll = () => {
        setSelectedFormats([...availableFormats]);
    };

    const handleConfirm = () => {
        onConfirm(selectedFormats);
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
                onClick={onClose}
            />

            {/* Centering container */}
            <div className="relative z-[10001] flex min-h-full items-center justify-center p-4">
                {/* Modal Card - Narrower, cleaner */}
                <div className="relative w-full max-w-2xl bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col my-8">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors z-10"
                    >
                        <IconX size={24} />
                    </button>

                    {/* Content */}
                    <div className="px-10 py-10">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#2BD899]/20 to-[#2BD899]/5 border border-[#2BD899]/30">
                                <IconLock size={28} className="text-[#2BD899]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Lock This Video</h2>
                                <p className="text-white/50 text-base mt-1">Let's create some killer titles</p>
                            </div>
                        </div>

                        {/* Phrase display */}
                        <div className="px-6 py-5 bg-gradient-to-br from-[#FFD700]/10 to-[#FFD700]/5 rounded-xl border border-[#FFD700]/30 mb-8">
                            <p className="text-xl font-semibold text-white">{phrase}</p>
                        </div>

                        {/* Format Selection */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">
                                What kind of format are you open to?
                            </h3>
                            <p className="text-white/50 text-base mb-5">
                                The more you select, the better we can guide your title. Select any that sound good!
                            </p>

                            {/* Format pills - Select All first, then formats */}
                            <div className="flex flex-wrap gap-3">
                                {/* Select All Button - First position */}
                                <button
                                    onClick={selectAll}
                                    className={`px-5 py-3 rounded-xl text-base font-semibold transition-all ${selectedFormats.length === availableFormats.length
                                            ? "bg-[#2BD899] text-[#0B1220] border-2 border-[#2BD899] shadow-lg shadow-[#2BD899]/20"
                                            : "bg-[#2BD899]/15 text-[#2BD899] border-2 border-[#2BD899]/40 hover:bg-[#2BD899]/25 hover:border-[#2BD899]/60"
                                        }`}
                                >
                                    Select All
                                </button>

                                {availableFormats.map((format) => {
                                    const isSelected = selectedFormats.includes(format);
                                    const isRecommended = format === recommendedFormat;
                                    return (
                                        <button
                                            key={format}
                                            onClick={() => toggleFormat(format)}
                                            className={`px-5 py-3 rounded-xl text-base font-semibold transition-all ${isSelected
                                                ? "bg-[#6B9BD1] text-[#0B1220] border-2 border-[#6B9BD1] shadow-lg shadow-[#6B9BD1]/20"
                                                : "bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
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

                            {/* Bucket hint */}
                            <p className="text-white/30 text-sm mt-4">
                                {bucketData.description}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={handleConfirm}
                                disabled={selectedFormats.length === 0}
                                className={`flex-1 px-8 py-5 font-bold text-xl rounded-xl transition-all flex items-center justify-center gap-3 ${selectedFormats.length === 0
                                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                                    : "bg-gradient-to-b from-[#2BD899] to-[#1FA87A] text-white hover:from-[#33E5A8] hover:to-[#2BD899] shadow-[0_4px_20px_rgba(43,216,153,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
                                    }`}
                            >
                                <IconLock size={22} className="text-[#0D1117]" />
                                <span className="text-[#0D1117]">Lock & Generate Titles</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="px-8 py-5 bg-white/5 text-white/60 font-semibold text-lg rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Helper text */}
                        {selectedFormats.length > 0 && (
                            <p className="text-center text-white/40 text-sm mt-5">
                                {selectedFormats.length} format{selectedFormats.length > 1 ? "s" : ""} selected
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
