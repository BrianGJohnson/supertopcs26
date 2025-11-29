================================================================================
SUPER TOPICS BUILDER — TOAST STYLE GUIDE v1.0
================================================================================

This document defines the visual system for all toast notifications in the 
Super Topics Builder application. Toasts are non-blocking notifications that
appear in the corner of the screen to inform users of events without 
interrupting their workflow.

================================================================================
SECTION 1: TOAST VS MODAL — WHEN TO USE WHICH
================================================================================

USE A TOAST WHEN:
- Confirming an action completed successfully
- Providing status updates (background task finished)
- Showing non-critical information
- The user doesn't need to make a decision
- The notification can be safely ignored

USE A MODAL WHEN:
- The user must make a decision before continuing
- Displaying important content that requires focus
- Collecting user input (forms, selections)
- Confirming destructive actions (delete, discard)
- The action cannot proceed without user interaction

================================================================================
SECTION 2: TOAST CONTAINER POSITIONING
================================================================================

POSITION
- Fixed positioning
- Bottom: 1.5rem (24px) from viewport bottom
- Right: 1.5rem (24px) from viewport right
- Z-index: 300 (above modals at 200)

STACKING
- Multiple toasts stack vertically
- Gap between toasts: 0.75rem (12px)
- Newest toast appears at bottom
- Pointer-events: none on container, auto on individual toasts

================================================================================
SECTION 3: TOAST CARD
================================================================================

DIMENSIONS
- Width: 360px (fixed)
- Min height: Auto (content-driven)

APPEARANCE
- Background: #1A1E24 (dark surface, matches modal)
- Border: 1px, white at 10% opacity
- Border radius: 0.75rem (rounded-xl)
- Shadow: 2xl

ANIMATION — ENTER
- Slide in from right
- Fade in
- Duration: 200ms

ANIMATION — EXIT
- Slide out to right
- Fade out
- Duration: 150ms

================================================================================
SECTION 4: TOAST LAYOUT
================================================================================

INTERNAL PADDING
- All sides: 1rem (16px)

LAYOUT
- Flexbox, row direction
- Align items: start (top-aligned)
- Gap: 0.75rem (12px)

STRUCTURE
┌─────────────────────────────────────────────────────────────┐
│  [ICON]   Title Text                              [X]       │
│           Optional message text that can                    │
│           wrap to multiple lines.                           │
│           [Action Link →]                                   │
└─────────────────────────────────────────────────────────────┘

================================================================================
SECTION 5: TOAST ICON
================================================================================

ICON CONTAINER
- Size: 36px x 36px (w-9 h-9)
- Border radius: 0.5rem (rounded-lg)
- Background: Type accent color at 10% opacity
- Border: 1px, type accent color at 30% opacity
- Flex-shrink: 0

ICON
- Size: 20px
- Color: Type accent color (solid)

================================================================================
SECTION 6: TOAST CONTENT
================================================================================

TITLE
- Font size: 0.9375rem (15px)
- Font weight: Semibold (600)
- Text color: White
- Line height: Snug

MESSAGE (Optional)
- Font size: 0.875rem (14px)
- Font weight: Normal (400)
- Text color: White at 60% opacity
- Line height: Relaxed
- Margin top: 0.25rem (4px)

ACTION LINK (Optional)
- Font size: 0.875rem (14px)
- Font weight: Semibold (600)
- Text color: Type accent color
- Margin top: 0.5rem (8px)
- Includes arrow: " →"
- Hover: Slight opacity reduction

================================================================================
SECTION 7: CLOSE BUTTON
================================================================================

BUTTON
- Flex-shrink: 0
- Padding: 0.25rem (4px)
- Border radius: 0.375rem (rounded-md)
- Icon size: 16px

COLORS
- Default: White at 40% opacity
- Hover: White at 100%
- Hover background: White at 5% opacity

================================================================================
SECTION 8: TOAST TYPES
================================================================================

SUCCESS (Confirmation, completion)
- Accent color: #2BD899 (brand green)
- Icon: Checkmark (IconCheck)
- Use for: "Session complete", "Changes saved", "Created successfully"

INFO (Neutral information)
- Accent color: #4A90D9 (brand blue)
- Icon: Info circle (IconInfoCircle)
- Use for: "New feature available", "Tip", status updates

