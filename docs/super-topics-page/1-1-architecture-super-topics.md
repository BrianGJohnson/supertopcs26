# Page 4 Architecture: Super Topics

> **Source of Truth** for the "brain" of the Builder Module.

---

## 1. The Strategy: "13 Parallel Calls" ⚡️
Instead of one batch prompt, we run **13 parallel requests** (one per phrase).
*   **Why?**: Rich data for *every* candidate, not just top 4.
*   **Cost**: < $0.01 total (approx).
*   **Sorting**: We calculate the "Growth Fit Score" locally based on the returned data.

---

## 2. The Data Payload (Per Phrase)

### A. Strategic Context (The "Report")
1.  **Porch Pitch**: 2-sentence conversational sell.
2.  **The Angle**: One-sentence hook concept.
3.  **Why It Wins**: Algo-match reasoning.

### B. Classifications (Tags)
4.  **Format**: (e.g., "The Tutorial" / "Quick Fix").
5.  **Bucket**: (e.g., "Evergreen Asset").
6.  **Intent**: (Goal: "Learn/Solve" | Mindset: "Active").

### C. The Scores (0-10)
7.  **Suitability**: Fit for this specific channel.
8.  **Effort**: Difficulty to execute.
9.  **CTR Potential**: Based on emotion (Fear/Curiosity = High).

---

## 3. The "Winning Super Topic" Flow (Progressive Reveal)

We do NOT generate Title/Thumbnail specifics yet. We wait for the **USER LOCK**.

1.  **Step 1: The Inspection Deck (Page Load)**
    *   All 13 phrases analyzed for Strategy/Classification/Scores.
    *   **New**: User can "Inspect" *any* candidate (Winner, Runner-up, Contender) to see full data.
    *   User chooses the **Winning Super Topic**.

2.  **Step 2: Title Lab (On Lock)**
    *   User commits to the video.
    *   We reveal 3 Title Lanes (Hook, Niche, Curiosity).
    *   User locks a Title Angle.

3.  **Step 3: Thumbnail Lab (On Lock)**
    *   User commits to the title.
    *   We reveal 3-5 Thumbnail Concepts (Visual Vibe + Text).
    *   User proceeds to Generation.

---

## 4. The Growth Fit Score (Composite)
A local calculation used to sort the 13 candidates.
`GrowthScore = (Demand * 0.3) + (AudienceFit * 0.3) + (Suitability * 0.2) + (CTR_Potential * 0.2)`

---

*Last Updated: December 7, 2025*
