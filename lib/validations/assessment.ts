import { z } from 'zod'

// Base assessment schema
export const assessmentBaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .transform(val => val.trim()),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .transform(val => val.trim())
    .optional(),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(100, 'Subject is too long')
    .transform(val => val.trim()),
  dueDate: z
    .string()
    .datetime('Invalid date format')
    .optional(),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be low, medium, or high' })
  }),
  status: z.enum(['not-started', 'in-progress', 'completed', 'overdue'], {
    errorMap: () => ({ message: 'Invalid status' })
  }),
})

// Create assessment schema
export const createAssessmentSchema = assessmentBaseSchema

// Update assessment schema
export const updateAssessmentSchema = assessmentBaseSchema.partial()

// Assessment query schema
export const assessmentQuerySchema = z.object({
  page: z.string().transform(Number).refine(n => n > 0, 'Page must be greater than 0').default('1'),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').default('10'),
  status: z.enum(['not-started', 'in-progress', 'completed', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  subject: z.string().optional(),
  search: z.string().max(100, 'Search term is too long').optional(),
  sortBy: z.enum(['title', 'dueDate', 'priority', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Types
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>
export type AssessmentQueryInput = z.infer<typeof assessmentQuerySchema>