WARNING (Caution, attention needed)
- Accent color: #F5A623 (amber/orange)
- Icon: Alert triangle (IconAlertTriangle)
- Use for: "Session expiring", "Approaching limit", non-critical issues

ERROR (Something went wrong)
- Accent color: #D95555 (red)
- Icon: Alert triangle (IconAlertTriangle)
- Use for: "Failed to save", "Connection lost", errors

================================================================================
SECTION 9: AUTO-DISMISS BEHAVIOR
================================================================================

DEFAULT DURATION
- 5000ms (5 seconds)

DURATION BY TYPE (Recommended)
- Success: 4000ms (quick confirmation)
- Info: 5000ms (standard)
- Warning: 6000ms (give time to read)
- Error: 0 (no auto-dismiss, require manual close)

PERSISTENT TOASTS
- Set duration to 0 for toasts that shouldn't auto-dismiss
- Use for important notifications with actions
- User must click close or action link

================================================================================
SECTION 10: QUICK REFERENCE — KEY VALUES
================================================================================

COLORS
- Toast background:      #1A1E24
- Success accent:        #2BD899
- Info accent:           #4A90D9
- Warning accent:        #F5A623
- Error accent:          #D95555

FONT SIZES
- Title:                 0.9375rem (15px)
- Message:               0.875rem (14px)
- Action link:           0.875rem (14px)

OPACITIES
- Border:                10%
- Message text:          60%
- Close button default:  40%
- Icon background:       10%
- Icon border:           30%

SPACING
- Toast padding:         1rem (16px)
- Content gap:           0.75rem (12px)
- Stack gap:             0.75rem (12px)
- Screen offset:         1.5rem (24px)

DIMENSIONS
- Toast width:           360px
- Icon container:        36px x 36px
- Icon size:             20px
- Close icon size:       16px

================================================================================
SECTION 11: USAGE EXAMPLES
================================================================================

BASIC SUCCESS TOAST
```tsx
const { showToast } = useToast();

showToast({
  type: "success",
  title: "Session Complete",
  message: "Your YouTube Algorithm session is ready with 254 phrases.",
});
```

TOAST WITH ACTION LINK
```tsx
showToast({
  type: "success",
  title: "Session Complete",
  message: "Your expansion finished. 254 phrases are ready for review.",
  action: {
    label: "View Results",
    href: "/members/build/refine",
  },
});
```

TOAST WITH CLICK HANDLER
```tsx
showToast({
  type: "info",
  title: "New Feature",
  message: "Check out the new trend analysis tool.",
  action: {
    label: "Try It Now",
    onClick: () => router.push("/members/trends"),
  },
});
```

PERSISTENT ERROR TOAST
```tsx
showToast({
  type: "error",
  title: "Connection Lost",
  message: "Unable to reach the server. Please check your internet connection.",
  duration: 0, // Won't auto-dismiss
});
```

WARNING WITH CUSTOM DURATION
```tsx
showToast({
  type: "warning",
  title: "Session Expiring",
  message: "Your session will expire in 5 minutes. Save your work.",
  duration: 8000, // 8 seconds
});
```

================================================================================
SECTION 12: DO'S AND DON'TS
================================================================================

DO:
✓ Keep titles short and scannable (2-5 words)
✓ Make action labels clear and verb-forward ("View Results", "Try Again")
✓ Use appropriate type for the message context
✓ Let success/info toasts auto-dismiss
✓ Make error toasts persistent (duration: 0)
✓ Provide actions when the user can do something

DON'T:
✗ Use toasts for critical decisions (use modal instead)
✗ Stack more than 3 toasts at once (overwhelming)
✗ Use lengthy messages (keep under 2 lines)
✗ Show duplicate toasts for the same event
✗ Use warning/error for non-issues
✗ Require immediate action (user may be elsewhere)

================================================================================
SECTION 13: ACCESSIBILITY NOTES
================================================================================

- Toasts should not be the only way to communicate critical information
- Action links are keyboard-accessible
- Close button is keyboard-accessible
- Consider adding aria-live="polite" for screen readers (future enhancement)
- Auto-dismiss gives enough time to read (5+ seconds)

================================================================================
END OF TOAST STYLE GUIDE
================================================================================
