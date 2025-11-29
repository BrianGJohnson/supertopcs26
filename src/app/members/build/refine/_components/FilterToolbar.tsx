"use client";

import React from "react";

interface FilterToolbarProps {
  totalCount: number;
  visibleCount: number;
}

export function FilterToolbar({ totalCount, visibleCount }: FilterToolbarProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-surface/40 backdrop-blur-md border border-white/10 rounded-xl">
      {/* Search - placeholder */}
      <div className="flex-1 max-w-xs">
        <input
          type="text"
          placeholder="Search phrases..."
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          disabled
        />
      </div>
      
      {/* Source filter - placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-white/40 text-sm">Source:</span>
        <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm hover:bg-white/10 transition-colors" disabled>
          All ▾
        </button>
      </div>
      
      {/* Score range - placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-white/40 text-sm">Topic:</span>
        <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm hover:bg-white/10 transition-colors" disabled>
          0-100 ▾
        </button>
      </div>
      
      {/* Stats */}
      <div className="ml-auto text-sm">
        <span className="text-white/40">
          {visibleCount} of {totalCount} phrases
        </span>
      </div>
    </div>
  );
}
