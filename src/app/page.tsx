import { PageShell } from "@/components/layout/PageShell";
import { HomeHero } from "@/components/templates/HomeHero";

export default function HomePage() {
  return (
    <PageShell>
      <HomeHero
        title="Stop Guessing. Start Growing."
        subtitle="You've heard it before. If they don't click, they don't watch. If they don't watch, you can't grow. The simplest path to YouTube success is identifying a great topic, a Super Topic."
        primaryButtonLabel="Get Started"
        primaryButtonHref="/members"
        secondaryButtonLabel="Learn More"
        secondaryButtonHref="/about"
      />
    </PageShell>
  );
}
