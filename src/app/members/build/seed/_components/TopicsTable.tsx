"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getSeedsBySession } from "@/hooks/useSeedPhrases";
import { toTitleCase } from "@/lib/utils";
import type { Seed } from "@/types/database";

// Tag styling based on generation method
// Color hierarchy (difficulty to views): Red (hardest) → Orange → Yellow-Green → Green → Teal (easiest)
const TAG_STYLES: Record<string, { label: string; textColor: string; borderColor: string }> = {
  seed: {
    label: "Seed",
    textColor: "text-[#FF6B5B]",      // Coral-red - most competitive (brightened to match visual weight)
    borderColor: "border-[#FF6B5B]/45",
  },
  top10: {
    label: "Top 10",
    textColor: "text-[#FF8A3D]",      // Orange - competitive but doable
    borderColor: "border-[#FF8A3D]/45",
  },
  child: {
    label: "Child",
    textColor: "text-[#D4E882]",      // Yellow-green - opportunity zone
    borderColor: "border-[#D4E882]/45",
  },
  az: {
    label: "A-Z",
    textColor: "text-[#4DD68A]",      // Green - great terms
    borderColor: "border-[#4DD68A]/45",
  },
  prefix: {
    label: "Prefix",
    textColor: "text-[#39C7D8]",      // Teal - fantastic
    borderColor: "border-[#39C7D8]/45",
  },
};

interface TopicsTableProps {
  refreshTrigger?: number; // Increment to trigger refresh
  maxRows?: number; // Maximum rows to display (default 15)
}

export function TopicsTable({ refreshTrigger = 0, maxRows = 15 }: TopicsTableProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch seeds when sessionId changes or refresh is triggered
  useEffect(() => {
    async function loadSeeds() {
      if (!sessionId) {
        setSeeds([]);
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await getSeedsBySession(sessionId);
        // Limit to maxRows for display (all are still saved in DB)
        setSeeds(data.slice(0, maxRows));
      } catch (error) {
        console.error("Failed to load seeds:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSeeds();
  }, [sessionId, refreshTrigger, maxRows]);

  // Get tag style for a seed
  const getTagStyle = (method: string | null) => {
    return TAG_STYLES[method || ""] || TAG_STYLES.seed;
  };

  if (isLoading) {
    return (
      <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl p-12 text-center">
        <p className="text-white/40">Loading phrases...</p>
      </div>
    );
  }

  if (seeds.length === 0) {
    return (
      <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl p-12 text-center">
        <p className="text-white/40 text-lg">No phrases yet.</p>
        <p className="text-white/25 text-sm mt-2">Click Top 10 above to start expanding your seed.</p>
      </div>
    );
  }

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
          {seeds.map((seed, i) => {
            const tagStyle = getTagStyle(seed.generation_method);
            return (
              <tr 
                key={seed.id} 
                className="hover:bg-white/[0.04] transition-colors group animate-in fade-in slide-in-from-top-1 duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <td className="px-8 py-5 text-white/[0.86] group-hover:text-white transition-colors">
                  {toTitleCase(seed.phrase)}
                </td>
                <td className="px-8 py-5 text-right">
                  <span className={`inline-block min-w-[70px] text-center px-3.5 py-1.5 bg-gradient-to-b from-[#2A2E34] to-[#1E2228] rounded-full text-sm ${tagStyle.textColor} border ${tagStyle.borderColor} font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
                    {tagStyle.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
