"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { IconPlayerPlay, IconWand, IconArrowRight, IconChartBar, IconUsers, IconFlame, IconCoin, IconSelector, IconStar, IconPlus, IconArrowsExchange, IconSettingsCog, IconCheck, IconBolt } from "@tabler/icons-react";
import { listSessions, createSession } from "@/hooks/useSessions";
import { addSeeds } from "@/hooks/useSeedPhrases";
import { Modal, ModalButton } from "@/components/ui/Modal";
import type { Session } from "@/types/database";

interface ActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  starredCount: number;
  sessionName?: string;
  onRunTopicScoring: () => void;
  onRunFitScoring?: () => void;
  onRunDemandScoring?: () => void;
  onRunOpportunityScoring?: () => void;
  onAutoPick: () => void;
  onContinue: () => void;
  onJumpToTitle: () => void;
  canContinue: boolean;
  isScoring?: boolean;
  scoringProgress?: { current: number; total: number };
  // Topic Strength completion status - enables A. Fit
  topicStrengthComplete?: boolean;
  // Audience Fit completion status - enables Demand
  audienceFitComplete?: boolean;
  // Demand completion status - enables Opportunity
  demandComplete?: boolean;
  // For demand scoring: require ≤75 visible phrases
  visiblePhraseCount?: number;
}

type AnalysisOption = {
  id: "topic" | "fit" | "demand" | "opportunity";
  label: string;
  tokenCost: number;
  icon: React.ReactNode;
  enabled: boolean;
  disabledReason?: string;
  action: () => void;
};

