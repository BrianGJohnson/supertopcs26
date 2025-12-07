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

### Top Tile: The Command Center 🎛️
Dominates the top 60% of the screen. Always shows the **Current Focus**.

**A. Toggles (Top Right)**
*   **👁️ Video View**: Visual hero card of the current focus.
*   **📊 Growth Fit**: A bar chart comparing the "Growth Score" of all 13 topics.

**B. The "Hero" State (Video View)**
*   **Visual**: Large Mock Player (Gold).
*   **Data**: The "Report" (Porch Pitch, Angle, Why It Wins).
*   **Actions**:
    *   `[Lock This Video]` -> **Effect**: Promotes to "Walking Summary" and unlocks Title Lab.
    *   `[Swap]` -> Available on all runner-up cards to promote them to this slot.
    *   `[View on YouTube]` -> External Link.
    *   `[Report]` -> Opens detailed side-panel report.

### Middle Area: The Runners-Up (Silver) 🥈
*   **Prior to Lock**: Shows the next best options.
*   **Action**: `[Swap]` promotes them to Top Tile.

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
