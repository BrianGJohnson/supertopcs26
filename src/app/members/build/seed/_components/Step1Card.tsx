import React from "react";

export function Step1Card() {
  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl flex flex-col">
      {/* Top Section: Bucket Info */}
      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex-1 space-y-3 text-center md:text-left">
          <h2 className="text-3xl font-bold text-white">Step 1 • Topic Expansion</h2>
          <p className="text-text-secondary text-lg font-light leading-relaxed">
            Add at least 100 phrases to proceed. Aim for 200 to uncover deeper YouTube opportunities.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="px-7 py-4 bg-gradient-to-b from-[#2E3338] to-[#1E2228] rounded-full text-white font-bold border-2 border-[#6B9BD1]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            Your Topics: 11
          </div>
        </div>

        <div className="flex-shrink-0">
          {(() => {
            const topicCount = 11; // TODO: Replace with actual count
            const needsMore = topicCount < 100;
            const remaining = 100 - topicCount;
            
            return needsMore ? (
              <button className="px-8 py-4 bg-gradient-to-r from-[#D95555]/15 to-[#C94545]/15 hover:from-[#D95555]/25 hover:to-[#C94545]/25 text-red-300 border-2 border-red-500/20 rounded-xl font-bold transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer">
                Add {remaining} more topics
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <button className="px-8 py-4 bg-gradient-to-b from-[#1E2A38] to-[#151D28] hover:from-[#243040] hover:to-[#1A2530] text-[#A8C4E0] border border-[#4A5568]/60 rounded-xl font-bold transition-all flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] cursor-pointer">
                Proceed
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            );
          })()}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/5"></div>

      {/* Bottom Section: Session & Sources */}
      <div className="px-10 py-10 md:px-12 bg-black/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <button className="px-7 py-4 bg-gradient-to-b from-[#2E3338] to-[#1E2228] rounded-full text-white/[0.82] font-bold border-2 border-[#6B9BD1]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center gap-2 hover:from-[#353A40] hover:to-[#252A30] transition-all cursor-pointer">
            Session: Content Creation
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-2">
          <span className="text-white/[0.68] font-bold text-base mr-2">Topic Sources:</span>
          <a href="#" className="px-3.5 py-1.5 bg-gradient-to-b from-[#2A2E34] to-[#1E2228] rounded-full text-sm text-[#CC7A3D] font-medium border border-[#CC7A3D]/45 transition-all">
            Top 10 (10)
          </a>
          <a href="#" className="px-3.5 py-1.5 bg-gradient-to-b from-[#252930] to-[#1A1E24] rounded-full text-sm text-[#B8CC75]/70 font-medium border border-[#B8CC75]/35 hover:border-[#B8CC75]/45 hover:text-[#B8CC75]/80 transition-all">
            Child (0)
          </a>
          <a href="#" className="px-3.5 py-1.5 bg-gradient-to-b from-[#252930] to-[#1A1E24] rounded-full text-sm text-[#45B87A]/70 font-medium border border-[#45B87A]/35 hover:border-[#45B87A]/45 hover:text-[#45B87A]/80 transition-all">
            A–Z (0)
          </a>
          <a href="#" className="px-3.5 py-1.5 bg-gradient-to-b from-[#252930] to-[#1A1E24] rounded-full text-sm text-[#35AABC]/70 font-medium border border-[#35AABC]/35 hover:border-[#35AABC]/45 hover:text-[#35AABC]/80 transition-all">
            Prefix (0)
          </a>
        </div>
      </div>
    </div>
  );
}
