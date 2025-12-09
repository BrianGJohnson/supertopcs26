================================================================================
SUPER TOPICS BUILDER — MODAL STYLE GUIDE v1.0
================================================================================

This document defines the visual system for all modals in the Super Topics 
Builder application. All values are extracted from the current implementation
and should be used as the source of truth for future modals.

================================================================================
SECTION 1: MODAL CONTAINER
================================================================================

BACKDROP
- Position: Fixed, inset-0
- Z-index: 200
- Background: Black at 70% opacity (bg-black/70)
- Blur: backdrop-blur-sm
- Animation: fade-in, 150ms duration

MODAL CARD
- Position: Relative, z-10
- Width: Full with mx-4 (horizontal margin)
- Max width: 36rem (max-w-xl) — ~576px
- Background: #1A1E24 (dark surface)
- Border: 1px, white at 10% opacity
- Border radius: 1rem (rounded-2xl)
- Shadow: 2xl
- Animation: fade-in zoom-in-95, 150ms duration

================================================================================
SECTION 2: MODAL HEADER
================================================================================

HEADER CONTAINER
- Layout: Flex, items-center, justify-between
- Horizontal padding: 1.5rem (px-6)
- Vertical padding: 1.25rem (py-5)
- Border: Bottom only, white at 10% opacity

TITLE
- Font size: 1.375rem (22px) — text-[1.375rem]
- Font weight: Bold (font-bold)
- Text color: White (text-white)

CLOSE BUTTON
- Padding: 0.375rem (p-1.5)
- Border radius: 0.5rem (rounded-lg)
- Icon size: 20px
- Default color: White at 50% opacity
- Hover color: White
- Hover background: White at 5% opacity
- Transition: colors

================================================================================
SECTION 3: MODAL BODY
================================================================================

BODY CONTAINER
- Horizontal padding: 1.5rem (px-6)
- Vertical padding: 1.25rem (py-5)

DESCRIPTION/HELPER TEXT
- Font size: 1.125rem (18px) — text-[1.125rem]
- Text color: White at 60% opacity (text-white/60)
- Line height: Relaxed (leading-relaxed)
- Purpose: Primary instructions or context for the modal

BODY TEXT (Interactive Elements)
- Font size: 1.125rem (18px) — text-[1.125rem]
- Text color: White (for selected/active items)
- Text color (deselected): White at 35% opacity
- Line height: Snug (leading-snug)

INPUT FIELDS (within modal)
- Width: Full
- Horizontal padding: 1rem (px-4)
- Vertical padding: 0.75rem (py-3)
- Background: White at 10% opacity
- Border: 1px, white at 10% opacity
- Border radius: 0.5rem (rounded-lg)
- Font size: 1rem (text-base)
- Text color: White
- Placeholder color: White at 30% opacity
- Focus border: #6B9BD1 at 50%
- Focus ring: 1px, #6B9BD1 at 30% opacity

================================================================================
SECTION 4: MODAL FOOTER
================================================================================

FOOTER CONTAINER
- Layout: Flex, items-center, justify-end
- Gap: 0.75rem (gap-3)
- Horizontal padding: 1.5rem (px-6)
- Vertical padding: 1rem (py-4)
- Border: Top only, white at 10% opacity
- Background: Black at 20% opacity (bg-black/20)
- Border radius: Bottom only, 1rem (rounded-b-2xl)

================================================================================
SECTION 5: MODAL BUTTONS
================================================================================

BUTTON BASE
- Horizontal padding: 1.25rem (px-5)
- Vertical padding: 0.625rem (py-2.5)
- Border radius: 0.5rem (rounded-lg)
- Font size: 14px (text-sm)
- Font weight: Semibold (font-semibold)
- Transition: all

PRIMARY BUTTON (Confirm Action)
- Background: Gradient from #4A90D9 to #3A7BC8
- Hover background: Gradient from #5A9DE6 to #4A8BD8
- Text color: White
- Shadow: lg
- Use for: Save, Create, Confirm, Submit

SECONDARY BUTTON (Cancel/Dismiss)
- Background: White at 5% opacity
- Hover background: White at 10% opacity
- Text color: White at 80% opacity, hover White
- Border: 1px, white at 10% opacity
- Use for: Cancel, Close, Go Back

DANGER BUTTON (Destructive Action)
- Background: Gradient from #D95555 to #C94545
- Hover background: Gradient from #E66565 to #D95555
- Text color: White
- Shadow: lg
- Use for: Delete, Remove, Discard

================================================================================
SECTION 6: INTERACTIVE LIST ITEMS (e.g., Phrase Selection)
================================================================================

LIST CONTAINER
- Spacing: 0.5rem between items (space-y-2)

LIST ITEM BUTTON (Selected State)
- Layout: Flex, items-center
- Gap: 1rem (gap-4)
- Horizontal padding: 1.25rem (px-5)
- Vertical padding: 1rem (py-4)
- Background: White at 6% opacity (bg-white/[0.06])
- Border: 1px, white at 20% opacity
- Border radius: 0.75rem (rounded-xl)
- Text color: White
- Hover background: White at 10% opacity

LIST ITEM BUTTON (Deselected State)
- Background: Black at 30% opacity (bg-black/30)
- Border: 1px, white at 5% opacity
- Text color: White at 35% opacity
- Text decoration: line-through
- Hover background: White at 10% opacity

