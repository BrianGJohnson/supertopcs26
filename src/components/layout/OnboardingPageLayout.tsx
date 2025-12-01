"use client";

import React, { ReactNode } from "react";
import { IconProps } from "@tabler/icons-react";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { PageShell } from "@/components/layout/PageShell";
import { HeroModule } from "@/components/layout/HeroModule";
import { OnboardingStepper } from "@/components/stepper/OnboardingStepper";

/**
 * OnboardingPageLayout - Shared layout for all onboarding step pages
 * 
 * Provides consistent structure:
 * - PageShell (background, max-width)
 * - MemberHeader (logo, nav)
 * - OnboardingStepper (horizontal progress)
 * - HeroModule (icon, headline, description)
 * - Content area
 * - Footer
 */

interface OnboardingPageLayoutProps {
  /** Current step number (1-6) */
  currentStep: number;
  /** Array of completed step numbers */
  completedSteps?: number[];
  /** Icon for the HeroModule */
  icon: React.ComponentType<IconProps>;
  /** Line 1 of headline (3-4 words) */
  heroLine1: string;
  /** Line 2 of headline (2-3 words, gradient) */
  heroLine2: string;
  /** Description below headline */
  heroDescription: string;
  /** Page content */
  children: ReactNode;
}

export function OnboardingPageLayout({
  currentStep,
  completedSteps = [],
  icon,
  heroLine1,
  heroLine2,
  heroDescription,
  children,
}: OnboardingPageLayoutProps) {
  return (
    <PageShell>
      <div className="flex flex-col gap-6 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <MemberHeader />

        {/* Progress Stepper */}
        <OnboardingStepper 
          activeStep={currentStep} 
          completedSteps={completedSteps} 
        />

        {/* Hero Section */}
        <div className="mt-4">
          <HeroModule
            icon={icon}
            line1={heroLine1}
            line2={heroLine2}
            description={heroDescription}
          />
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-t border-white/[0.07] pt-5 pb-4 mt-8">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}

export default OnboardingPageLayout;
