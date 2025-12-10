-- Super Topics Database Cleanup Script
-- Run this to fix duplicate data and multiple winners

-- 1. First, let's see what we're dealing with
SELECT source_session_id, COUNT(*) as count 
FROM super_topics 
GROUP BY source_session_id 
ORDER BY count DESC;

-- 2. Check for multiple winners in any session
SELECT source_session_id, COUNT(*) as winner_count
FROM super_topics 
WHERE is_winner = true
GROUP BY source_session_id
HAVING COUNT(*) > 1;

-- 3. Reset ALL is_winner flags to false (clean slate)
UPDATE super_topics SET is_winner = false;

-- 4. For sessions with more than 13, keep only top 13 by growth_fit_score
-- First identify sessions with too many rows
WITH session_counts AS (
    SELECT source_session_id, COUNT(*) as cnt
    FROM super_topics
    GROUP BY source_session_id
    HAVING COUNT(*) > 13
),
rows_to_delete AS (
    SELECT st.id
    FROM super_topics st
    INNER JOIN session_counts sc ON st.source_session_id = sc.source_session_id
    WHERE st.id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY source_session_id 
                ORDER BY growth_fit_score DESC NULLS LAST
            ) as rn
            FROM super_topics
        ) ranked
        WHERE rn <= 13
    )
)
DELETE FROM super_topics WHERE id IN (SELECT id FROM rows_to_delete);

-- 5. Verify cleanup worked
SELECT source_session_id, COUNT(*) as count, SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as winners
FROM super_topics 
GROUP BY source_session_id 
ORDER BY count DESC;

-- Expected result: Every session has exactly 13 rows and 0 winners
