import React, { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconFlask } from "@tabler/icons-react";
import { TitlePageContent } from "./_components/TitlePageContent";

export default function TitlePage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconFlask}
          line1="Crazy Creative Titles"
          line2="Win The Click"
          description="No, for real. That's how we get incredible results."
        />
        <BuilderStepper activeStep={5} />

        {/* Main Content */}
        <Suspense fallback={<div className="text-white/50">Loading...</div>}>
          <TitlePageContent />
        </Suspense>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
