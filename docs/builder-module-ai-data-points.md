# Builder Module: AI Data Points

This document defines all data points to be retrieved via AI (primarily GPT-5 mini) during the Builder module workflow.

---

## Core Data Points

| Data Point | Type | Description |
|------------|------|-------------|
| **Phrase** | string | The video topic/keyword |
| **Growth Fit Score** | 0-99 | Overall viability score for growth |
| **Porch Talk** | 2 sentences | Personalized pitch combining viewer + creator angle |
| **Viewer Intent** | 3 sentences + score (0-99) + reason | What the viewer wants and why |
| **Viewer Goal/Motivation** | enum | learn, validate, vent, be entertained |
| **Viewer Angle** | 1 sentence | The viewer's perspective on this topic |
| **Hook** | 1-2 sentences | How to open the video to capture attention |

---

## Classification Data Points

| Data Point | Type | Options |
|------------|------|---------|
| **Video Format** | enum | Tutorial, First Impression, Commentary, Analysis, Reaction, etc. |
| **Algorithm Target** | 2-3 tags | Evergreen, High Click Trigger, Velocity Spike, Watch Time Booster, Authority Builder |
| **Mindset** | enum | positive, negative, neutral, insightful |
| **Primary Emotion** | enum | curiosity, FOMO, fear, hope, frustration, validation, etc. |
| **Secondary Emotion** | enum | (same options as primary) |

---

## Audience Data Points

| Data Point | Type | Description |
|------------|------|-------------|
| **Audience Persona** | 1-2 sentences | Who specifically searches this |
| **Audience Vibe** | 1 sentence | The emotional landscape from autocomplete results |
| **Authority Signals** | 2-3 items | What credentials help with this topic |

---

## When to Pull Each Data Point

| Stage | Data Points Retrieved |
|-------|----------------------|
| **Seed** | Phrase, initial format suggestions |
| **Refine** | Growth Fit Score, Algorithm Target, Emotions, Mindset |
| **Super** | Porch Talk, Viewer Intent, Hook, Viewer Angle, Goal/Motivation |
| **Report** | All of the above consolidated + Audience Persona, Authority Signals |

---

## Future Integrations (Later)

- **Roc API** — Trending signals from X/Twitter
- **YouTube Data API** — View counts, competition analysis
- **Search Volume APIs** — Keyword demand data
