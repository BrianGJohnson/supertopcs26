import React from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";

export default function RefinePage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconAdjustmentsHorizontal}
          line1="Refine Your Topic List"
          line2="Score & Clean"
          description="Shortlist around 100 phrases before scoring."
        />
        <BuilderStepper activeStep={2} />
      </div>
    </PageShell>
  );
}
