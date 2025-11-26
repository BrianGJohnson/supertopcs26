import React from "react";

/**
 * BuilderStepper - Reusable progress stepper for the Builder flow
 * 
 * VISUAL SPECIFICATIONS (LOCKED):
 * - Container: max-w-3xl, px-4, py-4, -mt-4
 * - Bar: top-10, left-16 right-16, h-[1px], Midnight Blue (#1A2754)
 * - Circles: w-12 h-12, ring-4 ring-background, border-2 border-white/20
 * - Active: bg-[#1A2754], text-white, shadow glow
 * - Inactive: bg-surface, text-text-secondary, opacity-60
 * - Labels: text-[10px] md:text-xs, font-light, uppercase, tracking-widest
 * - Active label: text-white/75 with drop-shadow
 */

const STEPS = [
  { label: "Seed" },
  { label: "Refine" },
  { label: "Super" },
  { label: "Title" },
  { label: "Package" },
  { label: "Upload" },
] as const;

interface BuilderStepperProps {
  /** The active step number (1-indexed: 1 = Seed, 2 = Refine, etc.) */
  activeStep: number;
}

export function BuilderStepper({ activeStep }: BuilderStepperProps) {
  return (
    <div className="flex justify-between items-start relative max-w-3xl mx-auto w-full px-4 py-4 -mt-4">
      {/* Progress Bar - Centered through circles (top-10 = 1rem padding + 1.5rem half-circle) */}
      <div className="absolute top-10 left-16 right-16 h-[1px] bg-[#1A2754] -z-10"></div>
      
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        
        return (
          <div 
            key={step.label} 
            className={`flex flex-col items-center gap-3 ${isActive ? "" : "opacity-60"}`}
          >
            {/* Step Circle */}
            {isActive ? (
              <div className="w-12 h-12 rounded-full bg-[#1A2754] text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(26,39,84,0.4)] ring-4 ring-background border-2 border-white/20 z-10">
                {stepNumber}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface border-2 border-white/20 text-text-secondary flex items-center justify-center font-medium ring-4 ring-background z-10">
                {stepNumber}
              </div>
            )}
            
            {/* Step Label */}
            <span 
              className={`text-[10px] md:text-xs font-light uppercase tracking-widest ${
                isActive 
                  ? "text-white/75 drop-shadow-[0_0_10px_rgba(26,39,84,0.5)]" 
                  : "text-text-secondary"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
