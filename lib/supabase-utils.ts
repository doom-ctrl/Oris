import { PostgrestError } from '@supabase/supabase-js'

/**
 * Utility functions for handling Supabase operations with better error handling
 * to prevent 406 Not Acceptable errors
 */

export interface SupabaseResponse<T> {
  data: T | null
  error: PostgrestError | null
}

/**
 * Safely executes a Supabase query that expects a single result
 * Handles the common case where .single() might cause 406 errors
 */
export async function safeSingle<T>(
  queryBuilder: { data?: T; error?: PostgrestError | null }
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await queryBuilder

    if (error) {
      return { data: null, error }
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        data: null,
        error: {
          message: 'No rows found',
          code: 'PGRST116',
          details: '',
          hint: ''
        } as PostgrestError
      }
    }

    // Handle both single object and array responses
    const result = Array.isArray(data) ? data[0] : data

    // Warn if multiple rows were returned but we expected single
    if (Array.isArray(data) && data.length > 1) {
      console.warn('Multiple rows returned when expecting single row, using first result')
    }

    return { data: result, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN',
        details: '',
        hint: ''
      } as PostgrestError
    }
  }
}

/**
 * Safely executes a Supabase insert operation that expects a single result
 */
export async function safeInsertSingle<T>(
  queryBuilder: { data?: T | T[]; error?: PostgrestError | null }
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await queryBuilder

    if (error) {
      return { data: null, error }
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        data: null,
        error: {
          message: 'Insert operation failed - no data returned',
          code: 'INSERT_FAILED',
          details: '',
          hint: ''
        } as PostgrestError
      }
    }

    // Handle both single object and array responses
    const result = Array.isArray(data) ? data[0] : data
    return { data: result, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN',
        details: '',
        hint: ''
      } as PostgrestError
    }
  }
}

/**
 * Safely executes a Supabase update operation that expects a single result
 */
export async function safeUpdateSingle<T>(
  queryBuilder: { data?: T | T[]; error?: PostgrestError | null }
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await queryBuilder

    if (error) {
      return { data: null, error }
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        data: null,
        error: {
          message: 'Update operation failed - no rows affected',
          code: 'UPDATE_FAILED',
          details: '',
          hint: ''
        } as PostgrestError
      }
    }

    // Handle both single object and array responses
    const result = Array.isArray(data) ? data[0] : data
    return { data: result, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN',
        details: '',
        hint: ''
      } as PostgrestError
    }
  }
}

/**
 * Checks if an error is the "no rows found" error (PGRST116)
 */
export function isNoRowsError(error: PostgrestError | null): boolean {
  return error?.code === 'PGRST116'
}

/**
 * Checks if an error is a 406 Not Acceptable error
 */
export function is406Error(error: { status?: number; message?: string }): boolean {
  return error?.status === 406 || 
         (error?.message?.includes('406') ?? false) || 
         (error?.message?.includes('Not Acceptable') ?? false)
}