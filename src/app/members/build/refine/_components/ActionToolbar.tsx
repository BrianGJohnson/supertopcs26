"use client";

import React from "react";
import { IconPlayerPlay, IconWand, IconTrash, IconArrowRight } from "@tabler/icons-react";

interface ActionToolbarProps {
  selectedCount: number;
  onRunAnalysis: () => void;
  onAutoPick: () => void;
  onDeleteSelected: () => void;
  onContinue: () => void;
  canContinue: boolean;
}

export function ActionToolbar({
  selectedCount,
  onRunAnalysis,
  onAutoPick,
  onDeleteSelected,
  onContinue,
  canContinue,
}: ActionToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface/40 backdrop-blur-md border border-white/10 rounded-xl">
      {/* Left side: Analysis actions */}
      <div className="flex items-center gap-3">
        {/* Run Analysis - placeholder */}
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary hover:bg-primary/30 transition-colors"
          onClick={onRunAnalysis}
          disabled
        >
          <IconPlayerPlay className="w-4 h-4" />
          <span className="text-sm font-medium">Run Analysis</span>
          <span className="text-xs text-primary/60">▾</span>
        </button>
        
        {/* Auto-Pick - placeholder */}
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          onClick={onAutoPick}
          disabled
        >
          <IconWand className="w-4 h-4" />
          <span className="text-sm font-medium">Auto-Pick</span>
          <span className="text-xs text-white/40">▾</span>
        </button>
        
        {/* Delete Selected */}
        <button 
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${selectedCount > 0 
              ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30" 
              : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
            }
          `}
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
        >
          <IconTrash className="w-4 h-4" />
          <span className="text-sm font-medium">
            {selectedCount > 0 ? `Delete (${selectedCount})` : "Delete"}
          </span>
        </button>
      </div>
      
      {/* Right side: Continue */}
      <button 
        className={`
          flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors
          ${canContinue 
            ? "bg-primary text-white hover:bg-primary/90" 
            : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
          }
        `}
        onClick={onContinue}
        disabled={!canContinue}
      >
        <span className="text-sm">Continue to Super</span>
        <IconArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
