# Super Thumbnail System - Vision & Technical Plan

## Executive Summary

This document outlines the plan to build a comprehensive thumbnail generation system for SuperTopics. The system will guide users from phrase selection through to final thumbnail creation in approximately 15 minutes.

---

## User Journey Overview

```
Title Page (Current)
    ↓ Select 1 title + 1-3 thumbnail phrases
    ↓ Click "Continue to Thumbnail Blueprint"
    
Thumbnail Blueprint (NEW - Hidden Step)
    ↓ Configure thumbnail concept
    ↓ Choose template type, style, colors
    ↓ Click "Generate Thumbnails"
    
Thumbnail Studio (NEW - In Stepper, replaces "Package")
    ↓ AI generates thumbnail variations
    ↓ Iterate and refine
    ↓ Download final thumbnails
    
Upload Page
```

---

## Reference Thumbnails Analysis

Based on the provided examples, we need to support these thumbnail styles:

| Style | Example | Key Elements |
|-------|---------|--------------|
| **Graphic + Bold Text** | "AI Religions", "AI Hype Cooling" | Dramatic imagery, large readable typography, gradient backgrounds |
| **Object Focus** | "OpenAI Strawberry" | Single striking object, embedded branding, minimal text |
| **Silhouette + Text** | "AI Hate" | Human silhouette, tech overlay effects, bold title |
| **Robot/Avatar** | "Red Pill", "AI Gaslighting" | Humanoid figure, dramatic lighting, speech bubbles optional |

---

## AI Model Research Summary

### Primary Recommendation: **Recraft V3 via FAL.AI**

| Model | Provider | Best For | Pricing | Text Quality |
|-------|----------|----------|---------|--------------|
| **Recraft V3** | FAL.AI | Typography + Graphics | ~$0.04/MP | ⭐⭐⭐⭐⭐ Excellent |
| Ideogram 2.0 | Ideogram | Text in images | Subscription | ⭐⭐⭐⭐⭐ Excellent |
| Flux 1.1 Pro | FAL.AI | Photorealism | $0.04/MP | ⭐⭐⭐ Mediocre |
| Flux 2 Pro | FAL.AI | Latest quality | $0.03-0.05/MP | ⭐⭐⭐ Mediocre |

### Why Recraft V3?
- **Superior text/typography** - designed for graphic design, not just photos
- **1500+ fonts** - precise control over typography style
- **Vector output** - scalable graphics
- **Available on FAL.AI** - single API provider for everything
- **Prompt-based text styling** - "bold retro serif font", "glowing red letters"

### FAL.AI Advantages
- **Server-side generation** - no local GPU needed
- **Pay-per-use** - ~$0.04 per 1MP image (1024x1024 = 1MP)
- **Free credits** - for testing
- **Multiple models** - Flux, Recraft, LoRA training all in one place

---

## LoRA Training for Face Integration

### Option A: FAL.AI LoRA Training
| Feature | Details |
|---------|---------|
| **Base Cost** | $2 per training run |
| **Portrait LoRA** | $0.0024/step, min 1000 steps = ~$2.40 |
| **Training Time** | 15-30 minutes |
| **Photos Required** | 10-20 high-quality photos |

### Option B: Face Swap (Simpler Alternative)
- FAL.AI offers face swap API
- User uploads ONE photo
- Face is swapped onto generated image
- Faster, cheaper, but less consistent

### Recommendation
**Phase 1**: Skip LoRA, use face swap for "Face + Text" templates
**Phase 2**: Add LoRA training for premium/consistent results

---

## Page 1: Thumbnail Blueprint (Design)

### Purpose
Users configure their thumbnail concept before AI generation.

### Blueprint Configuration Options

#### 1. Template Type (Dropdown with Hover Sub-menus)
```
├── Graphic + Text
│   ├── Object Focus (single dramatic object)
│   ├── Scene/Environment (landscape, tech background)
│   └── Abstract/Pattern (gradients, shapes)
│
├── Face + Text
│   ├── Face Left + Text Right
│   ├── Face Right + Text Left
│   └── Face Center + Text Overlay
│
└── Typography Focus
    ├── Bold Statement
    ├── Question Style
    └── List/Numbers
```

#### 2. Visual Style
- Realistic / Illustrated / Tech-Futuristic / Cartoon
- Dark Mode / Light Mode / Gradient

#### 3. Emotion-Derived Colors
| Emotion | Primary Color | Accent |
|---------|---------------|--------|
| Curiosity | Deep Blue | Cyan |
| Fear/FOMO | Red | Orange |
| Excitement | Yellow | Gold |
| Hope | Green | Teal |
| Anger | Dark Red | Black |

#### 4. Face Settings (if Face + Text)
- Upload photo OR use face swap
- Expression: Shocked / Curious / Concerned / Excited / Neutral
- Style modifier: Realistic / Slightly Illustrated

