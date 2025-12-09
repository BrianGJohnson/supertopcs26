# Dropdown Style Guide

This document defines the standard styling for all dropdown menus in SuperTopics to ensure visual consistency across the application.

## Color Palette

All dropdowns use a **neutral gray color scheme** (not purple/blue):

| Element | Value | Description |
|---------|-------|-------------|
| Background | `bg-[#1E2228]` | Dark charcoal gray |
| Border | `border-white/10` | Subtle 10% white border |
| Shadow | `shadow-2xl` | Deep shadow for elevation |
| Hover state | `hover:bg-white/5` | Subtle 5% white on hover |
| Active/Selected | `bg-white/5` | 5% white background |
| Text primary | `text-white` or `text-white/90` | Full or 90% white |
| Text secondary | `text-white/70` | 70% white for secondary |
| Text disabled | `text-white/40` | 40% white for disabled |
| Dividers | `border-white/10` | 10% white dividers |

## Standard Dropdown Structure

```tsx
<div className="w-72 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl">
  <div className="p-1 space-y-1">
    {/* Menu items */}
    <button className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors">
      <IconExample size={18} className="text-blue-400" />
      Menu Item
    </button>
    
    {/* Divider */}
    <div className="h-px bg-white/10 my-1 mx-2" />
    
    {/* More items... */}
  </div>
</div>
```

## Portal Pattern

Always render dropdowns via `createPortal` to avoid z-index issues:

```tsx
import { createPortal } from "react-dom";

// State
const [isOpen, setIsOpen] = useState(false);
const [position, setPosition] = useState({ top: 0, left: 0 });
const buttonRef = useRef<HTMLButtonElement>(null);
const dropdownRef = useRef<HTMLDivElement>(null);
const [isMounted, setIsMounted] = useState(false);

// Mount check for SSR
useEffect(() => {
  setIsMounted(true);
}, []);

// Position calculation
useEffect(() => {
  if (isOpen && buttonRef.current) {
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
  }
}, [isOpen]);

// Click outside handler
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (
      dropdownRef.current && 
      !dropdownRef.current.contains(target) &&
      buttonRef.current &&
      !buttonRef.current.contains(target)
    ) {
      setIsOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Render
{isMounted && isOpen && createPortal(
  <div 
    ref={dropdownRef}
    className="fixed z-[9999]"
    style={{ top: position.top, left: position.left }}
  >
    <div className="w-72 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl">
      {/* Content */}
    </div>
  </div>,
  document.body
)}
```

## Z-Index Hierarchy

| Element | Z-Index | Notes |
|---------|---------|-------|
| Dropdowns | `z-[9999]` | Standard dropdowns |
| Modals | `z-[10000]` | Above dropdowns |
| Toasts | `z-[10001]` | Above everything |

## Menu Item Variants

### Standard Item
```tsx
<button className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors">
  <IconExample size={18} className="text-blue-400" />
  Menu Item
</button>
```

### Item with Arrow (Submenu)
```tsx
<button className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors justify-between">
  <div className="flex items-center gap-3">
    <IconExample size={18} className="text-green-400" />
    Submenu Item
  </div>
  <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
</button>
```

### Selected Item (with checkmark)
```tsx
<button className="w-full px-4 py-3 text-left text-sm text-white bg-white/5 flex items-center justify-between transition-colors">
  <span className="truncate pr-2">Selected Item</span>
  <IconCheck size={14} className="text-green-400 flex-shrink-0" />
</button>
```

### Disabled Item
```tsx
<button 
  className="w-full px-4 py-3 text-left text-sm text-white/40 cursor-not-allowed"
  disabled
>
  Disabled Item
</button>
```

## Icon Colors

Standard icon color assignments for menu items:

| Action Type | Color | Class |
|-------------|-------|-------|
| Create/Add | Blue | `text-blue-400` |
| Switch/Change | Green | `text-green-400` |
| Settings/Manage | Gray | `text-gray-400` |
| Delete/Danger | Red | `text-red-400` |

## Submenu (Flyout) Pattern

For submenus that appear alongside the main menu:

```tsx
{showSubmenu && (
  <div className="absolute top-0 left-[18.5rem] w-64 bg-[#1E2228] border border-white/10 rounded-xl shadow-2xl animate-in fade-in slide-in-from-left-2 duration-100">
    <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar">
      {/* Submenu items */}
    </div>
  </div>
)}
```

## Animation Classes

Use Tailwind CSS animate-in utilities:

```
animate-in fade-in zoom-in-95 duration-100  // Main dropdown
animate-in fade-in slide-in-from-left-2 duration-100  // Flyout submenu
```

## Files Using This Pattern

- `/src/app/members/build/refine/_components/ActionToolbar.tsx` - Run Analysis, Session dropdown
- `/src/app/members/build/refine/_components/FilterToolbar.tsx` - All/Filter dropdown, Metric dropdown
- `/src/components/SessionMenu.tsx` - Session pill dropdown (Page 1)

## DO NOT USE

❌ `bg-[#1a1a2e]` - Old purple-ish background  
❌ `border-white/15` - Old border opacity  
❌ `bg-primary` or `bg-[#6B9BD1]` for dropdown backgrounds  
❌ Low z-index values like `z-50` or `z-[200]` for dropdowns  

## Related Documentation

- [Modal Style Guide](./modal-style-guide.md) - For modal dialogs
- [Brand Guidelines](./brand-guidelines.md) - Overall brand colors