CHECKBOX INDICATOR (Selected)
- Size: 24px x 24px (w-6 h-6)
- Background: #2BD899 at 20% opacity
- Border: 2px, #2BD899 at 60% opacity
- Border radius: 0.375rem (rounded-md)
- Check icon: #2BD899, size 16px, stroke-width 3

CHECKBOX INDICATOR (Deselected)
- Size: 24px x 24px (w-6 h-6)
- Background: White at 10% opacity
- Border: 2px, white at 30% opacity
- Border radius: 0.375rem (rounded-md)
- No icon

================================================================================
SECTION 7: SECONDARY UI ELEMENTS
================================================================================

SELECTION SUMMARY BAR
- Layout: Flex, items-center, justify-between
- Font size: 1.125rem (text-[1.125rem])
- Text color: White at 60% opacity
- Padding bottom: 1rem (pb-4)
- Border bottom: 1px, white at 10% opacity

SELECT/DESELECT ALL BUTTON (Text Link)
- Text color: #2BD899 (brand green)
- Hover color: #2BD899 at 80% opacity
- Font weight: Semibold (font-semibold)
- Transition: colors

================================================================================
SECTION 8: EMPTY STATE
================================================================================

EMPTY STATE CONTAINER
- Text alignment: Center
- Vertical padding: 2rem (py-8)
- Font size: 1.125rem (text-[1.125rem])
- Text color: White at 40% opacity

================================================================================
SECTION 9: QUICK REFERENCE — KEY VALUES
================================================================================

COLORS
- Modal background:      #1A1E24
- Backdrop:              Black at 70%
- Primary button:        #4A90D9 → #3A7BC8
- Secondary button bg:   White at 5%
- Danger button:         #D95555 → #C94545
- Brand accent:          #2BD899

FONT SIZES (Modal-Specific)
- Modal title:           1.375rem (22px)
- Description text:      1.125rem (18px)
- Body/list text:        1.125rem (18px)
- Button text:           14px (0.875rem)

OPACITIES
- Backdrop:              70%
- Modal border:          10%
- Description text:      60%
- Deselected items:      35%
- Secondary button text: 80%
- Empty state text:      40%

SPACING
- Modal horizontal pad:  1.5rem (24px)
- Header vertical pad:   1.25rem (20px)
- Body vertical pad:     1.25rem (20px)
- Footer vertical pad:   1rem (16px)
- Button gap:            0.75rem (12px)
- List item gap:         0.5rem (8px)

BORDER RADIUS
- Modal card:            1rem (rounded-2xl)
- Buttons:               0.5rem (rounded-lg)
- List items:            0.75rem (rounded-xl)
- Checkbox:              0.375rem (rounded-md)

================================================================================
SECTION 10: USAGE EXAMPLES
================================================================================

CONFIRMATION MODAL (Simple)
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  footer={
    <>
      <ModalButton variant="secondary" onClick={onClose}>
        Cancel
      </ModalButton>
      <ModalButton variant="primary" onClick={handleConfirm}>
        Confirm
      </ModalButton>
    </>
  }
>
  <p className="text-white/60 text-[1.125rem] leading-relaxed">
    Are you sure you want to proceed with this action?
  </p>
</Modal>
```

INPUT MODAL
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Create New Item"
  footer={
    <>
      <ModalButton variant="secondary" onClick={onClose}>
        Cancel
      </ModalButton>
      <ModalButton variant="primary" onClick={handleCreate}>
        Create
      </ModalButton>
    </>
  }
>
  <div className="space-y-4">
    <p className="text-white/60 text-[1.125rem] leading-relaxed">
      Enter a name for your new item.
    </p>
    <input
      type="text"
      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-base text-white placeholder-white/30 focus:outline-none focus:border-[#6B9BD1]/50 focus:ring-1 focus:ring-[#6B9BD1]/30 transition-all"
      placeholder="Enter name..."
    />
  </div>
</Modal>
```

SELECTION MODAL
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Select Items"
  footer={
    <>
      <ModalButton variant="secondary" onClick={onClose}>
        Cancel
      </ModalButton>
      <ModalButton variant="primary" onClick={handleSave}>
        Save {selectedCount} Items
      </ModalButton>
    </>
  }
>
  <div className="space-y-4">
    <p className="text-white/60 text-[1.125rem] leading-relaxed">
      Click any item to select or deselect it.
    </p>
    <div className="flex items-center justify-between text-[1.125rem] text-white/60 pb-4 border-b border-white/10">
      <span>{selectedCount} of {totalCount} selected</span>
      <button className="text-[#2BD899] hover:text-[#2BD899]/80 transition-colors font-semibold">
        Select All
      </button>
    </div>
    {/* List items here */}
  </div>
</Modal>
```

================================================================================
SECTION 11: DO'S AND DON'TS
================================================================================

DO:
✓ Use description text at 60% opacity for helper instructions
✓ Keep modal titles concise (2-4 words)
✓ Use primary button for the main action
✓ Use secondary button for cancel/dismiss
✓ Include escape key support (handled by Modal component)
✓ Lock body scroll when modal is open (handled by Modal component)

DON'T:
✗ Use font sizes smaller than 1.125rem (18px) for body text
✗ Use font sizes smaller than 1.375rem (22px) for titles
✗ Add scrollbars if content can fit without them
✗ Use colors outside the defined palette
✗ Stack more than 2 buttons in footer (use action dropdowns instead)
✗ Make modals wider than max-w-xl without good reason

================================================================================
END OF MODAL STYLE GUIDE
================================================================================
