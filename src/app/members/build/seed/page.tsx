"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconSeedling } from "@tabler/icons-react";
import { SeedCard } from "./_components/SeedCard";
import { Step1Card } from "./_components/Step1Card";
import { TopicsTable } from "./_components/TopicsTable";
import { getSeedsBySession } from "@/hooks/useSeedPhrases";
import type { Seed } from "@/types/database";

// Inner component that uses useSearchParams
function SeedPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  // Single source of truth for all seed data
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isExpanding, setIsExpanding] = useState(false);
  
  // Fetch all seeds for the session - SINGLE fetch used by all components
  const fetchSeeds = useCallback(async () => {
    if (!sessionId) {
      setSeeds([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await getSeedsBySession(sessionId);
      setSeeds(data);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error("Failed to load seeds:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);
  
  // Initial load
  useEffect(() => {
    fetchSeeds();
  }, [fetchSeeds]);
  
  // Callback for when phrases are added - just refetch
  const onPhrasesAdded = useCallback(() => {
    fetchSeeds();
  }, [fetchSeeds]);
  
  // Derived data for components
  const sourceCounts = {
    top10: seeds.filter(s => s.generation_method === "top10").length,
    child: seeds.filter(s => s.generation_method === "child").length,
    az: seeds.filter(s => s.generation_method === "az").length,
    prefix: seeds.filter(s => s.generation_method === "prefix").length,
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconSeedling}
          line1="Create Your Next Winning"
          line2="Video Package"
          description="Enter your topic and click Expand to discover what viewers want to watch. We'll find the best opportunities for your channel."
        />
        <BuilderStepper activeStep={2} />
        <SeedCard 
          onPhrasesAdded={onPhrasesAdded} 
          sourceCounts={sourceCounts}
          seeds={seeds}
          isExpanding={isExpanding}
          setIsExpanding={setIsExpanding}
        />
        <Step1Card 
          sessionId={sessionId}
          topicCount={seeds.length}
          sourceCounts={sourceCounts}
          isExpanding={isExpanding}
          hasSeedPhrase={seeds.some(s => s.generation_method === 'seed')}
        />
        <TopicsTable 
          seeds={seeds}
          isLoading={isLoading}
          maxRows={15}
        />

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}

// Loading fallback
function PageLoadingFallback() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <MemberHeader />
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-white/5 rounded-3xl"></div>
          <div className="h-48 bg-white/5 rounded-3xl"></div>
          <div className="h-64 bg-white/5 rounded-3xl"></div>
        </div>
      </div>
    </PageShell>
  );
}

export default function SeedPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <SeedPageContent />
    </Suspense>
  );
}
