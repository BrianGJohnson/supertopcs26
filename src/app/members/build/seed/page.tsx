import React from "react";
import { PageShell } from "@/components/layout/PageShell";

export default function SeedPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <AppBar />
        <HeroSection />
        <Stepper />
        <SeedCard />
        <Step1Card />
        <TopicsTable />
      </div>
    </PageShell>
  );
}

// --- Components ---

function AppBar() {
  return (
    <nav className="w-full px-2 py-4 flex justify-between items-center border-b border-white/5 relative z-10 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <span className="font-bold tracking-tight" style={{ fontSize: '1.468rem', color: '#D6DBE6' }}>Super Topics</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-white text-sm font-bold shadow-inner hover:border-white/20 transition-colors">
          BJ
        </button>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <div className="text-center flex flex-col items-center gap-8 mt-4">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full"></div>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-surface to-background border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
          <svg className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(122,92,250,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-[3.4rem] md:text-[4.2rem] font-extrabold text-white tracking-tight drop-shadow-lg">
          Create Your Next Winning<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Video Package
          </span>
        </h1>
        <p className="text-[1.35rem] text-text-secondary font-light">
          Work from left to right. Start with Top-10 Topics for quick results.
        </p>
      </div>
      <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
    </div>
  );
}

function Stepper() {
  const steps = [
    { label: "Seed", active: true },
    { label: "Refine", active: false },
    { label: "Super", active: false },
    { label: "Title", active: false },
    { label: "Package", active: false },
    { label: "Upload", active: false },
  ];

  return (
    <div className="flex justify-between items-center relative max-w-3xl mx-auto w-full px-4 py-4">
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -z-10"></div>
      {steps.map((step, index) => (
        <div key={step.label} className={`flex flex-col items-center gap-3 ${step.active ? "" : "opacity-50"}`}>
          {step.active ? (
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-primary to-purple-700 text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(122,92,250,0.4)] ring-4 ring-background z-10">
              {index + 1}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface border border-white/10 text-text-secondary flex items-center justify-center font-medium ring-4 ring-background z-10">
              {index + 1}
            </div>
          )}
          <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${step.active ? "text-primary drop-shadow-[0_0_10px_rgba(122,92,250,0.5)]" : "text-text-secondary"}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SeedCard() {
  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
      <div className="max-w-2xl mx-auto flex flex-col gap-8 relative z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="content creator"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-xl text-white focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-white/20 text-center shadow-inner"
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
          <button className="px-4 py-4 bg-[#E5FF6A]/10 hover:bg-[#E5FF6A]/20 border border-[#E5FF6A]/20 rounded-xl text-[#E5FF6A] font-semibold text-[17px] leading-tight transition-all shadow-[0_0_15px_rgba(229,255,106,0.1)]">
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
