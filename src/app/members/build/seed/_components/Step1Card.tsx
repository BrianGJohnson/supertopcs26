"use client";

import React from "react";
import { SessionMenu } from "@/components/SessionMenu";

interface Step1CardProps {
  topicCount: number;
  sourceCounts: {
    top10: number;
    child: number;
    az: number;
    prefix: number;
  };
}

export function Step1Card({ topicCount, sourceCounts }: Step1CardProps) {
  // Calculate tools completion
  const toolsCompleted = [
    sourceCounts.top10 > 0,
    sourceCounts.child > 0,
    sourceCounts.az > 0,
    sourceCounts.prefix > 0,
  ].filter(Boolean).length;
  const allToolsComplete = toolsCompleted === 4;

  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl flex flex-col relative z-20">
      {/* Top Section: Bucket Info */}
      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-3 text-center md:text-left max-w-md">
          <h2 className="text-3xl font-bold text-white">Step 1 • Topic Expansion</h2>
          <p className="text-text-secondary text-lg font-light leading-relaxed">
            Run all 4 expansion tools to fully map your topic.<br />
            Each tool uncovers different viewer interests.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0 pt-4">
          {/* Pills row - aligned tops */}
          <div className="flex items-start gap-4">
            {/* Your Topics Pill */}
            <div className="px-7 py-4 bg-gradient-to-b from-[#2E3338] to-[#1E2228] rounded-full text-white font-bold border-2 border-[#6B9BD1]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              Your Topics: {topicCount}
            </div>

            {/* Complete Button or Proceed Button */}
            {!allToolsComplete ? (
              <button className="px-8 py-4 bg-gradient-to-r from-[#D95555]/15 to-[#C94545]/15 hover:from-[#D95555]/25 hover:to-[#C94545]/25 text-red-300 border-2 border-red-500/20 rounded-xl font-bold transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer">
                Complete all 4 tools
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <button className="px-8 py-4 bg-gradient-to-b from-[#1E2A38] to-[#151D28] hover:from-[#243040] hover:to-[#1A2530] text-[#A8C4E0] border border-[#4A5568]/60 rounded-xl font-bold transition-all flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] cursor-pointer">
                Proceed to Refine
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Progress dots - only show when incomplete */}
          {!allToolsComplete && (
            <div className="flex items-center gap-2 pr-2">
              {[sourceCounts.top10, sourceCounts.child, sourceCounts.az, sourceCounts.prefix].map((count, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    count > 0 ? "bg-green-400" : "bg-white/20"
                  }`}
                />
              ))}
              <span className="text-white/50 text-sm font-medium ml-1">{toolsCompleted} of 4</span>
            </div>
          )}
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
