"use client";

import React from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { IconUser, IconStar, IconSettings, IconCreditCard } from "@tabler/icons-react";

export default function AccountPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconUser}
          line1="Your Super Topics"
          line2="Account"
          description="Manage your profile, view your saved Super Topics, and customize your settings."
        />

        {/* Account Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl hover:border-white/20 transition-all group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#4A90D9]/10 border border-[#4A90D9]/20">
                <IconUser size={28} className="text-[#4A90D9]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Profile</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  Update your name, email, and profile picture.
                </p>
                <button className="text-[#4A90D9] text-sm font-medium hover:text-[#4A90D9]/80 transition-colors">
                  Edit Profile →
                </button>
              </div>
            </div>
          </div>

          {/* Super Topics Card */}
          <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl hover:border-white/20 transition-all group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#4DD68A]/10 border border-[#4DD68A]/20">
                <IconStar size={28} className="text-[#4DD68A]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Super Topics</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  View all your finalist keyword phrases across sessions.
                </p>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#4DD68A]/10 border border-[#4DD68A]/20 rounded-full text-[#4DD68A] text-sm font-medium">
                    0 saved
                  </span>
                  <button className="text-[#4DD68A] text-sm font-medium hover:text-[#4DD68A]/80 transition-colors">
                    View All →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl hover:border-white/20 transition-all group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#FF8A3D]/10 border border-[#FF8A3D]/20">
                <IconSettings size={28} className="text-[#FF8A3D]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  Preferences, notifications, and account options.
                </p>
                <button className="text-[#FF8A3D] text-sm font-medium hover:text-[#FF8A3D]/80 transition-colors">
                  Manage Settings →
                </button>
              </div>
            </div>
          </div>

          {/* Billing Card */}
          <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl hover:border-white/20 transition-all group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#39C7D8]/10 border border-[#39C7D8]/20">
                <IconCreditCard size={28} className="text-[#39C7D8]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Billing & Tokens</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  Manage subscription, purchase tokens, view history.
                </p>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#39C7D8]/10 border border-[#39C7D8]/20 rounded-full text-[#39C7D8] text-sm font-medium">
                    3,242 tokens
                  </span>
                  <button className="text-[#39C7D8] text-sm font-medium hover:text-[#39C7D8]/80 transition-colors">
                    Manage →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
