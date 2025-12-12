---
description: Styling rules for modal components following SuperTopics branding
---

# Modal Component Styling

Comprehensive guide for building modals in SuperTopics.

---

## ⚠️ CRITICAL RULES

### 1. Always Use Glass-Card Button Style
**Never use solid-fill buttons with white text.** They look flat and generic.

### 2. Never Use AI-Looking Icons
**Banned icons:** `IconSparkles`, `IconStars`, `IconWand`, any "magic wand" or "sparkle" variants.

**Use instead (vary these!):**
- `IconBolt` ⚡ — Energy, power, action
- `IconFlask` 🧪 — Lab, experimentation (hero icon)
- `IconFlame` 🔥 — Creative fire, hot ideas
- `IconRocket` 🚀 — Launch, speed, blast off
- `IconScale` ⚖️ — Judging, selecting, weighing
- `IconRefresh` 🔄 — Regeneration, refresh

**Tip:** Don't always use the same icon. If the hero uses `IconFlask`, use `IconBolt` in the loading state. Variety keeps it fresh.

### 3. Purple = Use Sparingly
**Only use purple when explicitly advised.** Purple is reserved for premium actions.
For most modal CTAs, use **GREEN** (progress/go) or **BLUE** (secondary).

### 4. Green = Go (Stoplight Rule)
**All forward-moving modal actions must be GREEN.**
- Generate, Confirm, Save, Continue → GREEN
- Cancel, Dismiss, Back → Neutral gray

### 5. No AI Language ⚠️
**Never mention AI, GPT, LLM, or "machine learning" in user-facing text.**

**Instead of:** | **Say:**
---|---
"AI-generated" | "Our creative engine"
"Using AI to..." | "Our title lab"
"GPT/LLM" | "Proprietary algorithms"
"Machine learning" | "SuperTopics methodology"
"AI analyzes" | "Our algorithms evaluate"

**Why:** SuperTopics is a human tool that leverages technology—not an "AI tool." Users couldn't get these results from ChatGPT. The methodology is the value.

---

## Modal Sizes

### Small Modal (FastTrackModal)
```
max-w-xl (576px)
px-10 py-10
```
**Use for:** Quick confirmations, format selection, simple forms

### Medium Modal (LockVideoModal)
```
max-w-2xl (672px)
px-10 py-10
```
**Use for:** Format selection with descriptions, moderate content

### Large Modal (OpportunityModal)
```
max-w-2xl (672px)
overflow-y-auto (with hidden scrollbar)
px-8 py-8, inner content p-10
```
**Use for:** Data-rich modals with scores, breakdowns, lists

---

## Text Opacity Scale

| Use Case | Opacity | Class |
|----------|---------|-------|
| Modal title | 100% | `text-white` |
| Readable body text | 80% | `text-white/80` |
| Section labels | 60% | `text-white/60` |
| Teaser/helper text | 60% | `text-white/60 text-lg` |
| Muted text | 50% | `text-white/50` |
| Subtle/disabled | 40% | `text-white/40` |

**Important:** Helper text should be `text-lg` (18px) minimum—not `text-sm`. Err on the side of too big.

---

## Title Generation Loading Flow

3-phase flow for ~14 seconds. Each visit shows randomized messages.

### ⚠️ CRITICAL RULES

1. **Title Case** — Capitalize Every Word
2. **No Trailing Dots** — Headlines, not sentences
3. **Large Text Sizes** — Headlines `text-4xl font-bold`, step text `text-2xl`

### Phase 1: Creative Kickoff (0-5 seconds)
```tsx
const PHASE_1_MESSAGES = [
  "Cranking Up The Creative Engine",
  "Firing Up The Title Lab",
  "Warming Up The Creativity",
  "Starting The Experiment",
];
```

### Phase 2: Generation (5-10 seconds)
```tsx
const PHASE_2_MESSAGES = [
  "Brewing 15 Different Title Angles",
  "Mixing Data With Creativity",
  "Generating Fresh Title Ideas",
  "Exploring New Angles",
];
```

