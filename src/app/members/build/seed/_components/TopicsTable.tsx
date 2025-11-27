import React from "react";

export function TopicsTable() {
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
