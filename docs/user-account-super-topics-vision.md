# User Account & Super Topics Vision

> **Status:** Future Feature (Not Yet Implemented)  
> **Purpose:** Document the vision for user account functionality and "My Super Topics" feature

---

## Overview

Each user has an account page accessible from the navigation. This page will contain billing, tokens, settings, and most importantly - their **Super Topics library**.

---

## Hierarchy

```
USER ACCOUNT
├── Channels (1-10 based on tier)
│   ├── Sessions (many per channel)
│   │   └── Seeds/Phrases (generated)
│   └── Super Topics (permanent, survives session deletion)
├── Tokens (balance, purchase history)
├── Billing (subscription, invoices)
└── Settings (preferences, profile)
```

---

## Database Support (Already Implemented ✅)

| Table | Key Fields | Purpose |
|-------|------------|---------|
| `user_profiles` | `account_tier`, `display_mode` | User settings, tier limits |
| `channels` | `user_id`, `is_default` | Multiple channels per user |
| `sessions` | `channel_id`, `user_id` | Research workspaces |
| `super_topics` | `channel_id`, `source_session_name` | Permanent phrase library |

### Key Design Decisions

1. **Super Topics survive session deletion** - `source_session_id` has no foreign key constraint
2. **Session name is copied** - `source_session_name` preserves it even if session deleted
3. **Channel hierarchy** - Topics belong to channels, not sessions
4. **Multi-channel support** - `account_tier` controls limits (basic=1, plus=3, pro=10)

---

## Account Page Sections

### 1. Profile & Settings
- Display name, email, avatar
- Display mode preference (essentials/full)
- Notification preferences

### 2. Billing & Tokens
- Current token balance (shown in nav: "3242 tokens")
- Purchase more tokens
- Subscription tier (basic/plus/pro)
- Invoice history

### 3. My Channels
- List of user's channels
- Switch active channel
- Channel settings (niche, goals, etc.)

### 4. My Super Topics ⭐
**This is the key feature discussed**

#### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ My Super Topics                                                 │
│ Your permanent library of high-potential video ideas            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Dec 9, 2025 — YouTube Algorithm (13 topics)              [View] │
│ Dec 7, 2025 — Content Creation (13 topics)               [View] │
│ Dec 5, 2025 — Video Editing (11 topics)                  [View] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Functionality
- **Grouped by session** - Shows session seed phrase and date
- **Count of topics** - How many super topics from that session
- **Expandable** - Click to see all phrases with scores
- **Filter by channel** - If user has multiple channels
- **Never deleted** - These are permanent records

#### Query Structure
```sql
SELECT 
  source_session_id,
  source_session_name,
  MIN(promoted_at) as session_date,
  COUNT(*) as topic_count,
  COUNT(*) FILTER (WHERE is_winner = true) as winners
FROM super_topics
WHERE channel_id = :channelId
GROUP BY source_session_id, source_session_name
ORDER BY session_date DESC;
```

---

## Channel Switching (Future)

Users with multiple channels need to switch between them.

### Approach
1. Add `active_channel_id` to `user_profiles`
2. Channel dropdown in nav bar (next to tokens)
3. All queries filter by active channel
4. Switching updates `active_channel_id` and refreshes page

---

## Implementation Priority

| Feature | Priority | Effort |
|---------|----------|--------|
| Super Topics generation (Page 4) | 🔴 NOW | In Progress |
| My Super Topics page | 🟡 Soon | 2-3 hours |
| Account page framework | 🟡 Soon | 2-3 hours |
| Channel switching | 🟢 Later | 1 day |
| Billing integration | 🟢 Later | TBD |

---

## Related Documentation

- `/docs/1-8-super-topics-fix-plan.md` - Current implementation plan
- `/docs/1-2-data-schema-super-topics.md` - Database schema details
- `/docs/1-5-ui-vision-super-topics.md` - Page 4 UI design

---

*Last Updated: December 9, 2025*