#### 5. Text Configuration
- Which locked phrase(s) to use (from Title page)
- Font style preference (Bold, Serif, Sans, Tech)
- Size: Large / Very Large

---

## Page 2: Thumbnail Studio (Generation)

### Purpose
AI generates thumbnails, user iterates and downloads.

### Features
1. **Generate Variations** - 4 variations per blueprint
2. **Regenerate** - Try different seeds
3. **Edit Prompt** - Tweak the generation prompt
4. **Download** - PNG at YouTube resolution (1280x720)

### A/B Testing Support
- Up to 3 blueprints from Blueprint page
- Each generates 4 variations = 12 total options
- User picks 3 for YouTube split testing

---

## Technical Architecture

### API Routes Needed
```
/api/thumbnail/generate     - Generate thumbnail via FAL.AI
/api/thumbnail/face-swap    - Swap face onto image
/api/thumbnail/lora-train   - Train LoRA (Phase 2)
/api/thumbnail/save         - Save blueprint config
```

### Database Schema Additions
```sql
-- Blueprint configuration
CREATE TABLE thumbnail_blueprints (
    id UUID PRIMARY KEY,
    super_topic_id UUID REFERENCES super_topics(id),
    template_type TEXT,           -- 'graphic_text', 'face_text', 'typography'
    template_subtype TEXT,        -- 'face_left', 'object_focus', etc.
    visual_style TEXT,
    emotion TEXT,
    color_palette JSONB,
    phrases TEXT[],               -- Selected phrases from Title page
    face_settings JSONB,          -- If face + text
    created_at TIMESTAMPTZ
);

-- Generated thumbnails
CREATE TABLE generated_thumbnails (
    id UUID PRIMARY KEY,
    blueprint_id UUID REFERENCES thumbnail_blueprints(id),
    image_url TEXT,
    generation_prompt TEXT,
    fal_request_id TEXT,
    cost_cents INTEGER,
    created_at TIMESTAMPTZ
);
```

### FAL.AI Integration
```typescript
// Example: Generate with Recraft V3
const response = await fal.run("fal-ai/recraft-v3", {
  input: {
    prompt: "YouTube thumbnail, dark tech background, bold white text 'AI RELIGIONS', dramatic angel figure with wings, cinematic lighting",
    style: "realistic_image",
    aspect_ratio: "16:9",
  }
});
```

---

## Cost Estimation

### Per Thumbnail Generation
| Step | Cost |
|------|------|
| Recraft V3 (1.4MP for 1280x720) | ~$0.06 |
| 4 variations | ~$0.24 |
| 3 blueprints × 4 variations | ~$0.72 |

### Per User Session (Full Flow)
- Phrase generation (GPT): ~$0.05
- Title generation (GPT): ~$0.05
- Thumbnail generation: ~$0.72
- **Total: ~$0.82 per complete session**

### Face Swap Add-on
- Face swap: ~$0.02-0.05 per image
- Adds ~$0.08-0.20 per session

---

## Implementation Phases

### Phase 1: MVP (2-3 weeks)
- [ ] Thumbnail Blueprint page (UI only, no AI yet)
- [ ] Recraft V3 integration via FAL.AI
- [ ] Graphic + Text template only
- [ ] Basic generation and download
- [ ] Update progress stepper (Package → Thumbnail)

### Phase 2: Face Integration (2 weeks)
- [ ] Face + Text templates
- [ ] FAL.AI face swap integration
- [ ] Expression selection UI
- [ ] Photo upload flow

### Phase 3: A/B Testing (1 week)
- [ ] Multi-blueprint support
- [ ] Variation comparison UI
- [ ] Export 3 thumbnails for YouTube

### Phase 4: LoRA Training (3-4 weeks)
- [ ] Photo collection flow (10-20 photos)
- [ ] LoRA training via FAL.AI
- [ ] Trained model storage and reuse
- [ ] Consistent face generation

---

## Open Questions

1. **Hybrid Approach?** Should we generate background with AI (Recraft/Flux) and overlay text programmatically for perfect typography control?

2. **Photo Upload UX** - For face swap, do we need a dedicated "upload your face" onboarding step before they reach Blueprint?

3. **Caching/Reuse** - Should we cache generated backgrounds for faster iteration?

4. **Brand Consistency** - Do we want users to save "brand presets" (colors, fonts, style) for reuse?

---

## Next Steps

1. **Approve this plan** - Get alignment on scope
2. **Design Blueprint UI** - Create mockups
3. **FAL.AI account setup** - Get API keys, test Recraft V3
4. **Build Blueprint page** - Configuration UI
5. **Integrate generation** - Connect to FAL.AI
6. **Test end-to-end** - Full flow validation
