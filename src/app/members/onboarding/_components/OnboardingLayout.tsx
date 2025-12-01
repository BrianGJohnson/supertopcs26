"use client";

import React, { ReactNode } from "react";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { PageShell } from "@/components/layout/PageShell";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps 
}: OnboardingLayoutProps) {
  return (
    <PageShell>
      <div className="flex flex-col gap-8 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <MemberHeader />

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNumber = i + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div
                key={i}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${isActive 
                    ? "bg-[#2BD899] scale-125 shadow-[0_0_12px_rgba(43,216,153,0.5)]" 
                    : isCompleted 
                      ? "bg-[#2BD899]/60" 
                      : "bg-white/20"
                  }
                `}
              />
            );
          })}
        </div>

        {/* Step indicator text */}
        <p className="text-center text-white/40 text-sm font-medium tracking-wide -mt-4">
          Step {currentStep} of {totalSteps}
        </p>

        {/* Content */}
        <div className="mt-2">
          {children}
        </div>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 mt-4">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
