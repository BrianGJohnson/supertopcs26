import React from "react";
import { IconProps } from "@tabler/icons-react";

/**
 * HeroModule - Reusable hero section for members-only pages
 * 
 * HEADLINE RULES:
 * - Total: 6-7 words
 * - Line 1: 3-4 words (white text)
 * - Line 2: 2-3 words (gradient text)
 * - Always two lines, never collapse
 * 
 * SPACING VALUES (LOCKED):
 * - Container: mt-[-22px]
 * - Icon wrapper: mb-[-38px]
 * - Icon size: 100px
 * - h1 leading: 1.22
 * - Line 2 span: mt-0, pb-[0.15em]
 * - Description: mt-[20px], text-[1.5rem]
 * - Divider: mt-4, opacity-40
 */

interface HeroModuleProps {
  /** Tabler icon component to display */
  icon: React.ComponentType<IconProps>;
  /** First line of headline (3-4 words, white text) */
  line1: string;
  /** Second line of headline (2-3 words, gradient text) */
  line2: string;
  /** Single sentence description below headline */
  description: string;
}

export function HeroModule({ icon: Icon, line1, line2, description }: HeroModuleProps) {
  // Validate headline word counts (warning only, does not break render)
  if (process.env.NODE_ENV === "development") {
    const line1Words = line1.trim().split(/\s+/).length;
    const line2Words = line2.trim().split(/\s+/).length;
    const totalWords = line1Words + line2Words;

    if (line1Words < 3 || line1Words > 4) {
      console.warn(`HeroModule: line1 should have 3-4 words, got ${line1Words}`);
    }
    if (line2Words < 2 || line2Words > 3) {
      console.warn(`HeroModule: line2 should have 2-3 words, got ${line2Words}`);
    }
    if (totalWords < 6 || totalWords > 7) {
      console.warn(`HeroModule: total headline should have 6-7 words, got ${totalWords}`);
    }
  }

  return (
    <div className="text-center flex flex-col items-center gap-0 mt-[-22px]">
      {/* Icon Container - LOCKED SPACING */}
      <div className="relative mb-[-38px]">
        {/* Ambient glow behind icon */}
        <div className="absolute -inset-6 bg-primary/8 blur-2xl rounded-full"></div>
        {/* Icon wrapper with fixed dimensions */}
        <div className="w-36 h-36 rounded-full flex items-center justify-center relative z-10">
          <Icon 
            size={100} 
            strokeWidth={1.5} 
            className="text-primary drop-shadow-[0_0_8px_rgba(122,92,250,0.25)]" 
          />
        </div>
      </div>

      {/* Headline Block - LOCKED SPACING */}
      <div>
        <h1 className="text-[3.4rem] md:text-[4.2rem] font-extrabold text-white tracking-tight drop-shadow-lg leading-[1.22]">
          {/* Line 1: White text, always on its own line */}
          {line1}
          <br />
          {/* Line 2: Gradient text, never collapses */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mt-0 pb-[0.15em] inline-block whitespace-nowrap">
            {line2}
          </span>
        </h1>

        {/* Description - LOCKED SPACING */}
        <p className="text-[1.5rem] text-text-secondary font-light mt-[20px] max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      {/* Divider - LOCKED STYLING */}
      <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-gray-500 to-transparent opacity-40 mt-4"></div>
    </div>
  );
}