### Phase 3: Critique (10-14 seconds)
```tsx
const PHASE_3_MESSAGES = [
  "Now Critiquing The Results",
  "Filtering Noise, Keeping Gold",
  "Selecting The Winners",
  "Our Critic Is Choosing Your Best Titles",
];
```

### Step Text (Static, Bottom)
```tsx
<p className="text-white/60 text-2xl leading-relaxed max-w-xl">
  Step 1 of 15 Creative Title Angles<br />
  Each Step Refines And Improves Your Pick
</p>
```

### Full Loading Component
```tsx
const PHASE_TIMINGS = [5000, 5000, 4000]; // 5s, 5s, 4s = 14s total

function TitleGenerationLoader() {
  const [phase, setPhase] = useState(0);
  const [messageIndex] = useState(() => Math.floor(Math.random() * 4));
  
  useEffect(() => {
    if (phase < 2) {
      const timer = setTimeout(() => setPhase(p => p + 1), PHASE_TIMINGS[phase]);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const messages = [PHASE_1_MESSAGES, PHASE_2_MESSAGES, PHASE_3_MESSAGES];
  const currentMessage = messages[phase][messageIndex % messages[phase].length];

  return (
    <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
      <div className="flex flex-col items-center gap-8">
        {/* Bolt Icon - pulsing */}
        <IconBolt className="w-16 h-16 text-[#7A5CFA] animate-pulse" />
        
        {/* Current Phase Message - LARGE HEADLINE */}
        <h2 className="text-white/90 text-4xl font-bold transition-opacity duration-500">
          {currentMessage}
        </h2>
        
        {/* Progress bar */}
        <ProgressBar phase={phase} />
        
        {/* Step text - LARGE */}
        <p className="text-white/60 text-2xl leading-relaxed max-w-xl">
          Step 1 of 15 Creative Title Angles<br />
          Each Step Refines And Improves Your Pick
        </p>
      </div>
    </div>
  );
}
```

---

## Phrase Generation Loading Overlay

Full-screen overlay for phrase generation (Step 2). Takes ~14-16 seconds.

### ⚠️ CRITICAL RULES

1. **Title Case** — Capitalize Every Word
2. **No Trailing Dots** — Headlines, not sentences
3. **Large Text Sizes** — Headlines `text-4xl font-bold`, step text `text-2xl`
4. **Silvery-Blue Border** — NOT purple. Use `#6B9BD1` (metallic blue)
5. **Dark Backdrop** — `bg-black/70 backdrop-blur-sm`

### Phase Messages ("Mad Scientist" Theme)

```tsx
const PHRASE_PHASE_1_MESSAGES = [
    "Waking Up The Mad Scientist",
    "Summoning The Creative Genius",
    "Firing Up The Idea Factory",
    "Unleashing The Creative Engine",
];
const PHRASE_PHASE_2_MESSAGES = [
    "Generating Dozens Of Phrases",
    "Exploring Every Angle",
    "Creating Winners And Wild Cards",
    "Mixing Words With Emotion",
];
const PHRASE_PHASE_3_MESSAGES = [
    "Sorting Winners From Wild Ideas",
    "Picking The Top Contenders",
    "Organizing Your Options",
    "Selecting The Best Phrases",
];
```

### Step Text (Explains Color Coding)
```tsx
<p className="text-white/60 text-2xl leading-relaxed max-w-xl">
    Winners Are Shown First In White<br />
    Purple? That's Our Crazy Creative — Worth A Peek
</p>
```

