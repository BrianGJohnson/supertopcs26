# SuperTopics UI Components Guide

Reference for consistent UI patterns across the application. Use these pre-built components when building new pages.

---

## Table of Contents
- [Colors](#colors)
- [Page-Level Components](#page-level-components)
- [Steppers](#steppers)
- [Hero Module](#hero-module)
- [Cards](#cards)
- [Buttons](#buttons)
- [Chips](#chips)
- [Form Elements](#form-elements)
- [Feedback Components](#feedback-components)
- [Utility Patterns](#utility-patterns)

---

## Colors

### Brand Colors
```
Primary Green:    #2BD899 (buttons, Evergreen pillar, success)
Primary Purple:   #7A5CFA (Monetization pillar, AI features, premium)
Trending Orange:  #F59E0B (Trending pillar, warnings)
Cyan:             #00D4FF (personalization, customization)
Red:              #FF4444 (YouTube, video, errors)
Blue:             #3B82F6 (data, analytics, info)
Background:       #0B1220 (dark navy)
Surface:          #1A1E24 (cards, modals)
Midnight Blue:    #1A2754 (active states, steppers)
```

### Text Opacities
```
Hero headlines:   text-white (100%) — main page titles only
Card headings:    text-white/90 (90%) — softer, easier on eyes
Body text:        text-white/70
Secondary text:   text-white/60
Muted/helper:     text-white/50
Subtle/disabled:  text-white/40
```

**Note:** Card headings use 90% white to reduce glare against dark backgrounds.
Hierarchy is driven by subtle opacity differences, not harsh contrast.

---

## Page-Level Components

### PageShell
Base wrapper for all pages. Provides background and max-width constraint.

**Location:** `@/components/layout/PageShell`

```tsx
import { PageShell } from "@/components/layout/PageShell";

<PageShell>
  {/* Your page content */}
</PageShell>
```

### OnboardingPageLayout
Complete layout for onboarding steps. Includes header, stepper, hero, content area, and footer.

**Location:** `@/components/layout/OnboardingPageLayout`

```tsx
import { OnboardingPageLayout } from "@/components/layout/OnboardingPageLayout";
import { IconRocket } from "@tabler/icons-react";

<OnboardingPageLayout
  currentStep={1}
  completedSteps={[]}
  icon={IconRocket}
  heroLine1="Welcome to"
  heroLine2="SuperTopics"
  heroDescription="Let's set up your channel for success."
>
  {/* Step content */}
</OnboardingPageLayout>
```

### MemberHeader
Top navigation bar with logo, nav links, and user tokens/avatar.

**Location:** `@/components/layout/MemberHeader`

```tsx
import { MemberHeader } from "@/components/layout/MemberHeader";

<MemberHeader tokens={3242} initials="BJ" />
```

---

## Steppers

### OnboardingStepper
Horizontal progress stepper with icons for 6-step onboarding flow. Supports navigation to completed steps.

**Location:** `@/components/stepper/OnboardingStepper`

```tsx
import { OnboardingStepper } from "@/components/stepper/OnboardingStepper";

<OnboardingStepper 
  activeStep={3} 
  completedSteps={[1, 2]} 
/>
```

**Steps:** Welcome → Goals → Money → Niche → Pillars → Audience

**Visual specs:**
- Circles: `w-12 h-12`, `ring-4 ring-background`
- Active: `bg-[#1A2754]`, white icon, glow shadow
- Completed: `bg-primary/80`, checkmark icon
- Inactive: `bg-surface`, 60% opacity
- Labels: `text-[10px] md:text-xs`, uppercase, tracking-widest

### BuilderStepper
Horizontal progress stepper with numbers for 6-step builder flow.

**Location:** `@/components/stepper/BuilderStepper`

```tsx
import { BuilderStepper } from "@/components/stepper/BuilderStepper";

<BuilderStepper activeStep={2} />
```

**Steps:** Seed → Refine → Super → Title → Package → Upload

---

## Hero Module

Reusable hero section with icon, two-line headline, and description.

**Location:** `@/components/layout/HeroModule`

```tsx
import { HeroModule } from "@/components/layout/HeroModule";
import { IconChartBar } from "@tabler/icons-react";

<HeroModule
  icon={IconChartBar}
  line1="Your Channel"      // 3-4 words, white
  line2="Direction"         // 2-3 words, gradient
  description="We'll help you find your perfect niche."
/>
```

**Headline Rules:**
- Total: 6-7 words
- Line 1: 3-4 words (white text)
- Line 2: 2-3 words (gradient purple→cyan)
- Always two lines, never collapse

**Spacing (locked):**
- Icon: 100px, with ambient glow
- h1: `text-[3.4rem] md:text-[4.2rem]`, `leading-[1.22]`
- Description: `text-[1.5rem]`, `mt-[20px]`

---

## Cards

### Pillar Card
Colored card with icon box, title, description, and content area.

```tsx
<div className="p-8 rounded-2xl bg-[#COLOR]/10 border-2 border-[#COLOR]/40">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-12 h-12 rounded-xl bg-[#COLOR]/20 flex items-center justify-center">
      <IconName size={28} className="text-[#COLOR]" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-white">Title</h3>
    </div>
  </div>
  
  <p className="text-lg text-white/70 leading-relaxed mb-6">
    Description text goes here.
  </p>

  {/* Content area */}
  <div className="flex flex-wrap gap-2">
    {/* chips, buttons, etc */}
  </div>
</div>
```

**Color Variants:**
- Evergreen: `#2BD899`
- Trending: `#F59E0B`
- Monetization: `#7A5CFA`

**Note:** No emojis in titles—the icon box provides the visual. Description uses `text-lg` for readability.

### Summary Card
For displaying AI-generated summaries or important text blocks.

```tsx
<div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
  <p className="text-xl text-white/60 leading-relaxed">
    {summary}
  </p>
</div>
```

**Note:** Uses `text-white/60` for softer readability (not too bright).

### FeatureCard
Polished card with colored accent border for feature highlights.

**Location:** `@/components/ui/FeatureCard`

```tsx
import { FeatureCard, FeatureCardGrid, FEATURE_CARD_COLORS } from "@/components/ui/FeatureCard";

<FeatureCardGrid>
  <FeatureCard
    icon={IconRocket}
    color={FEATURE_CARD_COLORS.green}
    title="Fast Performance"
    description="Lightning fast load times with optimized caching."
    highlight="lightning fast"  // Optional: bolds this text
  />
</FeatureCardGrid>
```

**Available colors:** cyan, red, green, purple, orange, blue

### Info Note Box
Subtle info box for tips and notes.

```tsx
<div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center">
  <p className="text-white/60 text-sm">
    💡 Info text here. <span className="text-[#F59E0B]">Highlighted text</span> for emphasis.
  </p>
</div>
```

---

## Buttons

### Primary Button (CTA)
Main action button with gradient.

```tsx
<button
  onClick={handleClick}
  className="
    inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg
    bg-gradient-to-b from-[#2BD899] to-[#25C78A] text-[#0B1220] 
    shadow-[0_4px_20px_rgba(43,216,153,0.3)] hover:shadow-[0_4px_30px_rgba(43,216,153,0.4)]
    transition-all duration-200
  "
>
  Button Text
  <IconChevronRight size={20} />
</button>
```

### Secondary Button (Back/Cancel)
Subtle text button.

```tsx
<button
  onClick={handleBack}
  className="text-white/40 hover:text-white/60 text-sm"
>
  ← Back
</button>
```

### Button Group (Stacked)
Primary + secondary buttons stacked vertically.

```tsx
<div className="flex flex-col items-center gap-4">
  <button className="...primary styles...">
    Continue
    <IconChevronRight size={20} />
  </button>
  <button className="text-white/40 hover:text-white/60 text-sm">
    ← Back
  </button>
</div>
```

---

## Chips

### Selectable Chip (Toggle)
Clickable chip that toggles selected state.

```tsx
<button
  onClick={() => toggleSelection(item)}
  className={`
    px-4 py-2 rounded-lg text-sm font-medium transition-all
    ${isSelected 
      ? "bg-[#COLOR] text-[#0B1220] shadow-lg" 
      : "bg-[#COLOR]/15 border border-[#COLOR]/30 text-[#COLOR] hover:bg-[#COLOR]/25"
    }
  `}
>
  {isSelected && <IconCheck size={14} className="inline mr-1" />}
  {item}
</button>
```

### Display Chip (Non-selectable)
Static chip for displaying items.

```tsx
<span className="px-4 py-2 rounded-lg text-sm font-medium bg-[#COLOR]/15 border border-[#COLOR]/30 text-[#COLOR]">
  {item}
</span>
```

### Channel/Tag Chip
Rounded pill for channel names or tags.

```tsx
<span className="px-4 py-2 rounded-full bg-white/[0.06] text-white/70 text-sm">
  {channelName}
</span>
```

---

## Form Elements

### Section Instruction Text
Large centered instruction above a form/card.

```tsx
<p className="text-xl text-white/70 text-center">
  Choose 3-5 sub-niches to focus on:
</p>
```

### Selection Counter
Shows count of selected items.

```tsx
<p className="text-center text-white/50">
  {count} sub-niche{count !== 1 ? "s" : ""} selected
</p>
```

---

## Feedback Components

### Modal
Overlay modal with header, body, and footer.

**Location:** `@/components/ui/Modal`

```tsx
import { Modal, ModalButton } from "@/components/ui/Modal";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <>
      <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
      <ModalButton variant="primary" onClick={onConfirm}>Confirm</ModalButton>
    </>
  }
>
  <p className="text-white/70">Are you sure you want to proceed?</p>
</Modal>
```

**Button variants:** `primary`, `secondary`, `danger`

### Toast Notifications
Toast system with context provider.

**Location:** `@/components/ui/Toast`

```tsx
// In layout or provider:
import { ToastProvider } from "@/components/ui/Toast";

<ToastProvider>
  {children}
</ToastProvider>

// In component:
import { useToast } from "@/components/ui/Toast";

const { showToast } = useToast();

showToast({
  type: "success",  // success, info, warning, error
  title: "Changes saved!",
  message: "Your settings have been updated.",
  action: {
    label: "View",
    href: "/settings",
  },
  duration: 5000,  // ms, 0 = no auto-dismiss
});
```

---

## Utility Patterns

### Score Display
Numeric score with label badge.

```tsx
<div className="flex items-center justify-center gap-3">
  <span className="text-white/50">Demand:</span>
  <span className="text-3xl font-bold" style={{ color: scoreColor }}>
    {score}/10
  </span>
  <span 
    className="px-3 py-1 rounded-full text-sm font-medium"
    style={{ 
      backgroundColor: `${scoreColor}20`,
      color: scoreColor 
    }}
  >
    {label}
  </span>
</div>
```

**Score Color Logic:**
```tsx
const getScoreColor = (score: number) => {
  if (score >= 7) return "#2BD899"; // green
  if (score >= 5) return "#F59E0B"; // orange
  return "#EF4444"; // red
};
```

### Progress Dots
Visual progress indicator.

```tsx
<div className="flex justify-center gap-1">
  {Array.from({ length: 10 }).map((_, i) => (
    <div
      key={i}
      className="w-3 h-3 rounded-full"
      style={{
        backgroundColor: i < score 
          ? scoreColor 
          : "rgba(255,255,255,0.1)"
      }}
    />
  ))}
</div>
```

### Ambient Background Glow
Soft glow effect behind content.

```tsx
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
```

### Footer
Standard page footer.

```tsx
<footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-t border-white/[0.07] pt-5 pb-4 mt-8">
  SuperTopics.app © 2025 • All Rights Reserved • You Dig?
</footer>
```

---

## Container Widths

```
max-w-2xl  → 672px  (narrow content, feature cards)
max-w-3xl  → 768px  (standard cards, pillar cards)
max-w-4xl  → 896px  (steppers, wide content)
max-w-5xl  → 1024px (full page layouts)
max-w-7xl  → 1280px (PageShell default)
```

---

## Spacing

```
space-y-4  → 16px vertical gap
space-y-6  → 24px vertical gap
space-y-8  → 32px vertical gap (standard section spacing)
gap-2      → 8px (chips)
gap-3      → 12px (icon + text)
gap-4      → 16px (buttons)
gap-6      → 24px (cards)
```

---

## Animation (Framer Motion)

Standard fade-in animation.

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>
  {/* content */}
</motion.div>
```

Sequential reveal with staggered delays:
```
delay: 0.0  → First element
delay: 0.2  → Second element
delay: 0.4  → Third element
```

---

## Icons (Tabler)

**Common icons:**
```tsx
import { 
  IconLeaf,           // Evergreen
  IconTrendingUp,     // Trending
  IconCash,           // Monetization/Money
  IconChartBar,       // Analytics/Stats/Pillars
  IconCheck,          // Selected/Complete state
  IconChevronRight,   // Next/Continue
  IconLoader2,        // Loading (add animate-spin)
  IconTargetArrow,    // Target/Goal
  IconRocket,         // Welcome/Launch
  IconTarget,         // Goals
  IconBulb,           // Niche/Ideas
  IconUsers,          // Audience
  IconX,              // Close/Dismiss
  IconInfoCircle,     // Info
  IconAlertTriangle,  // Warning/Error
} from "@tabler/icons-react";
```

**Standard sizes:**
- Hero icons: `size={100}`
- Card icons: `size={28}`
- Button icons: `size={20}`
- Inline icons: `size={14}`
