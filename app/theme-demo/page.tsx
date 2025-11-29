'use client'

import * as React from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner, Skeleton } from '@/components/ui'
import { Container } from '@/components/ui/container'
import { PageTransition } from '@/components/ui/page-transition'

export default function ThemeDemoPage() {
  return (
    <PageTransition>
      <Container size="lg" className="py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Theme System Demo</h1>
              <p className="text-muted-foreground mt-2">
                Professional Life Management Platform UI Components
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Various button styles and variants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status and label badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields and form components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input type="email" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Disabled</label>
                  <Input disabled placeholder="Disabled input" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading States */}
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
              <CardDescription>Spinners and skeleton screens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Spinners</h3>
                  <div className="flex items-center gap-6">
                    <LoadingSpinner size="sm" />
                    <LoadingSpinner size="md" />
                    <LoadingSpinner size="lg" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-3">Skeleton</h3>
                  <div className="space-y-2 max-w-md">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  This is a card component with header, content, and footer sections.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
                <CardDescription>With different content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="success">Active</Badge>
                  <p className="text-sm text-muted-foreground">
                    Cards adapt to the current theme automatically.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third Card</CardTitle>
                <CardDescription>Responsive grid layout</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  The grid automatically adjusts based on screen size.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Theme-aware color system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    Primary
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground font-medium">
                    Secondary
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-success flex items-center justify-center text-success-foreground font-medium">
                    Success
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-warning flex items-center justify-center text-warning-foreground font-medium">
                    Warning
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-destructive flex items-center justify-center text-destructive-foreground font-medium">
                    Destructive
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-muted flex items-center justify-center text-muted-foreground font-medium">
                    Muted
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </PageTransition>
  )
}
