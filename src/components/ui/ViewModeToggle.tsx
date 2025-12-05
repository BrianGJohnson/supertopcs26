"use client";

import React, { useState, useRef, useEffect } from "react";
import { IconAdjustments } from "@tabler/icons-react";
import type { DisplayMode } from "@/types/database";

interface ViewModeToggleProps {
  mode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
}

/**
 * ViewModeToggle
 * 
 * A small settings icon that opens a popover to switch between
 * Simple (essentials) and Detailed (full) view modes.
 * 
 * Designed to be unobtrusive and consistent across modals, tables, and pages.
 */
export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Settings Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        title="View settings"
      >
        <IconAdjustments size={28} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[140px] bg-[#1E2228] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-xs text-white/40 font-medium uppercase tracking-wide">View</span>
          </div>
          
          <div className="p-1">
            {/* Simple option */}
            <button
              onClick={() => {
                onModeChange('essentials');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                mode === 'essentials'
                  ? 'bg-[#2BD899]/10 text-[#2BD899]'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                mode === 'essentials' ? 'border-[#2BD899]' : 'border-white/30'
              }`}>
                {mode === 'essentials' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2BD899]" />
                )}
              </span>
              <span className="text-sm font-medium">Simple</span>
            </button>

            {/* Detailed option */}
            <button
              onClick={() => {
                onModeChange('full');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                mode === 'full'
                  ? 'bg-[#7A5CFA]/10 text-[#7A5CFA]'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                mode === 'full' ? 'border-[#7A5CFA]' : 'border-white/30'
              }`}>
                {mode === 'full' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7A5CFA]" />
                )}
              </span>
              <span className="text-sm font-medium">Detailed</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
