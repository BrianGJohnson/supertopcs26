"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalButton } from "@/components/ui/Modal";
import { IconCheck } from "@tabler/icons-react";

interface StarredPhrase {
  id: string;
  phrase: string;
}

interface JumpToTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  starredPhrases: StarredPhrase[];
  onGo: (selectedPhraseId: string) => void;
}

export function JumpToTitleModal({
  isOpen,
  onClose,
  starredPhrases,
  onGo,
}: JumpToTitleModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Reset selection when modal opens or phrases change
  useEffect(() => {
    if (isOpen && starredPhrases.length > 0) {
      setSelectedId(starredPhrases[0].id);
    }
  }, [isOpen, starredPhrases]);
  
  const handleGo = () => {
    if (selectedId) {
      onGo(selectedId);
    }
  };
  
  const isTooMany = starredPhrases.length > 10;
  
  // Too many phrases - show warning
  if (isTooMany) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Too Many Phrases Selected"
        footer={
          <ModalButton variant="secondary" onClick={onClose}>
            Go Back & Filter
          </ModalButton>
        }
      >
        <div className="space-y-4">
          <p className="text-white/60 text-[1.125rem] leading-relaxed">
            You have <span className="text-white font-semibold">{starredPhrases.length} phrases</span> starred.
          </p>
          <p className="text-white/60 text-[1.125rem] leading-relaxed">
            To use Jump → Title, please narrow down to <span className="text-white font-semibold">10 or fewer</span> starred phrases.
          </p>
        </div>
      </Modal>
    );
  }
  
  // Selection mode - pick one phrase
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Topic"
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleGo}
            disabled={!selectedId}
          >
            Go to Title
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Instruction text */}
        <p className="text-white/60 text-[1.125rem] leading-relaxed">
          Select the phrase you want to create titles for:
        </p>

        {/* Selection summary */}
        <div className="text-[1.125rem] text-white/60 pb-4 border-b border-white/10">
          {starredPhrases.length} starred phrases
        </div>

        {/* Phrase list with radio selection */}
        <div className="space-y-2">
          {starredPhrases.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all
                  ${isSelected
                    ? "bg-white/[0.06] border border-white/20 text-white"
                    : "bg-black/30 border border-white/5 text-white/60 hover:bg-white/[0.04]"
                  }
                `}
              >
                {/* Radio indicator */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected
                      ? "bg-[#2BD899]/20 border-2 border-[#2BD899]/60"
                      : "bg-white/10 border-2 border-white/30"
                    }
                  `}
                >
                  {isSelected && <IconCheck size={14} className="text-[#2BD899]" stroke={3} />}
                </div>

                {/* Phrase text */}
                <span className="text-[1.125rem] leading-snug">{item.phrase}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
