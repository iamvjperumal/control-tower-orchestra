# UI Design Mockup - Visual Reference Guide

## Color Palette Visualization

### Primary Colors
```
┌─────────────────────────────────────────────────────────┐
│ Background Hierarchy                                     │
├─────────────────────────────────────────────────────────┤
│ Base:     #07080e  ████████  Darkest background         │
│ Elevated: #0a0b13  ████████  Sidebar, elevated areas    │
│ Card:     #0f1019  ████████  Card backgrounds           │
│ Hover:    #151621  ████████  Card hover state           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Accent Colors                                            │
├─────────────────────────────────────────────────────────┤
│ Purple:   #8b5cf6  ████████  Primary brand color        │
│ Green:    #34d399  ████████  Success, positive          │
│ Red:      #f87171  ████████  Error, critical            │
│ Amber:    #fbbf24  ████████  Warning, attention         │
│ Blue:     #60a5fa  ████████  Info, neutral              │
│ Orange:   #fb923c  ████████  Fleet accent               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Text Hierarchy                                           │
├─────────────────────────────────────────────────────────┤
│ Primary:   #f5f5f7  ████████  Main text, headings       │
│ Secondary: #a1a1aa  ████████  Body text, labels         │
│ Muted:     #52525b  ████████  Captions, hints           │
│ Disabled:  #3f3f46  ████████  Disabled states           │
└─────────────────────────────────────────────────────────┘
```

---

## Component Examples

### Card Component States

```
┌─────────────────────────────────────────────────────────┐
│ Default Card                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                       │ │
│ │  Card Title                                           │ │
│ │  Card content with proper spacing and typography     │ │
│ │                                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Background: #0f1019                                    │
│ • Border: 1px solid #1a1b2e                             │
│ • Padding: 24px                                          │
│ • Border Radius: 16px                                    │
│ • Shadow: 0 2px 8px rgba(0,0,0,0.12)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Hover Card (Lifted)                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                       │ │
│ │  Card Title                                           │ │
│ │  Card content with glow effect                       │ │
│ │                                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Transform: translateY(-2px)                            │
│ • Border: 1px solid rgba(139,92,246,0.3)                │
│ • Shadow: 0 4px 16px rgba(0,0,0,0.16)                   │
│ • Glow: 0 0 0 1px rgba(139,92,246,0.1)                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Glass Card (Premium)                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ░░  Card Title                                    ░░ │ │
│ │ ░░  Frosted glass effect with blur               ░░ │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Background: rgba(15,16,25,0.7)                         │
│ • Backdrop Filter: blur(12px)                            │
│ • Border: 1px solid rgba(255,255,255,0.1)               │
└─────────────────────────────────────────────────────────┘
```

### Button Variants

```
┌─────────────────────────────────────────────────────────┐
│ Primary Button                                           │
│ ┌───────────────────────────────────────────┐           │
│ │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │           │
│ │  ▓▓▓▓▓▓▓▓▓▓▓  Button Text  ▓▓▓▓▓▓▓▓▓▓▓▓  │           │
│ │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │           │
│ └───────────────────────────────────────────┘           │
│ • Gradient: linear-gradient(135deg, #7c3aed, #a78bfa)   │
│ • Shadow: 0 4px 16px rgba(124,58,237,0.3)               │
│ • Hover: translateY(-2px) + stronger shadow             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Secondary Button                                         │
│ ┌───────────────────────────────────────────┐           │
│ │  ┌─────────────────────────────────────┐  │           │
│ │  │         Button Text                 │  │           │
│ │  └─────────────────────────────────────┘  │           │
│ └───────────────────────────────────────────┘           │
│ • Background: transparent                                │
│ • Border: 1px solid #1a1b2e                             │
│ • Hover: background rgba(255,255,255,0.05)              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Ghost Button                                             │
│ ┌───────────────────────────────────────────┐           │
│ │           Button Text                      │           │
│ └───────────────────────────────────────────┘           │
│ • Background: transparent                                │
│ • No border                                              │
│ • Hover: background rgba(255,255,255,0.05)              │
└─────────────────────────────────────────────────────────┘
```

