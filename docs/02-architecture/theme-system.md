# Theme System Implementation

## Overview

A comprehensive theme system and UI component library has been implemented for the Professional Life Management Platform, providing a professional, accessible, and responsive user interface.

## What Was Implemented

### 1. Theme System (Task 14.1)

#### Theme Provider
- **Location**: `lib/theme/theme-provider.tsx`
- **Features**:
  - Three theme modes: Light, Dark, and Auto
  - Auto mode respects system preferences
  - Theme persistence using localStorage
  - Automatic theme application to document root
  - React context for theme access throughout the app

#### Design Tokens
- **Location**: `lib/theme/design-tokens.ts`
- **Includes**:
  - Professional color palette (Primary, Secondary, Success, Warning, Error, Neutral)
  - Consistent spacing scale
  - Typography system (font families, sizes, weights)
  - Border radius values
  - Shadow definitions
  - Transition timings
  - Z-index layers

#### Global Styles
- **Location**: `app/globals.css`
- **Features**:
  - CSS variables for light and dark themes (see [Token reference](#token-reference) below)
  - Smooth theme transitions (scoped to a single `[data-theme-transition]` attribute on `<html>`, set only at toggle — avoids a permanent transition on every hover/focus)
  - Reduced motion support
  - Professional animations (fade-in, slide-in, slide-up, scale-in)
  - `.bento-card` surface helper (see [Surface depth](#surface-depth) below)

## Surface depth

The platform uses two card primitives that need to look identical on the page:

| Primitive | Where | Implementation |
|---|---|---|
| `<BentoCard>` React component | `components/dashboard/bento-card.tsx` | `border + bg-card + shadow-sm` + a subtle `before:bg-gradient-to-br from-foreground/[0.03]` overlay; entrance animation via Framer Motion. |
| `.bento-card` CSS class | `app/globals.css` | `border + background + box-shadow` (light mode only). Used directly in 27 module files where the React wrapper would be overkill. |

**Why both have to ship a shadow:** in light mode the page background (`--background`) and card surface (`--card`) differ by only ~10/255. The 1px border alone is too faint to give the card visible elevation, so the `.bento-card` class adds a soft `box-shadow` in light mode. In dark mode the brightness step between page (#09090b) and card (#18181b) does the work on its own, and a shadow there reads as a smudge — so `.dark .bento-card { box-shadow: none }` suppresses it.

```css
.bento-card {
  position: relative;
  border-radius: var(--card-radius);
  background: rgb(var(--card));
  border: 1px solid rgb(var(--border));
  box-shadow:
    0 1px 2px 0 rgb(15 23 42 / 0.04),
    0 1px 3px 0 rgb(15 23 42 / 0.06);
}

.dark .bento-card { box-shadow: none; }
```

If you create a new card-like surface, prefer one of these two primitives so light/dark stays coherent. Don't reach for raw `bg-white` + custom shadow.

## Token reference

All tokens are RGB triplets so they compose cleanly with Tailwind opacity utilities (e.g. `bg-card/80`).

### Light theme

| Token | Value | Notes |
|---|---|---|
| `--background` | `244 246 251` | Page bg. Slightly cooler than card to give cards visible elevation. |
| `--card` | `255 255 255` | Pure white card surface. |
| `--foreground` | `15 23 42` | Slate-900 — primary text on card and page. |
| `--muted` | `238 242 248` | Input bg, hover, badge bg, skeleton boxes. |
| `--muted-foreground` | `90 105 130` | Secondary text on cards (slightly cooler/darker than slate-500 for legibility). |
| `--border` / `--input` | `215 222 235` | Strong enough to define cards without going Material-heavy. |
| `--primary` | `79 70 229` | Indigo-600. |
| `--success` / `--warning` / `--destructive` | `22 163 74` / `234 88 12` / `239 68 68` | |
| `--chart-1..5` | indigo / sky / green / orange / pink | Used for dashboard KPI tints and trend chart strokes. |

### Dark theme

| Token | Value | Notes |
|---|---|---|
| `--background` | `9 9 11` | Near-black page. |
| `--card` | `24 24 27` | One stop brighter than page — provides surface contrast without shadows. |
| `--foreground` | `250 250 250` | |
| `--muted` / `--accent` | `39 39 42` | |
| `--muted-foreground` | `161 161 170` | |
| `--border` / `--input` | `39 39 42` | Same as muted — borders are visual hinges, not separators. |
| `--primary` | `129 140 248` | Indigo-400 (lighter for dark bg legibility). |
| `--chart-1..5` | indigo-400 / sky-400 / green-400 / orange-400 / pink-400 | Color family preserved, brightness raised. |

When you need to read a color in JS or pass it to Recharts, use `getComputedStyle(document.documentElement).getPropertyValue('--chart-3')` and wrap the result in `rgb(...)`.

#### Theme Toggle Component
- **Location**: `components/ui/theme-toggle.tsx`
- Visual toggle buttons for switching between Light, Dark, and Auto modes

### 2. Core UI Components (Task 14.3)

#### Enhanced Existing Components
- **Button**: Added success/warning variants, icon size, theme-aware colors
- **Card**: Theme-aware with proper semantic structure
- **Input**: Enhanced with focus states and theme support
- **Badge**: Multiple variants with theme support

#### New Components Created

**Dialog/Modal System**
- **Location**: `components/ui/dialog.tsx`
- Full-featured modal with backdrop, keyboard support, and animations

**Toast Notification System**
- **Location**: `components/ui/toast.tsx`
- Context-based toast system with multiple variants
- Auto-dismiss functionality
- Stacked notifications

**Loading Components**
- **Location**: `components/ui/loading-spinner.tsx`
- LoadingSpinner with multiple sizes
- LoadingOverlay for full-page loading
- LoadingButton for async actions

**Skeleton Components**
- **Location**: `components/ui/skeleton.tsx`
- Base Skeleton component
- Pre-built SkeletonCard, SkeletonTable, SkeletonText

**Form Components**
- **Location**: `components/ui/form.tsx`
- Form, FormField, FormLabel, FormDescription, FormMessage
- Built-in validation support

**Additional Input Components**
- **Textarea**: `components/ui/textarea.tsx`
- **Select**: `components/ui/select.tsx`

### 3. Animations and Transitions (Task 14.4)

#### Animation Utilities
- **Location**: `lib/animations.ts`
- **Features**:
  - Reduced motion detection
  - Animation helper functions
  - Pre-defined animation variants
  - Stagger delay calculations
  - Page, modal, and toast transition configs

#### Page Transition Components
- **Location**: `components/ui/page-transition.tsx`
- **Components**:
  - PageTransition: Smooth page entry animations
  - FadeIn: Fade-in with configurable delay
  - SlideIn: Directional slide animations (up, down, left, right)
- All respect reduced motion preferences

### 4. Responsive Design (Task 14.5)

#### Responsive Utilities
- **Location**: `lib/responsive.ts`
- **Hooks**:
  - `useMediaQuery`: Custom media query hook
  - `useIsMobile`: Mobile detection
  - `useIsTablet`: Tablet detection
  - `useIsDesktop`: Desktop detection
  - `useBreakpoint`: Current breakpoint detection
  - `useViewport`: Viewport dimensions
- **Functions**:
  - `isTouchDevice`: Touch capability detection

#### Mobile Navigation
- **Location**: `components/ui/mobile-nav.tsx`
- **Components**:
  - MobileNav: Slide-out mobile menu
  - BottomNav: Bottom navigation bar
- Features: Backdrop, keyboard support, route change handling

#### Layout Components
- **Location**: `components/ui/container.tsx`
- **Components**:
  - Container: Responsive container with size variants
  - ResponsiveGrid: Configurable responsive grid
  - Stack: Vertical layout
  - Inline: Horizontal layout

#### Responsive Layout System
- **Location**: `components/layout/responsive-layout.tsx`
- **Components**:
  - ResponsiveLayout: Full page layout with sidebar
  - TwoColumnLayout: Two-column responsive layout
  - ThreeColumnLayout: Three-column responsive layout
- Features: Mobile sidebar, sticky headers, responsive breakpoints

## Integration

### Root Layout Updated
- **Location**: `app/layout.tsx`
- ThemeProvider wrapped around the entire application
- `suppressHydrationWarning` added to prevent hydration mismatches

### Component Index
- **Location**: `components/ui/index.ts`
- Centralized exports for all UI components
- Easy imports: `import { Button, Card } from '@/components/ui'`

## Documentation

### Component Documentation
- **Location**: `components/ui/README.md`
- Comprehensive guide for all components
- Usage examples
- Best practices
- Accessibility guidelines

### This Document
- **Location**: `THEME_SYSTEM.md`
- Implementation overview
- File structure
- Feature summary

## Key Features

### Accessibility
- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader support
- ✅ Reduced motion support

### Performance
- ✅ CSS variables for instant theme switching
- ✅ Minimal JavaScript for theme management
- ✅ Optimized animations
- ✅ Lazy loading support

### Developer Experience
- ✅ TypeScript support throughout
- ✅ Consistent API across components
- ✅ Comprehensive documentation
- ✅ Easy to extend and customize

### Professional Design
- ✅ Sophisticated color palette
- ✅ Consistent spacing and typography
- ✅ Subtle animations
- ✅ Professional aesthetic

## Usage Examples

### Theme Switching
```tsx
import { useTheme } from '@/lib/theme/theme-provider'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  return <button onClick={() => setTheme('dark')}>Dark Mode</button>
}
```

### Responsive Design
```tsx
import { useIsMobile } from '@/lib/responsive'

function MyComponent() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileView /> : <DesktopView />
}
```

### Toast Notifications
```tsx
import { useToast } from '@/components/ui/toast'

function MyComponent() {
  const { addToast } = useToast()
  
  const handleSuccess = () => {
    addToast({
      title: 'Success!',
      description: 'Your changes have been saved.',
      variant: 'success',
    })
  }
}
```

## Next Steps

To use the theme system in your pages:

1. **Wrap with ToastProvider** (if using toasts):
```tsx
import { ToastProvider } from '@/components/ui/toast'

<ToastProvider>
  <YourApp />
</ToastProvider>
```

2. **Use PageTransition** for smooth page loads:
```tsx
import { PageTransition } from '@/components/ui/page-transition'

export default function Page() {
  return (
    <PageTransition>
      <YourContent />
    </PageTransition>
  )
}
```

3. **Add ThemeToggle** to your header:
```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle'

<header>
  <ThemeToggle />
</header>
```

## Testing

All components are TypeScript-compliant with no compilation errors. The theme system has been integrated into the root layout and is ready for use throughout the application.

## Compliance

This implementation satisfies:
- ✅ Requirement 9.1: Professional interface with customizable themes
- ✅ Requirement 9.2: Consistent design language and smooth transitions
- ✅ Requirement 9.4: Subtle animations with reduced motion support
- ✅ Requirement 9.5: Full functionality with responsive design
