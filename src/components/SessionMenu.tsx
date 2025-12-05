"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconPlus, IconArrowsExchange, IconSettingsCog, IconCheck } from "@tabler/icons-react";
import { createSession, listSessions, getSessionById } from "@/hooks/useSessions";
import { addSeeds } from "@/hooks/useSeedPhrases";
import { Modal, ModalButton } from "@/components/ui/Modal";
import { ViewerLandscapeModal } from "@/components/ui/ViewerLandscapeModal";
import type { Session } from "@/types/database";

interface SessionMenuProps {
  currentSessionName?: string;
}

export function SessionMenu({ currentSessionName }: SessionMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get("session_id");
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSwitchList, setShowSwitchList] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [seedPhraseInput, setSeedPhraseInput] = useState("");
  const [isLandscapeModalOpen, setIsLandscapeModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-open landscape modal after user stops typing (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Only trigger if input modal is open and has enough text
    if (isNewSessionModalOpen && seedPhraseInput.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        setIsNewSessionModalOpen(false);
        setIsLandscapeModalOpen(true);
      }, 2000); // 2 second debounce - gives time to finish typing
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [seedPhraseInput, isNewSessionModalOpen]);

  // Fetch current session on mount or when session_id changes
  useEffect(() => {
    async function fetchCurrentSession() {
      if (currentSessionId) {
        try {
          const session = await getSessionById(currentSessionId);
          setCurrentSession(session);
        } catch (error) {
          console.error("Failed to fetch session:", error);
        }
      } else {
        setCurrentSession(null);
      }
    }
    fetchCurrentSession();
  }, [currentSessionId]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSwitchList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewSessionClick = () => {
    setIsOpen(false);
    setIsNewSessionModalOpen(true);
  };

  // Called from ViewerLandscapeModal when user confirms they want to create
  const handleCreateSession = async (seed: string) => {
    setIsCreating(true);
    try {
      const name = seed.trim();
      const newSession = await createSession(name, name);
      
      // Save the seed phrase to seeds table
      await addSeeds(newSession.id, [
        {
          phrase: name,
          generationMethod: "seed",
        },
      ]);
      
      // Redirect with seed param for autofill
      router.push(`/members/build/seed?session_id=${newSession.id}&seed=${encodeURIComponent(name)}`);
      setIsLandscapeModalOpen(false);
      setSeedPhraseInput("");
    } catch (error) {
      // Handle both Error objects and Supabase error objects
      const message = 
        error instanceof Error ? error.message : 
        (error && typeof error === 'object' && 'message' in error) ? String((error as { message: unknown }).message) :
        "Unknown error";
      console.error("Failed to create session:", message, error);
      // If not authenticated, redirect to login
      if (message === "Not authenticated") {
        router.push("/login");
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Called when user clicks "Pass" in the landscape modal - just close everything
  const handlePassOnSeed = () => {
    setIsLandscapeModalOpen(false);
    setSeedPhraseInput("");
  };

  const handleSwitchSessionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showSwitchList) {
      try {
        const list = await listSessions();
        // Store all sessions but only show first 10 in dropdown
        setSessions(list);
      } catch (error) {
        console.error("Failed to list sessions", error);
      }
    }
    setShowSwitchList(!showSwitchList);
  };

  const handleSelectSession = (sessionId: string) => {
    router.push(`/members/build/seed?session_id=${sessionId}`);
    setIsOpen(false);
    setShowSwitchList(false);
  };

  const handleManageSessions = () => {
    router.push("/members/sessions");
    setIsOpen(false);
    setShowSwitchList(false);
  };

  // Sessions to display (max 10)
  const displaySessions = sessions.slice(0, 10);
  const hasMoreSessions = sessions.length > 10;

  // Display name: fetched session > prop > "New Session"
  const displaySessionName = currentSession?.name || currentSessionName || "New Session";

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-7 py-4 bg-gradient-to-b from-[#2E3338] to-[#1E2228] rounded-full text-white/[0.82] font-bold border-2 border-[#6B9BD1]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center gap-2 hover:from-[#353A40] hover:to-[#252A30] transition-all cursor-pointer"
      >
        Session: {displaySessionName}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-100">
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
                className={`w-4 h-4 text-white/40 transition-transform`}
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
      )}

      {/* Flyout submenu - appears to the right of main menu */}
      {isOpen && showSwitchList && (
        <div className="absolute top-full left-[18.5rem] mt-2 w-64 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl z-[200] animate-in fade-in slide-in-from-left-2 duration-100">
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
                {/* View All link when more than 10 sessions */}
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

      {/* New Session Modal - type phrase, auto-opens landscape modal */}
      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => {
          setIsNewSessionModalOpen(false);
          setSeedPhraseInput("");
        }}
        title="Create New Session"
      >
        <div className="space-y-4">
          <p className="text-white/60 text-[1.125rem] leading-relaxed">
            Add a two word phrase that describes the type of topics you're interested in. Example: <span className="text-white/80">poodle grooming</span>.
          </p>
          <input
            type="text"
            value={seedPhraseInput}
            onChange={(e) => setSeedPhraseInput(e.target.value)}
            placeholder="Enter seed phrase..."
            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-base text-white placeholder-white/30 focus:outline-none focus:border-[#6B9BD1]/50 focus:ring-1 focus:ring-[#6B9BD1]/30 transition-all"
            autoFocus
          />
          {seedPhraseInput.trim().length > 0 && seedPhraseInput.trim().length < 3 && (
            <p className="text-white/40 text-sm">Type at least 3 characters...</p>
          )}
          {seedPhraseInput.trim().length >= 3 && (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing demand...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Viewer Landscape Modal - shows analysis and Create/Pass options */}
      <ViewerLandscapeModal
        isOpen={isLandscapeModalOpen}
        onClose={() => {
          setIsLandscapeModalOpen(false);
          setSeedPhraseInput("");
        }}
        seed={seedPhraseInput}
        onCreateSession={handleCreateSession}
        onPass={handlePassOnSeed}
      />
    </div>
  );
}
