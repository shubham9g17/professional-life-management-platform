/**
 * XSS (Cross-Site Scripting) Protection Utilities
 * Additional layer of defense against XSS attacks
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Unescape HTML entities (use with caution)
 */
export function unescapeHtml(text: string): string {
  if (!text) return '';
  
  const htmlUnescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  };
  
  return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (entity) => htmlUnescapeMap[entity] || entity);
}

/**
 * Strip all HTML tags from text
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user-generated content for safe display
 * Allows basic formatting but removes dangerous elements
 */
export function sanitizeUserContent(content: string): string {
  if (!content) return '';
  
  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'applet', 'meta', 'link', 'base'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing versions
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });
  
  return sanitized.trim();
}

/**
 * Validate that a string doesn't contain XSS attempts
 */
export function containsXss(input: string): boolean {
  if (!input) return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize JSON to prevent XSS in JSON responses
 */
export function sanitizeJson(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeJson(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Create a safe attribute value for HTML
 */
export function safeAttribute(value: string): string {
  if (!value) return '';
  
  // Remove quotes and angle brackets
  return value.replace(/["'<>]/g, '');
}

/**
 * Validate and sanitize URL for href attributes
 */
export function safeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!safeProtocols.includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    // If URL parsing fails, check if it's a relative URL
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return '';
  }
}

/**
 * Content Security Policy nonce generator
 * Use this for inline scripts that need to bypass CSP
 */
export function generateCspNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate that content is safe for rendering
 */
export interface ContentValidation {
  safe: boolean;
  sanitized: string;
  warnings: string[];
}

export function validateContent(content: string): ContentValidation {
  const warnings: string[] = [];
  let sanitized = content;
  
  // Check for script tags
  if (/<script/i.test(content)) {
    warnings.push('Script tags detected and removed');
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  // Check for event handlers
  if (/on\w+\s*=/i.test(content)) {
    warnings.push('Event handlers detected and removed');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  }
  
  // Check for javascript: protocol
  if (/javascript:/i.test(content)) {
    warnings.push('JavaScript protocol detected and removed');
    sanitized = sanitized.replace(/javascript:/gi, '');
  }
  
  // Check for dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}`, 'i');
    if (regex.test(content)) {
      warnings.push(`${tag} tag detected and removed`);
      const removeRegex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      sanitized = sanitized.replace(removeRegex, '');
    }
  });
  
  return {
    safe: warnings.length === 0,
    sanitized,
    warnings,
  };
}
