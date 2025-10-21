// Database type definitions for Assessment Manager

export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Assessment {
  id: string
  user_id: string
  title: string
  subject: string
  description?: string
  due_date?: string
  status: 'upcoming' | 'completed' | 'overdue'
  progress: number
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  assessment_id?: string
  title: string
  description?: string
  completed: boolean
  due_date?: string
  priority: 'low' | 'medium' | 'high'
  estimated_hours?: number
  actual_hours?: number
  created_at: string
  updated_at: string
}

export interface ProgressMetric {
  id: string
  user_id: string
  metric_date: string
  assessments_completed: number
  tasks_completed: number
  overall_completion: number
  study_hours: number
  subject_breakdown?: Record<string, number>
  created_at: string
}

export interface PlannerSession {
  id: string
  user_id: string
  title: string
  type: 'assessment' | 'study' | 'milestone' | 'review'
  date: string
  start_time?: string
  end_time?: string
  description?: string
  linked_assessment_id?: string
  location?: string
  is_completed: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  color: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  subject_id?: string
  assessment_id?: string
  session_date: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  topics_covered?: string[]
  notes?: string
  productivity_rating?: number
  mood?: 'focused' | 'tired' | 'energetic' | 'stressed' | 'neutral'
  created_at: string
}

// Views
export interface AssessmentProgress {
  id: string
  user_id: string
  title: string
  subject: string
  status: string
  progress: number
  total_tasks: number
  completed_tasks: number
  calculated_progress: number
  due_date?: string
  created_at: string
}

export interface DailySummary {
  user_id: string
  metric_date: string
  assessments_completed: number
  tasks_completed: number
  overall_completion: number
  study_hours: number
  planner_sessions_count: number
  study_sessions_count: number
  avg_productivity_rating: number
}

// Local state types (used in UI components)
export interface LocalTask {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
}

export interface LocalAssessment {
  id: string
  title: string
  subject: string
  description: string
  dueDate: string
  status: "upcoming" | "completed" | "overdue"
  progress: number
  tasks: LocalTask[]
}

export interface LocalCalendarEvent {
  id: string
  title: string
  type: "assessment" | "study" | "milestone"
  date: string
  startTime?: string
  endTime?: string
  description?: string
  linkedAssessment?: string
  color?: string
}