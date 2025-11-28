"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation links configuration
const NAV_LINKS = [
  { label: "Dashboard", href: "/members/dashboard" },
  { label: "Builder", href: "/members/build/seed" },
  { label: "Sessions", href: "/members/sessions" },
  { label: "Account", href: "/members/account" },
];

interface MemberHeaderProps {
  tokens?: number;
  initials?: string;
}

export function MemberHeader({ tokens = 3242, initials = "BJ" }: MemberHeaderProps) {
  const pathname = usePathname();
  
  // Check if a nav link is active (exact match or starts with for nested routes)
  const isActive = (href: string) => {
    if (href === "/members/build/seed") {
      // Builder matches any /members/build/* route
      return pathname?.startsWith("/members/build");
    }
    return pathname === href;
  };

  return (
    <nav className="w-full px-2 py-4 flex justify-between items-center border-b border-white/5 relative z-10 backdrop-blur-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        <img src="/logo-supertopics.svg" alt="Super Topics" className="h-14 w-auto" />
        <span className="font-bold tracking-tight" style={{ fontSize: '1.468rem', color: '#D6DBE6' }}>Super Topics</span>
      </Link>

      {/* Center Navigation */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
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
