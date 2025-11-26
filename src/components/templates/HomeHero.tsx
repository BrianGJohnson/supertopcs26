import React from "react";

interface HomeHeroProps {
  title?: string;
  subtitle?: string;
  primaryButtonLabel?: string;
  primaryButtonHref?: string;
  onPrimaryClick?: () => void;
  secondaryButtonLabel?: string;
  secondaryButtonHref?: string;
  onSecondaryClick?: () => void;
}

export function HomeHero({
  title = "Stop Guessing. Start Growing.",
  subtitle = "You've heard it before. If they don't click, they don't watch. If they don't watch, you can't grow. The simplest path to YouTube success is identifying a great topic, a Super Topic.",
  primaryButtonLabel = "Get Started",
  primaryButtonHref = "#",
  onPrimaryClick,
  secondaryButtonLabel,
  secondaryButtonHref = "#",
  onSecondaryClick,
}: HomeHeroProps) {
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-6 max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {onPrimaryClick ? (
          <button
            onClick={onPrimaryClick}
            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
          >
            {primaryButtonLabel}
          </button>
        ) : (
          <a
            href={primaryButtonHref}
            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
          >
            {primaryButtonLabel}
          </a>
        )}
        
        {secondaryButtonLabel && (
          onSecondaryClick ? (
            <button
              onClick={onSecondaryClick}
              className="px-8 py-4 border-2 border-text-secondary hover:border-text-primary text-text-primary font-semibold rounded-lg transition-colors"
            >
              {secondaryButtonLabel}
            </button>
          ) : (
            <a
              href={secondaryButtonHref}
              className="px-8 py-4 border-2 border-text-secondary hover:border-text-primary text-text-primary font-semibold rounded-lg transition-colors"
            >
              {secondaryButtonLabel}
            </a>
          )
        )}
      </div>
    </section>
  );
}
