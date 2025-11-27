import React from "react";

export function SeedCard() {
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