### Input Fields

```
┌─────────────────────────────────────────────────────────┐
│ Default Input                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Placeholder text...                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Height: 40px                                           │
│ • Padding: 0 16px                                        │
│ • Border: 1px solid #1a1b2e                             │
│ • Border Radius: 12px                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Focused Input                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │▓ User input text...                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Border: 1px solid #a78bfa                             │
│ • Shadow: 0 0 0 3px rgba(139,92,246,0.1)                │
│ • Background: #1a1b2e (elevated)                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Input with Icon                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍  Search placeholder...                            │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Icon position: absolute left 12px                      │
│ • Input padding-left: 40px                               │
└─────────────────────────────────────────────────────────┘
```

---

## Layout Examples

### Navigation Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────┐                                                              │
│ │ 🚀  │  RetailOps  │  Dashboard  Digital Twin  Governance  Replay  │
│ └─────┘   CONTROL   │                                                │
│           TOWER     │                                    ● Connected │
└─────────────────────────────────────────────────────────────────────┘
│ Height: 64px                                                          │
│ Backdrop Filter: blur(16px)                                           │
│ Background: rgba(10,11,19,0.85)                                       │
│ Border Bottom: 1px solid #1a1b2e                                      │
└───────────────────────────────────────────────────────────────────────┘
```

### Dashboard Grid Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Page Header                                                           │
│ Dashboard                                              [RETAIL]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │                  │ │              │ │              │             │
│ │  Overview Card   │ │ Risk Gauge   │ │ Activity     │             │
│ │  (Large)         │ │              │ │ Chart        │             │
│ │                  │ │              │ │              │             │
│ └──────────────────┘ └──────────────┘ └──────────────┘             │
│                                                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Stat 1   │ │ Stat 2   │ │ Stat 3   │ │ Stat 4   │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                       │
│ ┌──────────────────────┐ ┌────────────────────────────────┐         │
│ │                      │ │                                │         │
│ │  Live Events Feed    │ │  AI Recommendations            │         │
│ │                      │ │                                │         │
│ │                      │ │                                │         │
│ └──────────────────────┘ └────────────────────────────────┘         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Case Selector Cards

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                    🚀  CTO — Control Tower Orchestra                 │
│                    Real-Time AI Decision Platform                    │
│                                                                       │
│  [Architecture]  [Presentation]                                      │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 🛒 [LIVE]    │  │ 🚚 [LIVE]    │  │ 🏥 [SOON]    │              │
│  │              │  │              │  │              │              │
│  │ RetailOps    │  │ FleetOps     │  │ CareFlow AI  │              │
│  │ Control      │  │ Control      │  │              │              │
│  │ Tower        │  │ Tower        │  │              │              │
│  │              │  │              │  │              │              │
│  │ Description  │  │ Description  │  │ Description  │              │
│  │ ...          │  │ ...          │  │ ...          │              │
│  │              │  │              │  │              │              │
│  │ [Tags]       │  │ [Tags]       │  │ [Tags]       │              │
│  │              │  │              │  │              │              │
│  │ Launch →     │  │ Launch →     │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Animation Sequences

### Card Hover Animation
```
State 1 (Default):
  transform: translateY(0)
  shadow: 0 2px 8px rgba(0,0,0,0.12)
  border: 1px solid #1a1b2e

  ↓ (300ms cubic-bezier)

State 2 (Hover):
  transform: translateY(-2px)
  shadow: 0 4px 16px rgba(0,0,0,0.16)
  border: 1px solid rgba(139,92,246,0.3)
  glow: 0 0 0 1px rgba(139,92,246,0.1)
```

### Button Click Animation
```
State 1 (Default):
  transform: scale(1)
  
  ↓ (100ms)
  
State 2 (Active):
  transform: scale(0.98)
  ripple effect from click point
  
  ↓ (200ms)
  
State 3 (Release):
  transform: scale(1)
```

### Page Load Animation
```
Elements fade in sequentially:

