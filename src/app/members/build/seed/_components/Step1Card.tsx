"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SessionMenu } from "@/components/SessionMenu";
import { authFetch } from "@/lib/supabase";

interface Step1CardProps {
  sessionId: string | null;
  topicCount: number;
  sourceCounts: {
    top10: number;
    child: number;
    az: number;
    prefix: number;
  };
  isExpanding: boolean;
  hasSeedPhrase: boolean;
}

export function Step1Card({ sessionId, topicCount, sourceCounts, isExpanding, hasSeedPhrase }: Step1CardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calculate tools completion - count which sources have run
  // Note: Child can legitimately have 0 results if all children are filtered as duplicates
  // So we check if the required sources have data: top10, az, and prefix
  // Child is optional since it depends on Top-10 results
  const hasTop10 = sourceCounts.top10 > 0;
  const hasAZ = sourceCounts.az > 0;
  const hasPrefix = sourceCounts.prefix > 0;
  
  // GATE: Complete if we have the 3 required sources AND not actively expanding
  const allToolsComplete = hasTop10 && hasAZ && hasPrefix && !isExpanding;

  // Handle "Proceed to Refine" click - runs Data Intake
  const handleProceedToRefine = async () => {
    if (!sessionId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Run Data Intake API
      const response = await authFetch(`/api/sessions/${sessionId}/intake`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Data Intake failed');
      }
      
      // Navigate to Refine page
      router.push(`/members/build/refine?session_id=${sessionId}`);
    } catch (error) {
      console.error('Failed to run Data Intake:', error);
      // TODO: Show error toast
      setIsProcessing(false);
    }
  };

  // Get description text based on state
  const getDescription = () => {
    if (allToolsComplete) {
      return (
        <>
          Expansion complete! You have {topicCount} topics.<br />
          Ready to refine your selection.
        </>
      );
    }
    if (isExpanding) {
      return (
        <>
          Your topic is expanding automatically.<br />
          We&apos;re mapping out the topic landscape—even the hidden corners.
        </>
      );
    }
    if (!hasSeedPhrase) {
      // No seed phrase yet
      return (
        <>
          Create a session with a topic to begin.<br />
          We&apos;ll explore the full range of related topics.
        </>
      );
    }
    return (
      <>
        Click &quot;Expand Topic&quot; above to begin.<br />
        We&apos;ll map out related topics for you.
      </>
    );
  };

  // Get status indicator based on state  
  const getStatusIndicator = () => {
    if (allToolsComplete) {
      return (
        <button 
          onClick={handleProceedToRefine}
          disabled={isProcessing}
          className="px-8 py-4 bg-gradient-to-b from-[#1A3D2E] to-[#122820] hover:from-[#1E4A36] hover:to-[#163028] text-[#7DD4A0] border border-[#4DD68A]/50 rounded-xl font-bold transition-all flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_20px_rgba(77,214,138,0.15)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Patterns...
            </>
          ) : (
            <>
              Proceed to Refine
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      );
    }
    if (isExpanding) {
      return (
        <div className="px-8 py-4 bg-gradient-to-b from-[#2A2E34] to-[#1E2228] text-white/60 border border-white/10 rounded-xl font-medium flex items-center gap-3">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Expanding...
        </div>
      );
    }
    // Idle state
    return (
      <div className="px-8 py-4 bg-gradient-to-b from-[#2A2E34] to-[#1E2228] text-white/40 border border-white/10 rounded-xl font-medium flex items-center gap-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Waiting to Start
      </div>
    );
  };

  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl flex flex-col relative z-20">
      {/* Top Section: Bucket Info */}
      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-3 text-center md:text-left max-w-md">
          <h2 className="text-3xl font-bold text-white">Step 1 • Topic Expansion</h2>
          <p className="text-text-secondary text-lg font-light leading-relaxed">
            {getDescription()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0 pt-4">
          {/* Pills row - aligned tops */}
          <div className="flex items-start gap-4">
            {/* Your Topics Pill */}
            <div className="px-7 py-4 bg-gradient-to-b from-[#2E3338] to-[#1E2228] rounded-full text-white font-bold border-2 border-[#6B9BD1]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              Your Topics: {topicCount}
            </div>

            {/* Status indicator */}
            {getStatusIndicator()}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/5"></div>

      {/* Bottom Section: Session & Sources */}
      <div className="px-10 py-10 md:px-12 bg-black/20 rounded-b-3xl flex flex-col md:flex-row justify-between items-center gap-6 overflow-visible">
        <div className="flex items-center gap-3">
          <SessionMenu />
        </div>
        <div className="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-2">
          <span className="text-white/[0.68] font-bold text-base mr-2">Topic Sources:</span>
          <span className={`px-3.5 py-1.5 bg-gradient-to-b rounded-full text-sm font-medium border transition-all ${
            sourceCounts.top10 > 0 
              ? "from-[#2A2E34] to-[#1E2228] text-[#FF8A3D] border-[#FF8A3D]/45" 
              : "from-[#252930] to-[#1A1E24] text-[#FF8A3D]/50 border-[#FF8A3D]/25"
          }`}>
            Top 10 ({sourceCounts.top10})
          </span>
          <span className={`px-3.5 py-1.5 bg-gradient-to-b rounded-full text-sm font-medium border transition-all ${
            sourceCounts.child > 0 
              ? "from-[#2A2E34] to-[#1E2228] text-[#D4E882] border-[#D4E882]/45" 
              : "from-[#252930] to-[#1A1E24] text-[#D4E882]/50 border-[#D4E882]/25"
          }`}>
            Child ({sourceCounts.child})
          </span>
          <span className={`px-3.5 py-1.5 bg-gradient-to-b rounded-full text-sm font-medium border transition-all ${
            sourceCounts.az > 0 
              ? "from-[#2A2E34] to-[#1E2228] text-[#4DD68A] border-[#4DD68A]/45" 
              : "from-[#252930] to-[#1A1E24] text-[#4DD68A]/50 border-[#4DD68A]/25"
          }`}>
            A–Z ({sourceCounts.az})
          </span>
          <span className={`px-3.5 py-1.5 bg-gradient-to-b rounded-full text-sm font-medium border transition-all ${
            sourceCounts.prefix > 0 
              ? "from-[#2A2E34] to-[#1E2228] text-[#39C7D8] border-[#39C7D8]/45" 
              : "from-[#252930] to-[#1A1E24] text-[#39C7D8]/50 border-[#39C7D8]/25"
          }`}>
            Prefix ({sourceCounts.prefix})
          </span>
        </div>
      </div>
    </div>
  );
}
