import { redirect } from "next/navigation";

/**
 * Main onboarding route - redirects to step-1
 * 
 * Each step has its own route:
 * - /members/onboarding/step-1 → Welcome
 * - /members/onboarding/step-2 → Goals
 * - /members/onboarding/step-3 → Money
 * - /members/onboarding/step-4 → Niche
 * - /members/onboarding/step-5 → Pillars
 * - /members/onboarding/step-6 → Audience
 */
export default function OnboardingPage() {
  redirect("/members/onboarding/step-1");
}