1. Navigation (0ms)
   opacity: 0 → 1
   translateY: 10px → 0

2. Page Header (100ms delay)
   opacity: 0 → 1
   translateY: 10px → 0

3. Cards (staggered 50ms each)
   Card 1: 150ms delay
   Card 2: 200ms delay
   Card 3: 250ms delay
   ...
```

---

## Spacing System

```
┌─────────────────────────────────────────────────────────┐
│ Spacing Scale (4px base unit)                            │
├─────────────────────────────────────────────────────────┤
│ xs:   4px   ▌                                            │
│ sm:   8px   ▌▌                                           │
│ md:  12px   ▌▌▌                                          │
│ lg:  16px   ▌▌▌▌                                         │
│ xl:  24px   ▌▌▌▌▌▌                                       │
│ 2xl: 32px   ▌▌▌▌▌▌▌▌                                     │
│ 3xl: 48px   ▌▌▌▌▌▌▌▌▌▌▌▌                                 │
└─────────────────────────────────────────────────────────┘

Component Spacing Examples:
┌─────────────────────────────────────────────────────────┐
│ Card Padding: 24px (xl)                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │←24px→                                        ←24px→│ │
│ │  ↑                                                  │ │
│ │ 24px  Content Area                                 │ │
│ │  ↓                                                  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Grid Gap: 20px
┌────────┐ ←20px→ ┌────────┐ ←20px→ ┌────────┐
│ Card 1 │        │ Card 2 │        │ Card 3 │
└────────┘        └────────┘        └────────┘
```

---

## Typography Scale

```
┌─────────────────────────────────────────────────────────┐
│ Heading Hierarchy                                        │
├─────────────────────────────────────────────────────────┤
│ H1: 36px / 800 weight / -0.025em spacing                │
│     Main Page Titles                                     │
│                                                          │
│ H2: 28px / 700 weight / -0.025em spacing                │
│     Section Headers                                      │
│                                                          │
│ H3: 22px / 700 weight / -0.025em spacing                │
│     Card Titles                                          │
│                                                          │
│ H4: 18px / 600 weight / -0.02em spacing                 │
│     Subsection Headers                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Body Text                                                │
├─────────────────────────────────────────────────────────┤
│ Base: 14px / 400 weight / 1.65 line-height              │
│       Primary content text                               │
│                                                          │
│ Small: 12px / 400 weight / 1.5 line-height              │
│        Secondary information                             │
│                                                          │
│ XSmall: 11px / 400 weight / 1.5 line-height             │
│         Captions, hints, metadata                        │
└─────────────────────────────────────────────────────────┘
```

---

## Accessibility Features

### Focus States
```
┌─────────────────────────────────────────────────────────┐
│ Keyboard Focus Indicator                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │  Focused Element                                 │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Outline: 2px solid #a78bfa                            │
│ • Outline Offset: 2px                                    │
│ • Visible on keyboard navigation only                    │
└─────────────────────────────────────────────────────────┘
```

### Color Contrast
```
Text on Background Contrast Ratios:
✓ Primary text (#f5f5f7) on Base (#07080e): 14.2:1 (AAA)
✓ Secondary text (#a1a1aa) on Base (#07080e): 7.8:1 (AAA)
✓ Muted text (#52525b) on Base (#07080e): 4.6:1 (AA)
✓ White text on Purple (#8b5cf6): 4.8:1 (AA)
```

---

## Implementation Notes

1. **Use CSS Variables**: All colors, spacing, and typography should use CSS custom properties
2. **Mobile First**: Design for mobile, enhance for desktop
3. **Performance**: Use transform and opacity for animations
4. **Consistency**: Follow the design system strictly
5. **Accessibility**: Ensure proper focus states and contrast ratios

---

## Quick Reference

### Most Common Patterns
- Card padding: `24px`
- Grid gap: `20px`
- Button height: `40px` (medium)
- Input height: `40px`
- Border radius: `12px` (medium)
- Transition: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- Hover lift: `translateY(-2px)`
- Focus ring: `0 0 0 3px rgba(139, 92, 246, 0.1)`