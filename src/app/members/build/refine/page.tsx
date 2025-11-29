import React, { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { RefinePageContent } from "./_components/RefinePageContent";

// Loading fallback
function PageLoadingFallback() {
  return (
    <PageShell>
      <div className="flex flex-col gap-8 relative z-10 max-w-5xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <MemberHeader />
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/5 rounded-3xl"></div>
          <div className="h-12 bg-white/5 rounded-xl"></div>
          <div className="h-12 bg-white/5 rounded-xl"></div>
          <div className="h-96 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    </PageShell>
  );
}

export default function RefinePage() {
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
            icon={IconAdjustmentsHorizontal}
            line1="Refine Your Topic List"
            line2="Score & Select"
            description="Analyze, filter, and select your best video opportunities."
          />
        </div>
        
        {/* Progress Stepper */}
        <div className="mb-14">
          <BuilderStepper activeStep={2} />
        </div>

        {/* Main Content */}
        <Suspense fallback={<PageLoadingFallback />}>
          <RefinePageContent />
        </Suspense>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-8 pb-5 mt-8">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
