import { z } from 'zod'

// Re-export all validation schemas
export * from './auth'
export * from './assessment'

// Generic validation helpers
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true
  data: T
} | {
  success: false
  error: string
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => err.message).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Sanitize and validate text input
export function sanitizeText(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove javascript: protocol
}

// Validate URL
export const urlSchema = z.string().url('Invalid URL').max(2048, 'URL is too long')

// Validate UUID
export const uuidSchema = z.string().uuid('Invalid ID format')

// Validate date
export const dateSchema = z.string().datetime('Invalid date format')

// Validate boolean (from various input types)
export const booleanSchema = z
  .union([z.boolean(), z.string(), z.number()])
  .transform(val => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'string') return val === 'true' || val === '1'
    if (typeof val === 'number') return val === 1
    return false
  })