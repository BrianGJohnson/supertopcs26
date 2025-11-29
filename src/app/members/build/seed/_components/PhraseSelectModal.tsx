"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalButton } from "@/components/ui/Modal";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";

// Expansion progress state
export interface ExpansionProgress {
  phase: "child" | "az" | "prefix";
  current: number;
  total: number;
}

interface PhraseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  phrases: string[];
  onSave: (selectedPhrases: string[]) => void;
  isLoading?: boolean;
  // New props for expansion mode
  mode?: "selection" | "expanding";
  expansionProgress?: ExpansionProgress | null;
  seedPhrase?: string;
  onContinueBrowsing?: () => void;
}

// Phase display names and colors
const PHASE_CONFIG = {
  child: { label: "Child Phrases", color: "#D4E882" },
  az: { label: "A–Z Expansion", color: "#4DD68A" },
  prefix: { label: "Prefix Queries", color: "#39C7D8" },
};

export function PhraseSelectModal({
  isOpen,
  onClose,
  title,
  phrases,
  onSave,
  isLoading = false,
  mode = "selection",
  expansionProgress = null,
  seedPhrase = "",
  onContinueBrowsing,
}: PhraseSelectModalProps) {
  // All phrases selected by default
  const [selected, setSelected] = useState<Set<string>>(new Set(phrases));

  // Reset selection when phrases change
  useEffect(() => {
    setSelected(new Set(phrases));
  }, [phrases]);

  const togglePhrase = (phrase: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(phrase)) {
      newSelected.delete(phrase);
    } else {
      newSelected.add(phrase);
    }
    setSelected(newSelected);
  };

  const handleSave = () => {
    onSave(Array.from(selected));
  };

  const selectedCount = selected.size;
  const totalCount = phrases.length;

  // Render expansion mode
  if (mode === "expanding") {
    const currentPhase = expansionProgress?.phase || "child";

    return (
      <Modal
        isOpen={isOpen}
        onClose={onContinueBrowsing || onClose}
        title="Expanding Your Topic"
        footer={
          <ModalButton variant="secondary" onClick={onContinueBrowsing || onClose}>
            Close & Continue Browsing
          </ModalButton>
        }
      >
        <div className="space-y-6">
          {/* Success message - Brand blue */}
          <div className="flex items-center gap-3 p-4 bg-[#6B9BD1]/10 border border-[#6B9BD1]/30 rounded-xl">
            <IconCheck size={24} className="text-[#6B9BD1] flex-shrink-0" />
            <p className="text-white text-[1.125rem]">
              Top 10 saved! Running deep expansion now.
            </p>
          </div>

          {/* Simple phase checklist - no progress bar, no repetition */}
          <div className="space-y-3">
            {(["child", "az", "prefix"] as const).map((phase) => {
              const phaseConfig = PHASE_CONFIG[phase];
              const isActive = currentPhase === phase;
              const isComplete = 
                (phase === "child" && (currentPhase === "az" || currentPhase === "prefix")) ||
                (phase === "az" && currentPhase === "prefix");
              const isPending = !isActive && !isComplete;

              return (
                <div 
                  key={phase}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? "bg-white/[0.06] border border-white/20" 
                      : "bg-black/20 border border-white/5"
                  }`}
                >
                  {isComplete ? (
                    <IconCheck size={20} className="text-[#6B9BD1]" />
                  ) : isActive ? (
                    <IconLoader2 size={20} className="animate-spin" style={{ color: phaseConfig.color }} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                  )}
                  <span className={`text-[1.125rem] ${isPending ? "text-white/40" : "text-white"}`}>
                    {phaseConfig.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Info message */}
          <p className="text-white/60 text-[1.125rem] text-center leading-relaxed">
            This takes about 2 minutes. Feel free to explore — we'll notify you when it's ready!
          </p>
        </div>
      </Modal>
    );
  }

  // Render selection mode (original behavior)
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSave}
          >
            {isLoading ? "Saving..." : `Save ${selectedCount} Phrases`}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Instruction text */}
        <p className="text-white/60 text-[1.125rem] leading-relaxed">
          Click any phrase to deselect it, then save.
        </p>

        {/* Selection summary */}
        <div className="flex items-center justify-between text-[1.125rem] text-white/60 pb-4 border-b border-white/10">
          <span>{selectedCount} of {totalCount} selected</span>
          <button
            onClick={() => setSelected(selected.size === phrases.length ? new Set() : new Set(phrases))}
            className="text-[#2BD899] hover:text-[#2BD899]/80 transition-colors font-semibold"
          >
            {selected.size === phrases.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* Phrase list - no scroll, show all */}
        <div className="space-y-2">
          {phrases.map((phrase, index) => {
            const isSelected = selected.has(phrase);
            return (
              <button
                key={index}
                onClick={() => togglePhrase(phrase)}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all
                  ${isSelected
                    ? "bg-white/[0.06] border border-white/20 text-white"
                    : "bg-black/30 border border-white/5 text-white/35 line-through"
                  }
                  hover:bg-white/10
                `}
              >
                {/* Checkbox indicator */}
                <div
                  className={`
                    w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected
                      ? "bg-[#2BD899]/20 border-2 border-[#2BD899]/60"
                      : "bg-white/10 border-2 border-white/30"
                    }
                  `}
                >
                  {isSelected && <IconCheck size={16} className="text-[#2BD899]" stroke={3} />}
                </div>

                {/* Phrase text */}
                <span className="text-[1.125rem] leading-snug">{phrase}</span>
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {phrases.length === 0 && (
          <div className="text-center py-8 text-white/40 text-[1.125rem]">
            No phrases found. Try a different search.
          </div>
        )}
      </div>
    </Modal>
  );
}
