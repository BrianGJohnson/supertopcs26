"use client";

import React from "react";

interface MemberHeaderProps {
  tokens?: number;
  initials?: string;
}

export function MemberHeader({ tokens = 3242, initials = "BJ" }: MemberHeaderProps) {
  return (
    <nav className="w-full px-2 py-4 flex justify-between items-center border-b border-white/5 relative z-10 backdrop-blur-sm">
      {/* Logo */}
      <a href="/" className="flex items-center gap-3">
        <img src="/logo-supertopics.svg" alt="Super Topics" className="h-14 w-auto" />
        <span className="font-bold tracking-tight" style={{ fontSize: '1.468rem', color: '#D6DBE6' }}>Super Topics</span>
      </a>

      {/* Right side: Tokens + User */}
      <div className="flex items-center gap-4">
        {/* Tokens pill with user circle - placeholder for future dropdown */}
        <button className="pl-5 pr-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center gap-3 shadow-inner hover:border-white/20 transition-all group">
          <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{tokens} tokens</span>
          <div className="rounded-full bg-[#1A2754] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#1A2754]/30" style={{ width: '39px', height: '39px' }}>
            {initials}
          </div>
        </button>
        
        {/* Placeholder for future dropdown menu */}
        {/* <UserDropdown /> */}
      </div>
    </nav>
  );
}

export default MemberHeader;
