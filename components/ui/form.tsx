import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

export function Form({ className, ...props }: FormProps) {
  return (
    <form
      className={cn('space-y-6', className)}
      {...props}
    />
  )
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string
}

export function FormField({ className, error, children, ...props }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}

export interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean
}

export function FormLabel({ children, required, className, ...props }: FormLabelProps) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </Label>
  )
}

export function FormDescription({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export function FormMessage({ 
  className,
  children,
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null
  
  return (
    <p
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {children}
    </p>
  )
}
