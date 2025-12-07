# Page 4 Downstream Workflow

> **Source of Truth** for how Super Topic data flows into Page 5 (Titles), Page 6 (Thumbnails), and Page 7 (Upload).

---

## Overview

```
Page 4: Super Topics
       │
       ├──────────────────────────┐
       │                          │
       ▼                          ▼
Page 5: Titles              Page 6: Thumbnails
       │                          │
       └──────────────────────────┘
                    │
                    ▼
            Page 7: Upload Package
```

Page 4 is the **brain** that informs all creative decisions downstream.

---

## 1. Title Generation Logic (Page 5)

The Title Generator receives the `SuperTopicOutput` and applies bucket-specific rules:

### Bucket → Title Formula

| Bucket | Title Rule | Example |
|--------|------------|---------|
| **🚀 Velocity Spike** | Include time marker: "Just", "Breaking", date | "iPhone 16 Just Got a Major Update (Dec 2025)" |
| **🌲 Evergreen Asset** | Front-load the keyword, no dates | "How to Clean iPhone 16 - The Right Way" |
| **🎓 Deep Dive Authority** | Use authority words: "Complete", "Ultimate", "Everything" | "The Complete Guide to iPhone 16 Photography" |
| **🔗 Binge Loop** | Series format: Part X, Episode, numbered | "iPhone Mastery Part 3: Hidden Camera Features" |
| **🎣 Curiosity Gap** | Open loop, incomplete statement | "I Used the iPhone 16 for a Month and..." |
| **📢 Polarizer** | Question or controversy | "Is the iPhone 16 Actually Worth It?" |
| **🤝 Broad Appeal** | Simple, universal, no jargon | "10 iPhone Tricks Everyone Should Know" |
| **❤️ Core Trust** | Personal, community reference | "Why I'm Switching Phones (Honest Update)" |
| **💰 Rainmaker** | Product name, value proposition | "iPhone 16 Cases That Are Worth Your Money" |
| **🌍 External Search** | Natural question format (Google SEO) | "What's the Best Case for iPhone 16?" |

### Emotion → Title Modifiers

| Emotion | Title Modifier |
|---------|----------------|
| **Curiosity** | Add mystery: "The truth about...", "What they don't tell you..." |
| **Fear** | Add risk: "Before you buy...", "The hidden problem with..." |
| **Greed** | Add gain: "How to get...", "The secret to..." |
| **Hope** | Add transformation: "How to finally...", "The breakthrough..." |
| **Anger** | Add confrontation: "Why X is ruining...", "Stop doing this..." |

### Container → Title Style

| Container | Style Guide |
|-----------|-------------|
| **Sage** | Clarity over cleverness. "How to X" format preferred. |
| **Critic** | Include verdict hint. "vs", "Review", "Worth it?" |
| **Storyteller** | Narrative setup. "The Story of...", "How X became..." |
| **Scientist** | Experiment format. "I tried X for Y days", "Testing..." |
| **Reactor** | Speed signals. "JUST IN", "Breaking", timestamps |
| **Best Friend** | Personal tone. "My honest...", "What I actually..." |
| **Contrarian** | Challenge convention. "Why X is wrong", "Stop believing..." |

### Title Generation Prompt Template

```
Given:
- Porch Pitch: {porch_pitch}
- Primary Bucket: {bucket.name}
- Primary Container: {container.name}
- Primary Emotion: {emotion}
- Winner's Circle Keywords: {keywords}
- Quick Win Angle: {angle_fast.title_hook} OR {angle_hero.title_hook}

Generate 5 title options following the {bucket.name} formula.
Each title must:
1. Apply the bucket-specific rule
2. Match the {emotion} emotional trigger
3. Fit the {container.name} style
4. Include at least one keyword from Winner's Circle
5. Stay under 60 characters
```

---

## 2. Thumbnail Generation Logic (Page 6)

The Thumbnail Generator receives the `SuperTopicOutput` and applies visual rules:

### Bucket → Thumbnail Elements

| Bucket | Required Visual Elements |
|--------|-------------------------|
| **🚀 Velocity Spike** | "NEW" badge, "BREAKING" text, urgency colors (red/orange) |
| **🌲 Evergreen Asset** | Clean, timeless, no dates, professional lighting |
| **🎓 Deep Dive Authority** | Educational aesthetic, books/charts optional, authoritative pose |
| **🔗 Binge Loop** | Series branding, episode number, consistent template |
| **🎣 Curiosity Gap** | Censored/blurred elements, question marks, "reveal" setup |
| **📢 Polarizer** | Confrontational expression, debate setup, vs imagery |
| **🤝 Broad Appeal** | Bright colors, welcoming, mass-market friendly |
| **❤️ Core Trust** | Familiar branding, personal imagery, community signals |
| **💰 Rainmaker** | Product hero shot, price/value callout, currency symbols |
| **🌍 External Search** | Google-result friendly, clear text, no clickbait |

