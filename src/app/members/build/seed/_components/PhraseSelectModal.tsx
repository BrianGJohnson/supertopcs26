"use client";

import React, { useState } from "react";
import { Modal, ModalButton } from "@/components/ui/Modal";
import { IconCheck } from "@tabler/icons-react";

interface PhraseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  phrases: string[];
  onSave: (selectedPhrases: string[]) => void;
  isLoading?: boolean;
}

export function PhraseSelectModal({
  isOpen,
  onClose,
  title,
  phrases,
  onSave,
  isLoading = false,
}: PhraseSelectModalProps) {
  // All phrases selected by default
  const [selected, setSelected] = useState<Set<string>>(new Set(phrases));

  // Reset selection when phrases change
  React.useEffect(() => {
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