### Full Overlay Component
```tsx
{isGeneratingPhrases && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div 
            className="bg-surface/60 backdrop-blur-md rounded-2xl p-16 text-center max-w-2xl mx-4"
            style={{
                border: '2px solid rgba(107, 155, 209, 0.4)',
                boxShadow: '0 0 40px rgba(107, 155, 209, 0.15)',
            }}
        >
            <div className="flex flex-col items-center gap-8">
                {/* Flask Icon - pulsing (mad scientist theme) */}
                <IconFlask className="w-16 h-16 text-[#6B9BD1] animate-pulse" />

                {/* Current Phase Message - Large headline */}
                <h2 className="text-white/90 text-4xl font-bold">
                    {currentMessage}
                </h2>

                {/* Progress bar */}
                <ProgressBar phase={phraseLoadingPhase} />

                {/* Step text */}
                <p className="text-white/60 text-2xl leading-relaxed max-w-xl">
                    Winners Are Shown First In White<br />
                    Purple? That's Our Crazy Creative — Worth A Peek
                </p>
            </div>
        </div>
    </div>
)}
```

---


## Progress Modal Pattern

Use when API calls take 2+ seconds. Shows multi-phase progress.

### Phase Checklist
```tsx
{phases.map((phase) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
    isActive ? "bg-white/[0.06] border border-white/20" 
    : "bg-black/20 border border-white/5"
  }`}>
    {isComplete ? (
      <IconCheck size={20} className="text-[#6B9BD1]" />
    ) : isActive ? (
      <IconLoader2 size={20} className="animate-spin" style={{ color }} />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-white/20" />
    )}
    <span className={isPending ? "text-white/40" : "text-white"}>
      {label}
    </span>
  </div>
))}
```

### Animated Progress Bar
```tsx
<div className="relative h-5 bg-black/30 rounded-full border border-white/10 overflow-hidden" style={{ width: '78%' }}>
  <div
    className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
    style={{ width: `${progress}%`, backgroundColor: "#6B9BD1", opacity: 0.7 }}
  />
  {/* Shimmer */}
  <div
    className="absolute inset-y-0 left-0 rounded-full animate-pulse"
    style={{ width: `${progress}%`, background: `linear-gradient(90deg, transparent, #6B9BD150, transparent)` }}
  />
</div>
```

---

## UI Elements

### Warning Box (Orange)
```tsx
<div className="p-6 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30">
  <p className="text-[#F59E0B] text-base mb-2">Warning title</p>
  <p className="text-white/60 text-base">Description</p>
</div>
```

### Info Box (Blue)
```tsx
<div className="p-6 rounded-xl bg-[#6B9BD1]/10 border border-[#6B9BD1]/30">
  <p className="text-[#6B9BD1] text-base mb-2">Info title</p>
  <p className="text-white/60 text-base">Description</p>
</div>
```

### Success Banner
```tsx
<div className="flex items-center gap-3 p-4 bg-[#6B9BD1]/10 border border-[#6B9BD1]/30 rounded-xl">
  <IconCheck size={24} className="text-[#6B9BD1]" />
  <p className="text-white text-lg">Success message here.</p>
</div>
```

---

## Score Color System

| Score | Hex |
|-------|-----|
| 80+ | `#4DD68A` |
| 60-79 | `#A3E635` |
| 40-59 | `#FACC15` |
| 20-39 | `#FB923C` |
| 0-19 | `#F87171` |

---

## Button Color System

### GREEN — Primary (DEFAULT)
```
bg-gradient-to-b from-[#2BD899]/20 to-[#25C78A]/20
text-[#2BD899] border-2 border-[#2BD899]/50
```

### BLUE — Secondary
```
bg-[#6B9BD1]/20 text-[#6B9BD1] border border-[#6B9BD1]/40
```

### PURPLE — Premium (SPARINGLY)
```
bg-gradient-to-b from-[#7A5CFA]/15 to-[#6548E5]/15
text-[#C3B6EB] border-2 border-[#7A5CFA]/40
```

### Neutral — Cancel
```
bg-white/5 text-white/60 border border-white/10
```

---

## Reference Examples

- **Small modal:** `FastTrackModal.tsx`
- **Medium modal:** `LockVideoModal.tsx`
- **Large modal:** `OpportunityModal.tsx`
- **Progress modal:** `PhraseSelectModal.tsx` + `SeedCard.tsx`
- **Title loader:** `TitlePageContent.tsx` (loading state)
