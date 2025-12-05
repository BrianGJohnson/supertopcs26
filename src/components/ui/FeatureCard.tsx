"use client";

import React from "react";
import { type Icon } from "@tabler/icons-react";

/**
 * FeatureCard Component
 * 
 * A polished card component with colored accent, icon, title, and description.
 * Use across the app for feature highlights, benefits, settings sections, etc.
 * 
 * @example
 * <FeatureCard
 *   icon={IconRocket}
 *   color="#00D4FF"
 *   title="Fast Performance"
 *   description="Lightning fast load times with optimized caching."
 *   highlight="lightning fast"
 * />
 */

export type FeatureCardColor = 
  | "#00D4FF"   // Cyan - personalization, customization
  | "#FF4444"   // Red - YouTube, video, media
  | "#2BD899"   // Green - growth, success, learning
  | "#7A5CFA"   // Purple - AI, intelligence, premium
  | "#FFB020"   // Orange/Gold - monetization, money
  | "#3B82F6"   // Blue - data, analytics, info
  | string;     // Custom color

interface FeatureCardProps {
  /** Tabler icon component */
  icon: Icon;
  /** Accent color for border, icon background, and glow */
  color: FeatureCardColor;
  /** Card title */
  title: string;
  /** Card description - can include React nodes for highlights */
  description: React.ReactNode;
  /** Optional: text to highlight (will be bolded with higher opacity) */
  highlight?: string;
  /** Optional: custom className for the card container */
  className?: string;
}

export function FeatureCard({
  icon: IconComponent,
  color,
  title,
  description,
  highlight,
  className = "",
}: FeatureCardProps) {
  // Process description to highlight text if provided
  const processedDescription = React.useMemo(() => {
    if (!highlight || typeof description !== "string") {
      return description;
    }
    
    const parts = description.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="text-white/90 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  }, [description, highlight]);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl 
        bg-gradient-to-br from-white/[0.05] to-white/[0.02] 
        border border-white/[0.08] border-l-[3px] 
        p-8 transition-all duration-300 
        hover:border-white/12 
        hover:bg-gradient-to-br hover:from-white/[0.06] hover:to-white/[0.03] 
        hover:translate-x-1
        ${className}
      `}
      style={{
        borderLeftColor: `${color}99`, // 60% opacity
        // @ts-ignore - CSS custom property for hover effects
        "--card-color": color,
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget;
        target.style.borderLeftColor = `${color}E6`; // 90% opacity
        target.style.boxShadow = `0 0 30px ${color}14`; // 8% opacity glow
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget;
        target.style.borderLeftColor = `${color}99`; // 60% opacity
        target.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start gap-5">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ring-1"
          style={{
            backgroundColor: `${color}33`, // 20% opacity
            // @ts-ignore
            "--tw-ring-color": `${color}33`, // 20% opacity ring
          }}
        >
          <IconComponent size={28} style={{ color }} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white/90">{title}</h3>
          <p className="text-lg text-white/60 leading-relaxed">
            {processedDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * FeatureCardGrid Component
 * 
 * Wrapper component for consistent spacing between FeatureCards.
 * 
 * @example
 * <FeatureCardGrid>
 *   <FeatureCard ... />
 *   <FeatureCard ... />
 * </FeatureCardGrid>
 */

interface FeatureCardGridProps {
  children: React.ReactNode;
  /** Optional: custom className */
  className?: string;
  /** Optional: max width constraint (default: max-w-2xl) */
  maxWidth?: string;
}

export function FeatureCardGrid({
  children,
  className = "",
  maxWidth = "max-w-2xl",
}: FeatureCardGridProps) {
  return (
    <div className={`space-y-8 ${maxWidth} mx-auto ${className}`}>
      {children}
    </div>
  );
}

/**
 * Preset color constants for common use cases
 */
export const FEATURE_CARD_COLORS = {
  cyan: "#00D4FF",      // Personalization, customization
  red: "#FF4444",       // YouTube, video, media
  green: "#2BD899",     // Growth, success, learning
  purple: "#7A5CFA",    // AI, intelligence, premium
  orange: "#FFB020",    // Monetization, money
  blue: "#3B82F6",      // Data, analytics, info
} as const;
