"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconPlayerPlay, IconWand, IconTrash, IconArrowRight, IconChartBar, IconUsers, IconFlame, IconTarget } from "@tabler/icons-react";

interface ActionToolbarProps {
  selectedCount: number;
  onRunTopicScoring: () => void;
  onRunFitScoring?: () => void;
  onRunPnCScoring?: () => void;
  onAutoPick: () => void;
  onDeleteSelected: () => void;
  onContinue: () => void;
  canContinue: boolean;
  isScoring?: boolean;
  scoringProgress?: { current: number; total: number };
}

type AnalysisOption = {
  id: "topic" | "fit" | "pnc";
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  action: () => void;
};

export function ActionToolbar({
  selectedCount,
  onRunTopicScoring,
  onRunFitScoring,
  onRunPnCScoring,
  onAutoPick,
  onDeleteSelected,
  onContinue,
  canContinue,
  isScoring = false,
  scoringProgress,
}: ActionToolbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Track if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Update dropdown position when opened
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        left: rect.left,
      });
    }
  }, [isDropdownOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Close dropdown on scroll
  useEffect(() => {
    if (isDropdownOpen) {
      const handleScroll = () => setIsDropdownOpen(false);
      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }
  }, [isDropdownOpen]);
  
  const analysisOptions: AnalysisOption[] = [
    {
      id: "topic",
      label: "1. Topic Strength",
      description: "Score phrase specificity and depth",
      icon: <IconChartBar className="w-4 h-4" />,
      enabled: true,
      action: () => {
        onRunTopicScoring();
        setIsDropdownOpen(false);
      },
    },
    {
      id: "fit",
      label: "2. Audience Fit",
      description: "Match to channel niche",
      icon: <IconUsers className="w-4 h-4" />,
      enabled: false, // Coming soon
      action: () => {
        onRunFitScoring?.();
        setIsDropdownOpen(false);
      },
    },
    {
      id: "pnc",
      label: "3. Popularity & Competition",
      description: "Search volume analysis",
      icon: <IconFlame className="w-4 h-4" />,
      enabled: false, // Coming soon
      action: () => {
        onRunPnCScoring?.();
        setIsDropdownOpen(false);
      },
    },
  ];
  
  // Dropdown menu rendered via portal
  const dropdownMenu = isDropdownOpen && !isScoring && isMounted && createPortal(
    <div 
      ref={dropdownRef}
      className="fixed w-64 bg-[#1a1a2e] border border-white/15 rounded-xl shadow-2xl"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 9999,
      }}
    >
      <div className="p-2">
        {analysisOptions.map((option) => (
          <button
            key={option.id}
            className={`
              w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
              ${option.enabled
                ? "hover:bg-white/5 cursor-pointer"
                : "opacity-40 cursor-not-allowed"
              }
            `}
            onClick={option.enabled ? option.action : undefined}
            disabled={!option.enabled}
          >
            <div className={`
              p-1.5 rounded-md
              ${option.enabled ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40"}
            `}>
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${option.enabled ? "text-white" : "text-white/40"}`}>
                {option.label}
                {!option.enabled && (
                  <span className="ml-2 text-xs text-white/30">(coming soon)</span>
                )}
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
  
  return (
    <div className="flex items-center justify-between p-4 bg-surface/40 backdrop-blur-md border border-white/10 rounded-xl">
      {/* Left side: Analysis actions */}
      <div className="flex items-center gap-3">
        {/* Run Analysis Dropdown */}
        <div className="relative">
          <button 
            ref={buttonRef}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${isScoring
                ? "bg-white/10 border border-white/20 text-white/70 cursor-wait"
                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }
            `}
            onClick={() => !isScoring && setIsDropdownOpen(!isDropdownOpen)}
            disabled={isScoring}
          >
            {isScoring ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm font-medium">
                  {scoringProgress 
                    ? `Scoring ${scoringProgress.current}/${scoringProgress.total}...`
                    : "Scoring..."
                  }
                </span>
              </>
            ) : (
              <>
                <IconPlayerPlay className="w-4 h-4" />
                <span className="text-sm font-medium">Run Analysis</span>
                <span className="text-xs text-white/40">▾</span>
              </>
            )}
          </button>
          
          {/* Dropdown rendered via portal */}
          {dropdownMenu}
        </div>
        
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
