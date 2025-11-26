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
          description="Work from left to right. Start with Top-10 Topics for quick results."
        />
        <BuilderStepper activeStep={1} />
        <SeedCard />
        <Step1Card />
        <TopicsTable />
      </div>
    </PageShell>
  );
}

// --- Components ---

function SeedCard() {
  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group -mt-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
      <div className="max-w-2xl mx-auto flex flex-col gap-8 relative z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="content creator"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-xl text-white focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-white/40 text-center shadow-inner"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="px-4 py-4 bg-[#FF8A3D]/10 hover:bg-[#FF8A3D]/20 border border-[#FF8A3D]/20 rounded-xl text-[#FF8A3D] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(255,138,61,0.1)]">
            Top 10
          </button>
          <button className="px-4 py-4 bg-[#D4E882]/10 hover:bg-[#D4E882]/20 border border-[#D4E882]/20 rounded-xl text-[#D4E882] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(212,232,130,0.1)]">
            Child
          </button>
          <button className="px-4 py-4 bg-[#4DD68A]/10 hover:bg-[#4DD68A]/20 border border-[#4DD68A]/20 rounded-xl text-[#4DD68A] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(77,214,138,0.1)]">
            A–Z
          </button>
          <button className="px-4 py-4 bg-[#39C7D8]/10 hover:bg-[#39C7D8]/20 border border-[#39C7D8]/20 rounded-xl text-[#39C7D8] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(57,199,216,0.1)]">
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
          <h2 className="text-3xl font-bold text-white">Step 1: Build Your Bucket</h2>
          <p className="text-text-secondary text-lg font-light leading-relaxed">
            Add at least 100 phrases tied to one two-word topic. Aim for around 200.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="px-8 py-3 bg-gradient-to-r from-primary to-purple-600 rounded-full text-white font-bold shadow-[0_0_20px_rgba(122,92,250,0.4)] border border-white/10">
            Your Topics: 11
          </div>
        </div>

        <div className="flex-shrink-0">
          <button className="px-8 py-4 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-300 border border-red-500/30 rounded-xl font-bold transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer">
            Add 89 more topics
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/5"></div>

      {/* Bottom Section: Session & Sources */}
      <div className="px-8 py-6 md:px-10 bg-black/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <button className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-text-secondary">Session:</span> Content Creation
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm font-medium">
          <span className="text-text-secondary uppercase tracking-wider text-xs">Raw Sources</span>
          <a href="#" className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 transition-colors drop-shadow-[0_0_8px_rgba(255,138,61,0.3)]">
            Top 10 (10)
          </a>
          <a href="#" className="text-text-secondary/60 hover:text-text-primary transition-colors">
            Child (0)
          </a>
          <a href="#" className="text-text-secondary/60 hover:text-text-primary transition-colors">
            A–Z (0)
          </a>
          <a href="#" className="text-text-secondary/60 hover:text-text-primary transition-colors">
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
            <th className="px-8 py-5 text-xs font-bold text-text-secondary uppercase tracking-widest">Phrase</th>
            <th className="px-8 py-5 text-xs font-bold text-text-secondary uppercase tracking-widest text-right">Tag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((phrase, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors group">
              <td className="px-8 py-5 text-white group-hover:text-primary transition-colors">{phrase}</td>
              <td className="px-8 py-5 text-right">
                <span className="px-3 py-1 bg-[#FF8A3D]/10 rounded-full text-xs text-[#FF8A3D] border border-[#FF8A3D]/20 font-medium">
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
