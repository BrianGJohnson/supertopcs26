"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconRocket,
  IconTarget,
  IconCash,
  IconBulb,
  IconChartBar,
  IconUsers,
  IconCheck,
} from "@tabler/icons-react";

/**
 * OnboardingStepper - Horizontal progress stepper for Onboarding flow
 * 
 * VISUAL SPECIFICATIONS (matches BuilderStepper):
 * - Container: max-w-4xl, px-4, py-4
 * - Bar: top-10, left-16 right-16, h-[1px], Midnight Blue (#1A2754)
 * - Circles: w-12 h-12, ring-4 ring-background, border-2 border-white/20
 * - Active: bg-[#1A2754], text-white, shadow glow
 * - Completed: bg-primary, checkmark icon
 * - Inactive: bg-surface, text-text-secondary, opacity-60
 * - Labels: text-[10px] md:text-xs, font-light, uppercase, tracking-widest
 */

const STEPS = [
  { label: "Welcome", href: "/members/onboarding/step-1", icon: IconRocket },
  { label: "Goals", href: "/members/onboarding/step-2", icon: IconTarget },
  { label: "Money", href: "/members/onboarding/step-3", icon: IconCash },
  { label: "Niche", href: "/members/onboarding/step-4", icon: IconBulb },
  { label: "Pillars", href: "/members/onboarding/step-5", icon: IconChartBar },
  { label: "Audience", href: "/members/onboarding/step-6", icon: IconUsers },
] as const;

interface OnboardingStepperProps {
  /** The active step number (1-indexed: 1 = Welcome, 2 = Goals, etc.) */
  activeStep: number;
  /** Completed steps (array of step numbers that are done) */
  completedSteps?: number[];
}

export function OnboardingStepper({ activeStep, completedSteps = [] }: OnboardingStepperProps) {
  const pathname = usePathname();
  
  // Determine which steps are accessible (completed + current)
  const isAccessible = (stepNumber: number) => {
    return stepNumber <= activeStep || completedSteps.includes(stepNumber);
  };

  return (
    <div className="flex justify-between items-start relative max-w-4xl mx-auto w-full px-4 py-4 mt-6">
      {/* Progress Bar - Centered through circles */}
      <div className="absolute top-10 left-16 right-16 h-[1px] bg-white/15 -z-10"></div>
      
      {/* Completed portion of progress bar */}
      {activeStep > 1 && (
        <div 
          className="absolute top-10 left-16 h-[1px] bg-primary/60 -z-10 transition-all duration-500"
          style={{ 
            width: `calc(${((activeStep - 1) / (STEPS.length - 1)) * 100}% - 2rem)` 
          }}
        ></div>
      )}
      
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        const isCompleted = completedSteps.includes(stepNumber) || stepNumber < activeStep;
        const Icon = step.icon;
        const canNavigate = isAccessible(stepNumber);
        
        const stepContent = (
          <div 
            className={`flex flex-col items-center gap-3 transition-all ${
              isActive ? "" : isCompleted ? "opacity-90" : "opacity-70"
            } ${canNavigate ? "cursor-pointer" : "cursor-default"}`}
          >
            {/* Step Circle */}
            {isCompleted && !isActive ? (
              // Completed state
              <div className="w-12 h-12 rounded-full bg-primary/80 text-white flex items-center justify-center font-bold ring-4 ring-background border-2 border-primary/50 z-10">
                <IconCheck size={24} stroke={3} />
              </div>
            ) : isActive ? (
              // Active state
              <div className="w-12 h-12 rounded-full bg-[#1A2754] text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(26,39,84,0.5)] ring-4 ring-background border-2 border-white/20 z-10">
                <Icon size={24} stroke={1.5} />
              </div>
            ) : (
              // Inactive state
              <div className="w-12 h-12 rounded-full bg-surface border-2 border-white/10 text-text-secondary flex items-center justify-center font-medium ring-4 ring-background z-10">
                <Icon size={22} stroke={1.5} />
              </div>
            )}
            
            {/* Step Label */}
            <span 
              className={`text-[10px] md:text-xs font-light uppercase tracking-widest ${
                isActive 
                  ? "text-white/80 drop-shadow-[0_0_10px_rgba(26,39,84,0.5)]" 
                  : isCompleted
                    ? "text-primary/70"
                    : "text-text-secondary/60"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
        
        // Wrap in Link if accessible, otherwise just render
        if (canNavigate && !isActive) {
          return (
            <Link key={step.label} href={step.href}>
              {stepContent}
            </Link>
          );
        }
        
        return <div key={step.label}>{stepContent}</div>;
      })}
    </div>
  );
}

export default OnboardingStepper;