export function ActionToolbar({
  selectedCount,
  totalCount,
  starredCount,
  sessionName = "Session",
  onRunTopicScoring,
  onRunFitScoring,
  onRunDemandScoring,
  onRunOpportunityScoring,
  onAutoPick,
  onContinue,
  onJumpToTitle,
  canContinue,
  isScoring = false,
  scoringProgress,
  topicStrengthComplete = false,
  audienceFitComplete = false,
  demandComplete = false,
  visiblePhraseCount = 0,
}: ActionToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get("session_id");
  
  // Jump to Title is enabled when 1+ phrases are starred
  const canJumpToTitle = starredCount >= 1;
  
  // Analysis dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Session dropdown state
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [sessionDropdownPosition, setSessionDropdownPosition] = useState({ top: 0, left: 0 });
  const [showSwitchList, setShowSwitchList] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [seedPhraseInput, setSeedPhraseInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const sessionButtonRef = useRef<HTMLButtonElement>(null);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isDropdownOpen]);
  
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
  
  useEffect(() => {
    if (isDropdownOpen) {
      const handleScroll = () => setIsDropdownOpen(false);
      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }
  }, [isDropdownOpen]);
  
  // Session dropdown position
  useEffect(() => {
    if (isSessionDropdownOpen && sessionButtonRef.current) {
      const rect = sessionButtonRef.current.getBoundingClientRect();
      setSessionDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isSessionDropdownOpen]);
  
  // Session dropdown click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        sessionDropdownRef.current && 
        !sessionDropdownRef.current.contains(target) &&
        sessionButtonRef.current &&
        !sessionButtonRef.current.contains(target)
      ) {
        setIsSessionDropdownOpen(false);
        setShowSwitchList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Session handlers
  const handleNewSessionClick = () => {
    setIsSessionDropdownOpen(false);
    setShowSwitchList(false);
    setIsNewSessionModalOpen(true);
  };
  
  const handleCreateSession = async () => {
    if (!seedPhraseInput.trim()) return;
    
    setIsCreating(true);
    try {
      const name = seedPhraseInput.trim();
      const newSession = await createSession(name, name);
      
      await addSeeds(newSession.id, [
        { phrase: name, generationMethod: "seed" },
      ]);
      
      router.push(`/members/build/seed?session_id=${newSession.id}&seed=${encodeURIComponent(name)}`);
      setIsNewSessionModalOpen(false);
      setSeedPhraseInput("");
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleSwitchSessionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showSwitchList) {
      try {
        const list = await listSessions();
        setSessions(list);
      } catch (error) {
        console.error("Failed to list sessions", error);
      }
    }
    setShowSwitchList(!showSwitchList);
  };
  
  const handleSelectSession = (sessionId: string) => {
    router.push(`/members/build/refine?session_id=${sessionId}`);
    setIsSessionDropdownOpen(false);
    setShowSwitchList(false);
  };
  
  const handleManageSessions = () => {
    router.push("/members/sessions");
    setIsSessionDropdownOpen(false);
    setShowSwitchList(false);
  };
  
  const displaySessions = sessions.slice(0, 10);
  const hasMoreSessions = sessions.length > 10;
  
  // Demand scoring requires ≤75 visible phrases after A. Fit is complete
  // TEMPORARILY: Enable demand if we have any phrases with fit scores (for testing)
  const hasAnyFitScores = visiblePhraseCount > 0; // Temporary override
  const canRunDemand = hasAnyFitScores && !!onRunDemandScoring && visiblePhraseCount <= 75;
  const demandDisabledReason = visiblePhraseCount === 0
    ? "No phrases loaded"
    : visiblePhraseCount > 75 
      ? `Reduce to ≤75 phrases (currently ${visiblePhraseCount})`
      : undefined;

  const analysisOptions: AnalysisOption[] = [
    {
      id: "topic",
      label: "1. Topic Strength",
      tokenCost: 100,
      icon: <IconChartBar className="w-4 h-4" />,
      enabled: true,
      action: () => {
        onRunTopicScoring();
        setIsDropdownOpen(false);
      },
    },
    {
      id: "fit",
      label: "2. A. Fit",
      tokenCost: 100,
      icon: <IconUsers className="w-4 h-4" />,
      enabled: topicStrengthComplete && !!onRunFitScoring,
      action: () => {
        onRunFitScoring?.();
        setIsDropdownOpen(false);
      },
    },
    {
      id: "demand",
      label: "3. Demand",
      tokenCost: 100,
      icon: <IconBolt className="w-4 h-4" />,
      enabled: canRunDemand,
      disabledReason: demandDisabledReason,
      action: () => {
        onRunDemandScoring?.();
        setIsDropdownOpen(false);
      },
    },
    {
      id: "opportunity",
      label: "4. Opportunity",
      tokenCost: 10,
      icon: <IconFlame className="w-4 h-4" />,
      // Opportunity becomes available after Demand is scored
      // Uses existing data - no additional API calls needed
      enabled: demandComplete && !!onRunOpportunityScoring,
      action: () => {
        onRunOpportunityScoring?.();
        setIsDropdownOpen(false);
      },
    },
  ];
  
  const dropdownMenu = isDropdownOpen && !isScoring && isMounted && createPortal(
    <div 
      ref={dropdownRef}
      className="fixed w-72 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl"
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
              w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
              ${option.enabled
                ? "hover:bg-white/5 cursor-pointer"
                : "opacity-40 cursor-not-allowed"
              }
            `}
            onClick={option.enabled ? option.action : undefined}
            disabled={!option.enabled}
          >
            <div className="flex items-center gap-2.5">
              <div className={`
                p-1.5 rounded-md
                ${option.enabled ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40"}
              `}>
                {option.icon}
              </div>
              <span className={`text-sm font-medium ${option.enabled ? "text-white" : "text-white/40"}`}>
                {option.label}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 ${option.enabled ? "text-white/70" : "text-white/40"}`}>
              <IconCoin className="w-4 h-4" />
              <span className="text-sm font-medium">{option.tokenCost}</span>
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
  
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {/* Run Analysis Dropdown */}
      <div className="relative">
        <button 
          ref={buttonRef}
          className={`
            h-12 flex items-center gap-2 px-5 rounded-lg transition-colors
            ${isScoring
              ? "bg-white/10 border border-white/20 text-white/70 cursor-wait"
              : "bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }
          `}
          onClick={() => !isScoring && setIsDropdownOpen(!isDropdownOpen)}
          disabled={isScoring}
        >
          {isScoring ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-sm whitespace-nowrap">
                {scoringProgress 
                  ? `Scoring ${scoringProgress.current}/${scoringProgress.total}...`
                  : "Scoring..."
                }
              </span>
            </>
          ) : (
            <>
              <IconPlayerPlay className="w-4 h-4" />
              <span className="text-sm whitespace-nowrap">Run Analysis</span>
              <IconSelector className="w-3.5 h-3.5 text-white/40" />
            </>
          )}
        </button>
        {dropdownMenu}
      </div>
      
      {/* Jump to Title Button - Active when 1+ phrases are starred, subdued style */}
      <button 
        className={`
          h-12 flex items-center gap-2 px-5 rounded-lg text-sm whitespace-nowrap transition-colors
          ${canJumpToTitle 
            ? "bg-white/10 border border-white/20 text-white hover:bg-white/15 cursor-pointer" 
            : "bg-white/5 border border-white/5 text-white/40 cursor-not-allowed"
          }
        `}
        onClick={canJumpToTitle ? onJumpToTitle : undefined}
        disabled={!canJumpToTitle}
        title={canJumpToTitle ? "Jump directly to Title page" : "Star at least 1 phrase to enable"}
      >
        <span>Jump</span>
        <IconArrowRight className="w-4 h-4" />
        <span>Title</span>
      </button>
      
      {/* Session Dropdown */}
      <div className="relative">
        <button 
          ref={sessionButtonRef}
          className="h-12 flex items-center gap-2 px-5 bg-white/5 border border-white/5 rounded-lg text-white/70 text-sm whitespace-nowrap hover:bg-white/10 hover:text-white transition-colors"
          onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
        >
          <span className="truncate max-w-[140px]">{sessionName}</span>
          <IconSelector className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        </button>
      </div>
      
      {/* Session Dropdown Menu - Portal */}
      {isMounted && isSessionDropdownOpen && createPortal(
        <div 
          ref={sessionDropdownRef}
          className="fixed z-[9999]"
          style={{ top: sessionDropdownPosition.top, left: sessionDropdownPosition.left }}
        >
          <div className="w-72 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="p-1 space-y-1">
              <button
                onClick={handleNewSessionClick}
                className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors"
              >
                <IconPlus size={18} className="text-blue-400" />
                New Session
              </button>

              <button
                onClick={handleSwitchSessionClick}
                className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors justify-between group"
              >
                <div className="flex items-center gap-3">
                  <IconArrowsExchange size={18} className="text-green-400" />
                  Switch Session
                </div>
                <svg
                  className="w-4 h-4 text-white/40 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="h-px bg-white/10 my-1 mx-2" />

              <button
                onClick={handleManageSessions}
                className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors"
              >
                <IconSettingsCog size={18} className="text-gray-400" />
                Manage Sessions
              </button>
            </div>
          </div>
          
          {/* Switch Session Flyout */}
          {showSwitchList && (
            <div 
              className="absolute top-0 left-[18.5rem] w-64 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl animate-in fade-in slide-in-from-left-2 duration-100"
            >
              <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar">
                {sessions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-white/40 text-center">Loading...</div>
                ) : displaySessions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-white/40 text-center">No sessions yet</div>
                ) : (
                  <>
                    {displaySessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center justify-between transition-colors ${s.id === currentSessionId ? 'text-white bg-white/5' : 'text-white/70'}`}
                      >
                        <span className="truncate pr-2">{s.name}</span>
                        {s.id === currentSessionId && <IconCheck size={14} className="text-green-400 flex-shrink-0" />}
                      </button>
                    ))}
                    {hasMoreSessions && (
                      <button
                        onClick={handleManageSessions}
                        className="w-full px-4 py-3 text-left text-sm text-[#6B9BD1] hover:bg-white/5 transition-colors border-t border-white/10 mt-2"
                      >
                        View all {sessions.length} sessions →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
      
      {/* Auto-Pick Button */}
      <button 
        className="h-12 flex items-center gap-2 px-5 bg-white/5 border border-white/5 rounded-lg text-white/70 text-sm whitespace-nowrap hover:bg-white/10 hover:text-white transition-colors"
        onClick={onAutoPick}
      >
        <IconStar className="w-4 h-4" />
        <span>Auto-Pick</span>
        <IconSelector className="w-3.5 h-3.5 text-white/40" />
      </button>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Topics Count */}
      <div className="h-12 flex items-center px-5 bg-white/5 border border-white/5 rounded-lg whitespace-nowrap">
        <span className="text-white/70 text-sm">{totalCount} Topics</span>
      </div>
      
      {/* Selection Status / Continue */}
      <button 
        className={`
          h-12 flex items-center gap-2 px-5 rounded-lg transition-colors whitespace-nowrap
          ${canContinue 
            ? "bg-primary text-white hover:bg-primary/90" 
            : "bg-white/5 border border-white/5 text-white/50"
          }
        `}
        onClick={onContinue}
        disabled={!canContinue}
      >
        <span className="text-sm">
          {starredCount >= 10 
            ? "Continue to Super" 
            : `Select ${10 - starredCount} more`
          }
        </span>
        <IconArrowRight className="w-4 h-4" />
      </button>
      
      {/* New Session Modal */}
      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => {
          setIsNewSessionModalOpen(false);
          setSeedPhraseInput("");
        }}
        title="Create New Session"
        footer={
          <>
            <ModalButton
              variant="secondary"
              onClick={() => {
                setIsNewSessionModalOpen(false);
                setSeedPhraseInput("");
              }}
            >
              Cancel
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={handleCreateSession}
            >
              {isCreating ? "Creating..." : "+ Create Session"}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-white/60 text-[1.125rem] leading-relaxed">
            Add a two word phrase that describes the type of topics you're interested in. Example: <span className="text-white/80">poodle grooming</span>.
          </p>
          <input
            type="text"
            value={seedPhraseInput}
            onChange={(e) => setSeedPhraseInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && seedPhraseInput.trim()) {
                handleCreateSession();
              }
            }}
            placeholder="Enter seed phrase..."
            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-base text-white placeholder-white/30 focus:outline-none focus:border-[#6B9BD1]/50 focus:ring-1 focus:ring-[#6B9BD1]/30 transition-all"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
