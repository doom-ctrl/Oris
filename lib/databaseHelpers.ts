import { createBrowserSupabaseClient } from './supabase-client'
import { safeInsertSingle, safeUpdateSingle } from './supabase-utils'
import type {
  Assessment,
  Task,
  ProgressMetric,
  PlannerSession,
  Subject,
  AssessmentProgress,
  DailySummary,
  Profile
} from '@/types/database'

// Create a single Supabase client for client-side operations
const supabase = createBrowserSupabaseClient()

// Assessment helpers
export const assessmentHelpers = {
  // Get all assessments for a user
  async getUserAssessments(userId: string): Promise<Assessment[]> {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching assessments:', error)
      throw error
    }
    return data || []
  },

  // Get assessment with progress
  async getAssessmentProgress(userId: string): Promise<AssessmentProgress[]> {
    const { data, error } = await supabase
      .from('assessment_progress')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create new assessment
  async createAssessment(assessment: Omit<Assessment, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Promise<Assessment> {
    const insertResult = await supabase
      .from('assessments')
      .insert({ ...assessment, user_id: userId })
      .select()
    
    const { data, error } = await safeInsertSingle(insertResult)

    if (error) {
      console.error('Error creating assessment:', error)
      throw error
    }
    if (!data) {
      throw new Error('Failed to create assessment - no data returned')
    }
    return data
  },

  // Update assessment
  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    const updateResult = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select()
    
    const { data, error } = await safeUpdateSingle(updateResult)

    if (error) {
      console.error('Error updating assessment:', error)
      throw error
    }
    if (!data) {
      throw new Error('Failed to update assessment - no data returned')
    }
    return data
  },

  // Delete assessment
  async deleteAssessment(id: string): Promise<void> {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting assessment:', error)
      throw error
    }
  }
}

// Task helpers
export const taskHelpers = {
  // Get tasks for an assessment
  async getAssessmentTasks(assessmentId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching assessment tasks:', error)
      throw error
    }
    return data || []
  },

  // Get all tasks for a user
  async getUserTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching user tasks:', error)
      throw error
    }
    return data || []
  },

  // Create new task
  async createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Promise<Task> {
    const insertResult = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select()
    
    const { data, error } = await safeInsertSingle(insertResult)

    if (error) {
      console.error('Error creating task:', error)
      throw error
    }
    if (!data) {
      throw new Error('Operation failed - no data returned')
    }
    return data
  },

  // Update task
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const updateResult = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
    
    const { data, error } = await safeUpdateSingle(updateResult)

    if (error) {
      console.error('Error updating task:', error)
      throw error
    }
    if (!data) {
      throw new Error('Operation failed - no data returned')
    }
    return data
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },

  // Toggle task completion
  async toggleTaskCompletion(id: string): Promise<Task> {
    try {
      // First get current task without .single() to avoid 406 errors
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('completed')
        .eq('id', id)

      if (fetchError || !tasks || tasks.length === 0) {
        console.error('Error fetching task or task not found:', fetchError)
        throw new Error('Task not found')
      }

      const currentTask = tasks[0]

      // Toggle completion
      const { data: updatedTasks, error } = await supabase
        .from('tasks')
        .update({ completed: !currentTask.completed })
        .eq('id', id)
        .select()

      if (error || !updatedTasks || updatedTasks.length === 0) {
        console.error('Error toggling task completion:', error)
        throw error || new Error('Failed to update task')
      }
      
      return updatedTasks[0]
    } catch (error) {
      console.error('Error in toggleTaskCompletion:', error)
      throw error
    }
  }
}

// Progress metrics helpers
export const progressHelpers = {
  // Get progress metrics for a date range
  async getProgressMetrics(userId: string, startDate: string, endDate: string): Promise<ProgressMetric[]> {
    
    const { data, error } = await supabase
      .from('progress_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get daily summary
  async getDailySummary(userId: string, startDate: string, endDate: string): Promise<DailySummary[]> {
    
    const { data, error } = await supabase
      .from('daily_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create or update progress metric
  async upsertProgressMetric(metric: Omit<ProgressMetric, 'id' | 'created_at'>): Promise<ProgressMetric> {
    const insertResult = await supabase
      .from('progress_metrics')
      .upsert(metric)
      .select()
    
    const { data, error } = await safeInsertSingle(insertResult)

    if (error) throw error
    if (!data) {
      throw new Error('Operation failed - no data returned')
    }
    return data
  }
}

// Planner sessions helpers
export const plannerHelpers = {
  // Get planner sessions for a date range
  async getPlannerSessions(userId: string, startDate: string, endDate: string): Promise<PlannerSession[]> {
    
    const { data, error } = await supabase
      .from('planner_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create new planner session
  async createPlannerSession(session: Omit<PlannerSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Promise<PlannerSession> {
    const insertResult = await supabase
      .from('planner_sessions')
      .insert({ ...session, user_id: userId })
      .select()
    
    const { data, error } = await safeInsertSingle(insertResult)

    if (error) throw error
    if (!data) {
      throw new Error('Operation failed - no data returned')
    }
    return data
  },

  // Update planner session
  async updatePlannerSession(id: string, updates: Partial<PlannerSession>): Promise<PlannerSession> {
    const updateResult = await supabase
      .from('planner_sessions')
      .update(updates)
      .eq('id', id)
      .select()
    
    const { data, error } = await safeUpdateSingle(updateResult)

    if (error) throw error
    if (!data) {
      throw new Error('Operation failed - no data returned')
    }
    return data
  },

  // Delete planner session
  async deletePlannerSession(id: string): Promise<void> {
    
    const { error } = await supabase
      .from('planner_sessions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Subject helpers
export const subjectHelpers = {
  // Get all subjects for a user
  async getUserSubjects(userId: string): Promise<Subject[]> {
    
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create new subject
  async createSubject(subject: Omit<Subject, 'id' | 'user_id' | 'created_at'>, userId: string): Promise<Subject> {
    const insertResult = await supabase
      .from('subjects')
      .insert({ ...subject, user_id: userId })
      .select()
    
    const { data, error } = await safeInsertSingle(insertResult)

    if (error) throw error
    if (!data) {
      throw new Error('Operation failed - no data returned')
    }
    return data
  }
}

// Profile helpers
export const profileHelpers = {
  // Get user profile
  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      // First try to get profiles without .single() to avoid 406 errors
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      // Return the first profile if it exists
      return profiles && profiles.length > 0 ? profiles[0] : null
    } catch (error) {
      console.error('Error in getUserProfile:', error)
      return null
    }
  },

  // Create or update profile
  async upsertProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const insertResult = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
    
    const { data, error } = await safeInsertSingle(insertResult)

    if (error) throw error
    if (!data) {
      throw new Error('Failed to upsert profile - no data returned')
    }
    return data
  }
}