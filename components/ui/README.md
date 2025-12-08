# UI Components

Professional, accessible, and responsive UI components for the Professional Life Management Platform.

## Theme System

The application supports three theme modes:
- **Light**: Professional light theme
- **Dark**: Sophisticated dark theme
- **Auto**: Automatically matches system preference

### Using the Theme

```tsx
import { useTheme } from '@/lib/theme/theme-provider'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  )
}
```

### Theme Toggle Component

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle'

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  )
}
```

## Core Components

### Button

Professional button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outlined</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>

<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

### Card

Container component for content sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Input & Form

Form input components with validation support.

```tsx
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form'

<Form onSubmit={handleSubmit}>
  <FormField error={errors.email}>
    <FormLabel required>Email</FormLabel>
    <Input type="email" placeholder="you@example.com" />
    <FormMessage>{errors.email}</FormMessage>
  </FormField>
</Form>
```

### Dialog/Modal

Modal dialog component.

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast Notifications

Toast notification system for user feedback.

```tsx
import { useToast } from '@/components/ui/toast'

function MyComponent() {
  const { addToast } = useToast()
  
  const showNotification = () => {
    addToast({
      title: 'Success',
      description: 'Your changes have been saved.',
      variant: 'success',
      duration: 5000,
    })
  }
  
  return <Button onClick={showNotification}>Save</Button>
}
```

Don't forget to wrap your app with `ToastProvider`:

```tsx
import { ToastProvider } from '@/components/ui/toast'

<ToastProvider>
  <App />
</ToastProvider>
```

### Loading States

Loading indicators and skeleton screens.

```tsx
import { LoadingSpinner, LoadingOverlay, Skeleton, SkeletonCard } from '@/components/ui'

// Spinner
<LoadingSpinner size="md" />

// Full page overlay
<LoadingOverlay>Loading your data...</LoadingOverlay>

// Skeleton placeholders
<Skeleton className="h-10 w-full" />
<SkeletonCard />
```

### Badge

Status and label badges.

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

## Layout Components

### Container

Responsive container with max-width constraints.

```tsx
import { Container } from '@/components/ui/container'

<Container size="xl">
  Content with max-width
</Container>
```

### Responsive Grid

Responsive grid layout.

```tsx
import { ResponsiveGrid } from '@/components/ui/container'

<ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3 }} gap={6}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</ResponsiveGrid>
```

### Responsive Layout

Full page layout with sidebar support.

```tsx
import { ResponsiveLayout } from '@/components/layout/responsive-layout'

<ResponsiveLayout
  header={<Header />}
  sidebar={<Sidebar />}
  footer={<Footer />}
>
  <MainContent />
</ResponsiveLayout>
```

## Navigation Components

### Mobile Navigation

Mobile-friendly navigation menu.

```tsx
import { MobileNav } from '@/components/ui/mobile-nav'

<MobileNav
  items={[
    { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { href: '/tasks', label: 'Tasks', icon: <TaskIcon /> },
  ]}
/>
```

### Bottom Navigation

Bottom navigation bar for mobile.

```tsx
import { BottomNav } from '@/components/ui/mobile-nav'

<BottomNav
  items={[
    { href: '/dashboard', label: 'Home', icon: <HomeIcon /> },
    { href: '/tasks', label: 'Tasks', icon: <TaskIcon /> },
  ]}
/>
```

## Animation Components

### Page Transition

Smooth page transitions.

```tsx
import { PageTransition, FadeIn, SlideIn } from '@/components/ui/page-transition'

<PageTransition>
  <YourPage />
</PageTransition>

<FadeIn delay={100}>
  <Content />
</FadeIn>

<SlideIn direction="up" delay={200}>
  <Content />
</SlideIn>
```

## Responsive Utilities

### Hooks

```tsx
import { useIsMobile, useIsTablet, useIsDesktop, useBreakpoint } from '@/lib/responsive'

function MyComponent() {
  const isMobile = useIsMobile()
  const breakpoint = useBreakpoint()
  
  return isMobile ? <MobileView /> : <DesktopView />
}
```

## Design Tokens

Access design tokens programmatically:

```tsx
import { designTokens } from '@/lib/theme/design-tokens'

const primaryColor = designTokens.colors.primary[600]
const spacing = designTokens.spacing[4]
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader support
- Reduced motion support

## Animations

Animations automatically respect user's reduced motion preferences. All animations will be disabled if the user has `prefers-reduced-motion: reduce` set.

## Customization

Components use CSS variables for theming, making them easy to customize:

```css
:root {
  --primary: 37 99 235;
  --radius: 0.5rem;
}
```

## Best Practices

1. **Always use semantic HTML**: Components render semantic HTML elements
2. **Provide labels**: Always include labels for form inputs
3. **Handle loading states**: Use skeleton screens for better UX
4. **Mobile-first**: Design for mobile, enhance for desktop
5. **Accessibility**: Test with keyboard and screen readers
6. **Performance**: Use lazy loading for heavy components
