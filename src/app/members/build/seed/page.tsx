import React from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconSeedling } from "@tabler/icons-react";

export default function SeedPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconSeedling}
          line1="Create Your Next Winning"
          line2="Video Package"
          description="Click Top 10 to start expanding your seed topic. Each save unlocks the next tool. Complete all four to fully map your topic."
        />
        <BuilderStepper activeStep={1} />
        <SeedCard />
        <Step1Card />
        <TopicsTable />

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}

// --- Components ---

function SeedCard() {
  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group -mt-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-25"></div>
      <div className="max-w-2xl mx-auto flex flex-col gap-8 relative z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="content creator"
            className="w-full bg-black/40 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/30 rounded-2xl px-8 py-5 text-xl text-white focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-white/85 text-center shadow-inner"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="px-4 py-4 bg-[#FF8A3D]/10 hover:bg-[#FF8A3D]/20 border border-[#FF8A3D]/30 rounded-xl text-[#FF8A3D] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(255,138,61,0.1)]">
            Top 10
          </button>
          <button className="px-4 py-4 bg-[#D4E882]/10 hover:bg-[#D4E882]/20 border border-[#D4E882]/30 rounded-xl text-[#D4E882] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(212,232,130,0.1)]">
            Child
          </button>
          <button className="px-4 py-4 bg-[#4DD68A]/10 hover:bg-[#4DD68A]/20 border border-[#4DD68A]/30 rounded-xl text-[#4DD68A] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(77,214,138,0.1)]">
            A–Z
          </button>
          <button className="px-4 py-4 bg-[#39C7D8]/10 hover:bg-[#39C7D8]/20 border border-[#39C7D8]/30 rounded-xl text-[#39C7D8] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(57,199,216,0.1)]">
            Prefix
          </button>
        </div>
      </div>
    </div>
  );
}

function Step1Card() {
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

function TopicsTable() {
  const rows = [
    "content creation for business",
    "content creation course",
    "content creation equipment",
    "content creation strategy 2025",
    "content creation tools free",
    "content creation ideas for beginners",
    "content creation agency pricing",
    "content creation ai tools",
    "content creation automation",
    "content creation best practices",
    "content creation calendar template",
    "content creation jobs remote",
  ];

  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/5">
            <th className="pl-9 pr-8 py-5 text-[18px] font-bold text-white/[0.86] uppercase tracking-[0.15em]">Phrase</th>
            <th className="pl-8 pr-12 py-5 text-[18px] font-bold text-white/[0.86] uppercase tracking-[0.15em] text-right">Tag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-black/[0.03]">
          {rows.map((phrase, i) => (
            <tr key={i} className="hover:bg-white/[0.04] transition-colors group">
              <td className="px-8 py-5 text-white/[0.86] group-hover:text-white transition-colors">{phrase}</td>
              <td className="px-8 py-5 text-right">
                <span className="px-3 py-1 bg-gradient-to-b from-[#2A2E34] to-[#1E2228] rounded-full text-xs text-[#CC7A3D] border border-[#CC7A3D]/55 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  Top 10
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
