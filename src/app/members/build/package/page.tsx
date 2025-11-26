import React from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconPackage } from "@tabler/icons-react";

export default function PackagePage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconPackage}
          line1="Build a Strong"
          line2="Video Package"
          description="Combine topic, title, and thumbnail thinking into one strategy."
        />
        <BuilderStepper activeStep={5} />
      </div>
    </PageShell>
  );
}
