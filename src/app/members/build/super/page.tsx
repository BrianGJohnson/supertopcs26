import React, { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconTrophy } from "@tabler/icons-react";
import { SuperPageContent } from "./_components/SuperPageContent";

// Loading fallback
function PageLoadingFallback() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-64 bg-white/5 rounded-3xl"></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-48 bg-white/5 rounded-2xl"></div>
        <div className="h-48 bg-white/5 rounded-2xl"></div>
        <div className="h-48 bg-white/5 rounded-2xl"></div>
      </div>
    </div>
  );
}

export default function SuperPage() {
  return (
    <PageShell>
      <div className="flex flex-col relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        {/* Header */}
        <div className="mb-8">
          <MemberHeader />
        </div>

        {/* Hero Section */}
        <div className="mb-10">
          <HeroModule
            icon={IconTrophy}
            line1="Your Winning Video"
            line2="Lock & Proceed"
            description="Review your top candidates and lock in your winner."
          />
        </div>

        {/* Progress Stepper */}
        <div className="mb-14">
          <BuilderStepper activeStep={4} />
        </div>

        {/* Main Content */}
        <Suspense fallback={<PageLoadingFallback />}>
          <SuperPageContent />
        </Suspense>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-8 pb-5 mt-8">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
