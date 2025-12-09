"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconX, IconLock } from "@tabler/icons-react";

interface LockVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    phrase: string;
    onConfirm: (selectedFormats: string[], notes: string) => void;
}

// Video format taxonomy from 1-7-video-format-taxonomy.md
const VIDEO_FORMAT_GROUPS = [
    {
        bucket: "Info",
        description: "Teaching something specific",
        formats: ["Tutorial", "How-To", "Explainer", "Walkthrough", "Crash Course", "Masterclass"],
    },
    {
        bucket: "Opinion",
        description: "Your perspective on something",
        formats: ["Commentary", "Hot Take", "Rant", "Reaction", "My Take", "Unpopular Opinion"],
    },
    {
        bucket: "Review",
        description: "Evaluating something",
        formats: ["Product Review", "First Impressions", "Comparison", "Honest Review", "Long-Term Review", "Buyer's Guide"],
    },
    {
        bucket: "Entertainment",
        description: "Engaging, fun, or lifestyle",
        formats: ["Vlog", "Lifestyle", "Challenge", "Behind-the-Scenes", "Story", "Day in the Life", "Q&A"],
    },
    {
        bucket: "Analysis",
        description: "Going deep on a topic",
        formats: ["Deep Dive", "Breakdown", "Case Study", "Postmortem", "Research Report", "Why X Happened"],
    },
    {
        bucket: "News",
        description: "What's happening now",
        formats: ["Update", "Announcement", "Trending Coverage", "Recap", "Breaking", "Weekly Roundup"],
    },
    {
        bucket: "List",
        description: "Curated collections",
        formats: ["Top 10", "Ranking", "Roundup", "Best Of", "Tier List", "X Things You Need"],
    },
];

export function LockVideoModal({
    isOpen,
    onClose,
    phrase,
    onConfirm,
}: LockVideoModalProps) {
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [mounted, setMounted] = useState(false);

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

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFormats([]);
            setNotes("");
        }
    }, [isOpen]);

    const toggleFormat = (format: string) => {
        setSelectedFormats((prev) =>
            prev.includes(format)
                ? prev.filter((f) => f !== format)
                : [...prev, format]
        );
    };

    const handleConfirm = () => {
        onConfirm(selectedFormats, notes);
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
                {/* Modal Card */}
                <div className="relative w-full max-w-4xl bg-[#1A1E24] border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col my-8">
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
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#2BD899]/20 to-[#2BD899]/5 border border-[#2BD899]/30">
                                <IconLock size={28} className="text-[#2BD899]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Lock This Video Topic</h2>
                                <p className="text-white/50 text-lg mt-1">You're choosing to move forward with:</p>
                            </div>
                        </div>

                        {/* Phrase display */}
                        <div className="mt-4 px-6 py-4 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-xl font-semibold text-white">{phrase}</p>
                        </div>

                        {/* Divider */}
                        <div className="my-6 border-t border-white/10" />

                        {/* Format Selection */}
                        <div>
                            <h3 className="text-lg font-semibold text-white/80 mb-2">
                                What kind of video are you thinking?
                            </h3>
                            <p className="text-white/50 text-sm mb-5">
                                Select formats you're open to making. This helps us generate better titles.
                            </p>

                            <div className="space-y-5 max-h-[340px] overflow-y-auto pr-2">
                                {VIDEO_FORMAT_GROUPS.map((group) => (
                                    <div key={group.bucket}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-bold text-white/60 uppercase tracking-wide">
                                                {group.bucket}
                                            </span>
                                            <span className="text-xs text-white/30">
                                                — {group.description}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {group.formats.map((format) => {
                                                const isSelected = selectedFormats.includes(format);
                                                return (
                                                    <button
                                                        key={format}
                                                        onClick={() => toggleFormat(format)}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelected
                                                                ? "bg-[#6B9BD1] text-white border border-[#6B9BD1]"
                                                                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
                                                            }`}
                                                    >
                                                        {format}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="my-6 border-t border-white/10" />

                        {/* Additional Notes */}
                        <div>
                            <h3 className="text-lg font-semibold text-white/80 mb-2">
                                Anything else we should know?
                            </h3>
                            <p className="text-white/50 text-sm mb-3">
                                Optional: Add context about your video idea, angle, or style.
                            </p>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g., I want to focus on beginners, keep it under 10 minutes, or make it a series..."
                                className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#6B9BD1]/50 transition-colors"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-5 mt-8">
                            <button
                                onClick={handleConfirm}
                                disabled={selectedFormats.length === 0}
                                className={`flex-1 px-8 py-5 font-bold text-xl rounded-xl transition-all ${selectedFormats.length === 0
                                        ? "bg-white/10 text-white/30 cursor-not-allowed"
                                        : "bg-gradient-to-b from-[#2BD899] to-[#1FA87A] text-white hover:from-[#33E5A8] hover:to-[#2BD899] shadow-[0_4px_20px_rgba(43,216,153,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
                                    }`}
                            >
                                Lock & Continue →
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 px-8 py-5 bg-white/5 text-white/80 font-bold text-xl rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Helper text */}
                        {selectedFormats.length > 0 && (
                            <p className="text-center text-white/40 text-sm mt-4">
                                Selected: {selectedFormats.join(", ")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