### Emotion → Facial Expression Guide

| Emotion | Face Expression |
|---------|-----------------|
| **Curiosity** | Raised eyebrows, slight head tilt, "hmm" expression |
| **Fear** | Wide eyes, mouth slightly open, concerned brow |
| **Greed** | Confident smirk, knowing look, "I've got a secret" |
| **Hope** | Genuine smile, bright eyes, aspirational |
| **Anger** | Furrowed brow, intense stare, confrontational |

### Container → Visual Style

| Container | Visual Direction |
|-----------|-----------------|
| **Sage** | Step numbers, before/after, result preview |
| **Critic** | Product comparison, rating stars, pros/cons visual |
| **Storyteller** | Cinematic framing, narrative imagery, documentary feel |
| **Scientist** | Data visuals, experiment setup, "lab" aesthetic |
| **Reactor** | Screenshot of news, breaking graphics, timestamp |
| **Best Friend** | Casual setting, lifestyle imagery, relatable |
| **Contrarian** | Bold text overlay, dramatic contrast, "vs the world" |

### Thumbnail Generation Prompt Template

```
Given:
- Porch Pitch: {porch_pitch}
- Primary Bucket: {bucket.name}
- Primary Container: {container.name}
- Primary Emotion: {emotion}
- Quick Win Thumbnail Concept: {angle.thumbnail_concept}

Generate thumbnail concept with:
1. Required elements for {bucket.name}
2. Facial expression matching {emotion}
3. Visual style aligned with {container.name}
4. 3-5 word text overlay suggestion
5. Color palette recommendation
```

---

## 3. Upload Package Logic (Page 7)

The final upload package synthesizes all Page 4 data:

### Description Generation

```
Structure:
1. Hook (from porch_pitch - first sentence)
2. Expansion (from viewer_intent.pain_point + desired_outcome)
3. Chapters (from video_structure.key_moments)
4. CTA (from video_structure.cta_suggestion)
5. Links (based on bucket - if Rainmaker, include affiliate section)
```

### Tag Generation

```
Source tags from:
- winners_circle.phrases (exact match)
- container.name variations ("tutorial", "how to" for Sage)
- bucket.name signals ("review" for Rainmaker)
- keyword_seed + modifiers
```

### Upload Timing Suggestions

| Bucket | Timing Recommendation |
|--------|----------------------|
| **Velocity Spike** | Publish IMMEDIATELY |
| **Evergreen Asset** | Optimal time based on analytics |
| **Deep Dive Authority** | Weekend morning preferred |
| **Binge Loop** | Consistent weekday schedule |
| **Curiosity Gap** | Peak hours (4-6 PM local) |
| **Polarizer** | Avoid holidays, aim for engagement hours |
| **Broad Appeal** | Mass audience times |
| **Core Trust** | When core audience is active |
| **Rainmaker** | Timed with product launches/sales |
| **External Search** | Any time (search-driven discovery) |

### Community Tab / Premiere Decision

| Bucket | Premiere? | Community Post? |
|--------|-----------|-----------------|
| **Velocity Spike** | No (speed matters) | Yes - breaking news post |
| **Deep Dive Authority** | Yes (event feel) | Yes - countdown post |
| **Binge Loop** | Yes (build anticipation) | Yes - series teaser |
| **Core Trust** | Yes (fan experience) | Yes - exclusive preview |
| **Others** | No | Optional |

---

## 4. Data Flow Summary

```typescript
// Page 5 receives:
interface TitleGeneratorInput {
  porch_pitch: string;
  primary_bucket: BucketName;
  primary_container: ContainerName;
  primary_emotion: EmotionName;
  winners_circle: string[];
  quick_wins: {
    angle_fast: { title_hook: string };
    angle_hero: { title_hook: string };
  };
}

// Page 6 receives:
interface ThumbnailGeneratorInput {
  porch_pitch: string;
  primary_bucket: BucketName;
  primary_container: ContainerName;
  primary_emotion: EmotionName;
  emotional_intensity: number;
  quick_wins: {
    angle_fast: { thumbnail_concept: string };
    angle_hero: { thumbnail_concept: string };
  };
}

// Page 7 receives:
interface UploadPackageInput {
  porch_pitch: string;
  viewer_intent: ViewerIntent;
  video_structure: VideoStructure;
  primary_bucket: BucketName;
  winners_circle: string[];
  creator_profile: CreatorProfile;
}
```

---

## 5. Override Rules

Users can manually override any classification. The system should:

1. **Allow Quick Toggle**: "Is this trending?" switch auto-selects Velocity Spike bucket
2. **Container Override**: Dropdown to select alternative container
3. **Bucket Override**: Dropdown to select alternative bucket
4. **Regenerate Downstream**: Any override triggers re-generation of Title and Thumbnail suggestions

---

*Last Updated: December 7, 2025*
