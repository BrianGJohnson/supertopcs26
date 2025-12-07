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
  IconSearch,
  IconChevronRight,
  IconActivity
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

        {/* Module Area - Pyramid Layout */}
        <div className="flex flex-col items-center justify-center gap-8 px-4 mt-8">

          {/* Row 1: The Centerpiece (Built for the Viewer) */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            onClick={() => router.push("/members/build/target")}
            className="flex flex-col items-center p-12 rounded-3xl bg-[#2BD899]/10 border-2 border-[#2BD899]/50 hover:border-[#2BD899] hover:bg-[#2BD899]/15 hover:shadow-[0_0_50px_rgba(43,216,153,0.3)] transition-all group w-full max-w-2xl relative overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#2BD899]/50 to-transparent opacity-50" />

            <div className="w-28 h-28 rounded-2xl bg-[#2BD899]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(43,216,153,0.15)]">
              <IconTarget size={62} className="text-[#2BD899]" />
            </div>
            <h3 className="font-bold text-3xl text-white mb-4">Built for the Viewer</h3>
            <p className="text-white/70 text-center text-xl leading-relaxed mb-6 max-w-lg">
              Create video packages designed to win. Expand your seed topic, find the perfect angle, and craft a powerful title & thumbnail.
            </p>
            <div className="mt-auto flex items-center gap-3 px-8 py-3 rounded-full bg-[#2BD899]/10 border-2 border-[#2BD899]/30 text-[#2BD899] text-lg font-bold group-hover:bg-[#2BD899] group-hover:text-[#0B1220] transition-all">
              <span>Start Building</span>
              <IconChevronRight size={24} />
            </div>
          </motion.button>

          {/* Row 2: The Toolkit (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">

            {/* Just Born Topics - Left Card (Coming Soon) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center p-8 rounded-2xl bg-[#F59E0B]/10 border-2 border-[#F59E0B]/30 h-[420px] opacity-80 cursor-not-allowed relative hover:bg-[#F59E0B]/15 transition-all"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#F59E0B]/20 flex items-center justify-center mb-6 mt-8">
                <IconPlant2 size={40} className="text-[#F59E0B]" />
              </div>
              <h3 className="font-bold text-xl text-white mb-3">Just Born</h3>
              <p className="text-white/70 text-center text-lg leading-relaxed mb-4">
                Topics that just hit the internet. Catch the wave early.
              </p>
              <div className="mt-auto px-5 py-2 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                <span className="text-[#F59E0B] text-sm font-bold uppercase tracking-wide">Coming Soon</span>
              </div>
            </motion.div>

            {/* Topic Deep Dive - Center Card (Active) */}
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={() => router.push("/members/deep")}
              className="flex flex-col items-center p-8 rounded-2xl bg-[#7A5CFA]/10 border-2 border-[#7A5CFA]/30 hover:border-[#7A5CFA] hover:bg-[#7A5CFA]/20 hover:shadow-[0_0_30px_rgba(122,92,250,0.25)] h-[420px] relative group transition-all"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#7A5CFA]/20 flex items-center justify-center mb-6 mt-8 group-hover:scale-110 transition-transform">
                <IconSearch size={40} className="text-[#7A5CFA]" />
              </div>
              <h3 className="font-bold text-xl text-white mb-3">Topic Deep Dive</h3>
              <p className="text-white/70 text-center text-lg leading-relaxed mb-6">
                Deep dive into any topic. Check demand, competition, and opportunities.
              </p>
              <div className="mt-auto px-5 py-2 rounded-full border border-[#7A5CFA]/30 text-[#7A5CFA] bg-[#7A5CFA]/10 group-hover:bg-[#7A5CFA] group-hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
                <span>Start Analysis</span>
                <IconChevronRight size={16} />
              </div>
            </motion.button>

            {/* Niche Pulse - Right Card (Coming Soon) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col items-center p-8 rounded-2xl bg-[#06B6D4]/10 border-2 border-[#06B6D4]/30 h-[420px] opacity-80 cursor-not-allowed relative hover:bg-[#06B6D4]/15 transition-all"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#06B6D4]/20 flex items-center justify-center mb-6 mt-8">
                <IconActivity size={40} className="text-[#06B6D4]" />
              </div>
              <h3 className="font-bold text-xl text-white mb-3">Niche Pulse</h3>
              <p className="text-white/70 text-center text-lg leading-relaxed mb-4">
                Monitor your niche&apos;s health and spot monetization trends.
              </p>
              <div className="mt-auto px-5 py-2 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20">
                <span className="text-[#06B6D4] text-sm font-bold uppercase tracking-wide">Coming Soon</span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Tip Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-white/40 text-sm">
            💡 <span className="text-white/50">Pro tip:</span> Use <span className="text-[#7A5CFA]">Topic Deep Dive</span> to validate your ideas, then build them in <span className="text-[#2BD899]">Built for the Viewer</span>.
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
