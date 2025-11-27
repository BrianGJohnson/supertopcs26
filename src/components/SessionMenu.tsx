"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconPlus, IconArrowsExchange, IconSettingsCog, IconCheck } from "@tabler/icons-react";
import { createSession, listSessions, Session } from "@/hooks/useSessions";

interface SessionMenuProps {
  currentSessionName?: string;
}

export function SessionMenu({ currentSessionName = "Content Creation" }: SessionMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get("session_id");
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSwitchList, setShowSwitchList] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleNewSession = async () => {
    try {
      const name = `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const newSession = await createSession(name);
      router.push(`/members/build/seed?session_id=${newSession.id}`);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create session", error);
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
    router.push(`/members/build/seed?session_id=${sessionId}`);
    setIsOpen(false);
  };

  const handleManageSessions = () => {
    router.push("/members/sessions");
    setIsOpen(false);
  };

  // If we have a session ID in URL, try to find its name from the list if we loaded it
  // Ideally we would fetch the single session name server side or via hook, 
  // but for this UI component we'll stick to the prop or fallback.
  // If sessions are loaded, we can lookup the name.
  const displaySessionName = sessions.find(s => s.id === currentSessionId)?.name || currentSessionName;

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
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1 space-y-1">
            <button
              onClick={handleNewSession}
              className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors"
            >
              <IconPlus size={18} className="text-blue-400" />
              New Session
            </button>

            <div className="relative">
              <button
                onClick={handleSwitchSessionClick}
                className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors justify-between group"
              >
                <div className="flex items-center gap-3">
                  <IconArrowsExchange size={18} className="text-green-400" />
                  Switch Session
                </div>
                <svg
                  className={`w-4 h-4 text-white/40 transition-transform ${showSwitchList ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {showSwitchList && (
                <div className="bg-black/20 mx-2 mb-2 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
                  {sessions.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-white/40 text-center">Loading...</div>
                  ) : (
                    sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className={`w-full px-4 py-2.5 text-left text-xs hover:bg-white/5 flex items-center justify-between transition-colors ${s.id === currentSessionId ? 'text-white bg-white/5' : 'text-white/70'}`}
                      >
                        <span className="truncate pr-2">{s.name}</span>
                        {s.id === currentSessionId && <IconCheck size={14} className="text-green-400 flex-shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

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
    </div>
  );
}
