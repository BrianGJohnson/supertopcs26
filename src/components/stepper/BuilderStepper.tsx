"use client";

import React from "react";
import Link from "next/link";
import {
  IconTarget,
  IconSeedling,
  IconSparkles,
  IconDiamond,
  IconPencil,
  IconPackage,
  IconUpload,
  IconCheck,
} from "@tabler/icons-react";

/**
 * BuilderStepper - Reusable progress stepper for the Builder flow
 * 
 * VISUAL SPECIFICATIONS (matches OnboardingStepper with icons):
 * - Container: max-w-4xl, px-4, py-4
 * - Bar: top-10, left-12 right-12, h-[1px], white/15
 * - Circles: w-12 h-12, ring-4 ring-background, border-2 border-white/20
 * - Active: bg-[#1A2754], text-white, shadow glow, icon
 * - Completed: bg-primary/80, checkmark icon
 * - Inactive: bg-surface, text-text-secondary, opacity-70, icon
 * - Labels: text-[10px] md:text-xs, font-light, uppercase, tracking-widest
 */

const STEPS = [
  { label: "Target", href: "/members/build/target", icon: IconTarget },
  { label: "Seed", href: "/members/build/seed", icon: IconSeedling },
  { label: "Refine", href: "/members/build/refine", icon: IconSparkles },
  { label: "Super", href: "/members/build/super", icon: IconDiamond },
  { label: "Title", href: "/members/build/title", icon: IconPencil },
  { label: "Package", href: "/members/build/package", icon: IconPackage },
  { label: "Upload", href: "/members/build/upload", icon: IconUpload },
] as const;

interface BuilderStepperProps {
  /** The active step number (1-indexed: 1 = Target, 2 = Seed, etc.) */
  activeStep: number;
  /** Completed steps (array of step numbers that are done) */
  completedSteps?: number[];
}

export function BuilderStepper({ activeStep, completedSteps = [] }: BuilderStepperProps) {
  // Determine which steps are accessible (completed + current)
  const isAccessible = (stepNumber: number) => {
    return stepNumber <= activeStep || completedSteps.includes(stepNumber);
  };

  return (
    <div className="flex justify-between items-start relative max-w-4xl mx-auto w-full px-4 py-4 mt-2">
      {/* Progress Bar - Centered through circles */}
      <div className="absolute top-10 left-12 right-12 h-[1px] bg-white/15 -z-10"></div>
      
      {/* Completed portion of progress bar */}
      {activeStep > 1 && (
        <div 
          className="absolute top-10 left-12 h-[1px] bg-primary/60 -z-10 transition-all duration-500"
          style={{ 
            width: `calc(${((activeStep - 1) / (STEPS.length - 1)) * 100}% - 1.5rem)` 
          }}
        ></div>
      )}
      
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        const isCompleted = completedSteps.includes(stepNumber) || stepNumber < activeStep;
        const Icon = step.icon;
        const canNavigate = isAccessible(stepNumber) && !isActive;
        
        const stepContent = (
          <div 
            className={`flex flex-col items-center gap-3 transition-all ${
              isActive ? "" : isCompleted ? "opacity-90" : "opacity-70"
            } ${canNavigate ? "cursor-pointer hover:opacity-100" : "cursor-default"}`}
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
        if (canNavigate) {
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
