"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewModeToggle } from "@/components/ui/ViewModeToggle";
import { useDisplayMode } from "@/hooks/useDisplayMode";

// Navigation links configuration
const NAV_LINKS = [
  { label: "Dashboard", href: "/members/dashboard" },
  { label: "Builder", href: "/members/build/target" },
  { label: "Sessions", href: "/members/sessions" },
  { label: "Account", href: "/members/account" },
];

interface MemberHeaderProps {
  tokens?: number;
  initials?: string;
}

export function MemberHeader({ tokens = 3242, initials = "BJ" }: MemberHeaderProps) {
  const pathname = usePathname();
  const { mode, setMode } = useDisplayMode();
  
  // Check if a nav link is active (exact match or starts with for nested routes)
  const isActive = (href: string) => {
    if (href === "/members/build/seed") {
      // Builder matches any /members/build/* route
      return pathname?.startsWith("/members/build");
    }
    return pathname === href;
  };

  return (
    <nav className="w-full px-4 py-4 flex items-center border-b border-white/5 relative z-10 backdrop-blur-sm">
      {/* Left side: Logo - fixed width for balance */}
      <div className="flex-1 flex items-center">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-supertopics.svg" alt="Super Topics" className="h-14 w-auto" />
          <span className="font-bold tracking-tight" style={{ fontSize: '1.468rem', color: '#D6DBE6' }}>Super Topics</span>
        </Link>
      </div>

      {/* Center Navigation */}
      <div className="flex items-center gap-8">
        {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                px-4 py-2 rounded-lg text-[15px] font-medium transition-all
                ${isActive(link.href)
                  ? "text-white/70 bg-white/[0.04]"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                }
              `}
            >
              {link.label}
            </Link>
        ))}
      </div>

      {/* Right side: Tokens + View Toggle + User - fixed width for balance */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {/* Tokens pill */}
        <div className="px-4 py-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 shadow-inner">
          <span className="text-sm font-bold text-gray-200">{tokens} tokens</span>
        </div>
        
        {/* View Mode Toggle */}
        <ViewModeToggle mode={mode} onModeChange={setMode} />
        
        {/* User initials circle */}
        <div className="rounded-full bg-[#1A2754] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#1A2754]/30 cursor-pointer hover:bg-[#243470] transition-colors" style={{ width: '39px', height: '39px' }}>
          {initials}
        </div>
      </div>
    </nav>
  );
}

export default MemberHeader;
