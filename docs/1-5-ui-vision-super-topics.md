# Page 4 UI Vision: The Watch Page

> **Source of Truth** for the visual experience.
> **Concept**: A "Progressive Laboratory" where the user locks in their winning idea layer by layer.

---

## 1. The UX Flow: "Lock & Layer"

The user doesn't just "see" data; they commit to a vision in stages.

1.  **Stage 1: The Candidate (Top 13)**
    *   User sees the "Hero" (Top Score) and "Runners-Up".
    *   Goal: Compare Growth Scores and select the **One True Winner**.
    *   Action: Click "Lock This Video".

2.  **Stage 2: The Title Lab (Winning Super Topic)**
    *   Once a video is locked, the "Title Module" unlocks.
    *   User sees 3 Title Lanes (e.g., "The Hook", "The Niche", "The Curiosity").
    *   Action: Click "Lock This Title Angle".

3.  **Stage 3: The Thumbnail Lab**
    *   Once title is locked, the "Thumbnail Module" unlocks.
    *   User sees 3-5 distinct visual concepts (Text + Composition).
    *   Action: Click "Proceed to Generation" (Page 5).

---

## 2. Layout Structure

## 2. Layout Structure: "The Inspection Deck"

### A. Top Tile: The Command Center (Gold) 🏆
A massive, cinematic card acting as the user's primary focus.
*   **Geometry**: **40% Left / 60% Right** split.
*   **Left (40%)**:
    *   **Top**: 16:9 Thumbnail Preview (Fixed Aspect Ratio).
    *   **Bottom**: "Viewer DNA" Grid (Emotion/Intent/Angle Pills).
*   **Right (60%)**: "Intelligence Panel".
    *   **Header**: Title (H1) + Classification Tags.
    *   **Body**: Textual Strategy (Porch Pitch, Why It Wins).
    *   **Footer**: Growth Score Bar + Action Buttons.

### B. Runners-Up (Silver) 🥈
*   **Layout**: Grid of 3 Cards.
*   **Visuals**: Silver border/glow.
*   **Content**: Thumbnail + Title + Emotion + Score.
*   **Actions**: Split Buttons: `[ 👁️ Inspect ] | [ ↑ Swap ]`.

### C. Contenders (Blue) 🔵
*   **Layout**: Grid of Cards (Same structure as Runners-up).
*   **Visuals**: Blue border/glow.
*   **Purpose**: Flattened hierarchy. No hidden data.
*   **Actions**: Split Buttons: `[ 👁️ Inspect ] | [ ↑ Swap ]`.

### D. The Inspection Drawer 🕵️‍♂️
*   A slide-over panel accessible from ANY card's "Inspect" button.
*   Shows the full "Deep Dive" report for that candidate without losing context.

---

## 3. The "Growth Fit Score" 📈
*   A single, unified metric (0-100).
*   **Formula**: weighted mix of (Topic Demand + Audience Fit + Suitability + CTR Potential).
*   **Visual**: A progress bar/gauge. "The more right, the better."

---

## 4. Account Persistence
*   **On Load**: All 13 Super Topics are saved to the user's `super_topics` table.
*   **Account Page**: User can view a list: "Session Name (Date) - 13 Candidates".
*   **Winning Status**: The "Locked" video is flagged as `is_winner = true`.

---

*Last Updated: December 7, 2025*
