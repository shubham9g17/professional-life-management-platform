/**
 * Input Validation and Sanitization Utilities
 * Protects against XSS, SQL injection, and other injection attacks
 */

import { z } from 'zod';

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize plain text input
 * Removes control characters and normalizes whitespace
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove control characters except newlines and tabs
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();
  
  // Remove any characters that aren't valid in email addresses
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');
  
  return sanitized;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize SQL-like input (for search queries, etc.)
 * Removes SQL injection attempts
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return '';
  
  // Remove SQL keywords and special characters
  let sanitized = input.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi, '');
  
  // Remove SQL comment markers
  sanitized = sanitized.replace(/(--|\/\*|\*\/|;)/g, '');
  
  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }
  
  return { valid: true };
}

/**
 * Common validation schemas using Zod
 */
export const commonSchemas = {
  email: z.string().email().max(255).transform(sanitizeEmail),
  
  password: z.string().min(8).max(128),
  
  name: z.string().min(1).max(200).transform(sanitizeText),
  
  description: z.string().max(5000).transform(sanitizeHtml),
  
  url: z.string().url().max(2048).transform(sanitizeUrl),
  
  id: z.string().uuid(),
  
  positiveInt: z.number().int().positive(),
  
  nonNegativeInt: z.number().int().nonnegative(),
  
  date: z.coerce.date(),
  
  tags: z.array(z.string().max(50).transform(sanitizeText)).max(20),
};

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; issues?: z.ZodIssue[] } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      };
    }
    return {
      success: false,
      error: 'Invalid request body',
    };
  }
}

/**
 * Prevent SQL injection by validating Prisma query parameters
 * This is a defense-in-depth measure; Prisma already prevents SQL injection
 */
export function validatePrismaInput(input: Record<string, any>): boolean {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|\/\*|\*\/)/,
    /[;'"\\]/,
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return !dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.every(checkValue);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(checkValue);
    }
    return true;
  };
  
  return Object.values(input).every(checkValue);
}
