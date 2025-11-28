"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/lib/supabase";
import { IconBrandGoogle } from "@tabler/icons-react";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        {/* Public Header */}
        <nav className="w-full px-2 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-white/5 relative z-10 backdrop-blur-sm gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-supertopics.svg" alt="Super Topics" className="h-14 w-auto" />
            <span className="font-bold tracking-tight" style={{ fontSize: '1.468rem', color: '#D6DBE6' }}>Super Topics</span>
          </Link>

          {/* Nav Links + Login */}
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              About
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 text-sm font-bold text-gray-200 hover:text-white hover:border-white/20 transition-all"
            >
              Login
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-0 mt-8 md:mt-12">
          <h1 className="text-[3.4rem] md:text-[4.2rem] font-extrabold text-white tracking-tight drop-shadow-lg leading-[1.22]">
            Log In
          </h1>
          <p className="text-[1.5rem] text-text-secondary font-light mt-[20px] max-w-2xl mx-auto">
            Access your tools and super topic sessions.
          </p>
          <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-gray-500 to-transparent opacity-40 mt-8"></div>
        </div>

        {/* Google Login Button */}
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full px-8 py-4 bg-gradient-to-b from-[#1E2A38] to-[#151D28] hover:from-[#243040] hover:to-[#1A2530] text-[#A8C4E0] border border-[#4A5568]/60 rounded-xl font-bold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-center gap-3"
          >
            <IconBrandGoogle size={24} className="text-white" />
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
