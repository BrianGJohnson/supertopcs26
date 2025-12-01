"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { 
  IconHome, 
  IconTarget,
  IconPlant2,
  IconSatellite,
  IconChevronRight
} from "@tabler/icons-react";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />

        <HeroModule
          icon={IconHome}
          line1="Welcome Back To"
          line2="Super Topics"
          description="Your central hub to create winning videos, discover trending topics, and monitor your niche."
        />

        {/* Module Cards - 3 Column Layout */}
        <div className="flex items-end justify-center gap-8 px-4 mt-8">
          
          {/* Just Born Topics - Left Card (Coming Soon) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border-2 border-white/10 w-[312px] h-[408px] opacity-50 cursor-not-allowed relative"
          >
            {/* Coming Soon Badge */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30">
              <span className="text-[#F59E0B] text-xs font-medium uppercase tracking-wide">Coming Soon</span>
            </div>
            
            <div className="w-24 h-24 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 mt-8">
              <IconPlant2 size={52} className="text-white/30" />
            </div>
            <h3 className="font-bold text-2xl text-white/40 mb-3">Just Born</h3>
            <p className="text-white/30 text-center text-[1.05rem] leading-relaxed mb-4">
              Topics that just hit the internet. Catch the wave early.
            </p>
            <div className="mt-auto px-4 py-2 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/25">
              <span className="text-[#F59E0B]/70 text-sm font-medium">Coming Soon</span>
            </div>
          </motion.div>

          {/* Built for the Viewer - Center Card (FEATURED - 15% taller, 5% wider) */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onClick={() => router.push("/members/build/target")}
            className="flex flex-col items-center p-12 rounded-2xl bg-[#2BD899]/15 border-2 border-[#2BD899]/50 hover:border-[#2BD899] hover:bg-[#2BD899]/20 hover:shadow-[0_0_40px_rgba(43,216,153,0.25)] transition-all group w-[336px] h-[468px]"
          >
            <div className="w-28 h-28 rounded-2xl bg-[#2BD899]/25 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <IconTarget size={62} className="text-[#2BD899]" />
            </div>
            <h3 className="font-bold text-2xl text-white mb-3">Built for the Viewer</h3>
            <p className="text-white/60 text-center text-xl leading-relaxed mb-4">
              Create video packages designed to win. Start with your pillars and build a Super Topic.
            </p>
            <div className="mt-auto flex items-center gap-2 text-[#2BD899] text-base font-semibold group-hover:gap-3 transition-all">
              <span>Start Building</span>
              <IconChevronRight size={20} />
            </div>
          </motion.button>

          {/* Niche Pulse - Right Card (Coming Soon) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border-2 border-white/10 w-[312px] h-[408px] opacity-50 cursor-not-allowed relative"
          >
            {/* Coming Soon Badge */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#7A5CFA]/20 border border-[#7A5CFA]/30">
              <span className="text-[#7A5CFA] text-xs font-medium uppercase tracking-wide">Coming Soon</span>
            </div>
            
            <div className="w-24 h-24 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 mt-8">
              <IconSatellite size={52} className="text-white/30" />
            </div>
            <h3 className="font-bold text-2xl text-white/40 mb-3">Niche Pulse</h3>
            <p className="text-white/30 text-center text-[1.05rem] leading-relaxed mb-4">
              See what&apos;s actually trending in your niche. Real-time intel from across the web.
            </p>
            <div className="mt-auto px-4 py-2 rounded-full bg-[#7A5CFA]/15 border border-[#7A5CFA]/25">
              <span className="text-[#7A5CFA]/70 text-sm font-medium">Coming Soon</span>
            </div>
          </motion.div>

        </div>

        {/* Tip Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-white/40 text-sm">
            💡 <span className="text-white/50">Pro tip:</span> Use <span className="text-[#7A5CFA]">Niche Pulse</span> to discover what&apos;s trending, then build it in <span className="text-[#2BD899]">Built for the Viewer</span>.
          </p>
        </motion.div>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-t border-white/[0.07] pt-5 pb-4 mt-4">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
