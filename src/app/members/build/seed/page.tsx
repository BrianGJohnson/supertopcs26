import React from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconSeedling } from "@tabler/icons-react";
import { SeedCard } from "./_components/SeedCard";
import { Step1Card } from "./_components/Step1Card";
import { TopicsTable } from "./_components/TopicsTable";

export default function SeedPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconSeedling}
          line1="Create Your Next Winning"
          line2="Video Package"
          description="Click Top 10 to start expanding your seed topic. Each save unlocks the next tool. Complete all four to fully map your topic."
        />
        <BuilderStepper activeStep={1} />
        <SeedCard />
        <Step1Card />
        <TopicsTable />

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
