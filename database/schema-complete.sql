-- ========================================
-- Assessment Manager: Complete Fresh Setup Schema
-- ========================================
-- This script drops ALL existing tables and recreates everything
-- Use this for a completely fresh start with Clerk compatibility

-- Enable UUID extension for other IDs (not user_id)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- ========================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS daily_summary CASCADE;
DROP VIEW IF EXISTS assessment_progress CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_planner_sessions_updated_at ON planner_sessions;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_assessments_user_id;
DROP INDEX IF EXISTS idx_assessments_due_date;
DROP INDEX IF EXISTS idx_assessments_status;
DROP INDEX IF EXISTS idx_assessments_subject;
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_tasks_assessment_id;
DROP INDEX IF EXISTS idx_tasks_completed;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_progress_metrics_user_id;
DROP INDEX IF EXISTS idx_progress_metrics_date;
DROP INDEX IF EXISTS idx_planner_sessions_user_id;
DROP INDEX IF EXISTS idx_planner_sessions_date;
DROP INDEX IF EXISTS idx_planner_sessions_type;
DROP INDEX IF EXISTS idx_study_sessions_user_id;
DROP INDEX IF EXISTS idx_study_sessions_date;
DROP INDEX IF EXISTS idx_study_sessions_subject_id;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS planner_sessions CASCADE;
DROP TABLE IF EXISTS progress_metrics CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================
-- STEP 2: CREATE TABLES WITH CLERK COMPATIBILITY
-- ========================================

-- 1. USER PROFILES TABLE
CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Clerk user ID (TEXT format)
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. ASSESSMENTS TABLE
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (TEXT format)
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'overdue')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on assessments
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- 3. TASKS TABLE
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (TEXT format)
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. PROGRESS METRICS TABLE
CREATE TABLE progress_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (TEXT format)
  metric_date DATE NOT NULL,
  assessments_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  overall_completion DECIMAL(5,2) DEFAULT 0,
  study_hours DECIMAL(5,2) DEFAULT 0,
  subject_breakdown JSONB, -- Store subject-specific progress
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on progress metrics
ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;

-- 5. PLANNER SESSIONS TABLE
CREATE TABLE planner_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (TEXT format)
  title TEXT NOT NULL,
  type TEXT DEFAULT 'study' CHECK (type IN ('assessment', 'study', 'milestone', 'review')),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  linked_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  location TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on planner sessions
ALTER TABLE planner_sessions ENABLE ROW LEVEL SECURITY;

-- 6. SUBJECTS TABLE
CREATE TABLE subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (TEXT format)
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  UNIQUE(user_id, name)
);

-- Enable RLS on subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 7. STUDY SESSIONS TABLE (Enhanced tracking)
CREATE TABLE study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (TEXT format)
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  topics_covered TEXT[],
  notes TEXT,
  productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  mood TEXT CHECK (mood IN ('focused', 'tired', 'energetic', 'stressed', 'neutral')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on study sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE ROW LEVEL SECURITY POLICIES
-- ========================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid()::text);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid()::text);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid()::text);

-- Assessments policies
CREATE POLICY "Users can manage their own assessments"
ON assessments FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Tasks policies
CREATE POLICY "Users can manage their own tasks"
ON tasks FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Progress metrics policies
CREATE POLICY "Users can manage their own progress metrics"
ON progress_metrics FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Planner sessions policies
CREATE POLICY "Users can manage their own planner sessions"
ON planner_sessions FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Subjects policies
CREATE POLICY "Users can manage their own subjects"
ON subjects FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Study sessions policies
CREATE POLICY "Users can manage their own study sessions"
ON study_sessions FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ========================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- ========================================

-- Assessments indexes
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_due_date ON assessments(due_date);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_subject ON assessments(subject);

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_assessment_id ON tasks(assessment_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Progress metrics indexes
CREATE INDEX idx_progress_metrics_user_id ON progress_metrics(user_id);
CREATE INDEX idx_progress_metrics_date ON progress_metrics(metric_date);

-- Planner sessions indexes
CREATE INDEX idx_planner_sessions_user_id ON planner_sessions(user_id);
CREATE INDEX idx_planner_sessions_date ON planner_sessions(date);
CREATE INDEX idx_planner_sessions_type ON planner_sessions(type);

-- Study sessions indexes
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(session_date);
CREATE INDEX idx_study_sessions_subject_id ON study_sessions(subject_id);

-- ========================================
-- STEP 5: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planner_sessions_updated_at BEFORE UPDATE ON planner_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 6: CREATE VIEWS FOR COMMON QUERIES
-- ========================================

-- Assessment progress view
CREATE VIEW assessment_progress WITH (security_invoker = true) AS
SELECT
    a.id,
    a.user_id,
    a.title,
    a.subject,
    a.status,
    a.progress,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.completed = TRUE THEN 1 END) as completed_tasks,
    ROUND(
        CASE
            WHEN COUNT(t.id) = 0 THEN a.progress
            ELSE (COUNT(CASE WHEN t.completed = TRUE THEN 1 END) * 100.0 / COUNT(t.id))
        END, 2
    ) as calculated_progress,
    a.due_date,
    a.created_at
FROM assessments a
LEFT JOIN tasks t ON a.id = t.assessment_id
GROUP BY a.id, a.user_id, a.title, a.subject, a.status, a.progress, a.due_date, a.created_at;

-- Daily summary view
CREATE VIEW daily_summary WITH (security_invoker = true) AS
SELECT
    pm.user_id,
    pm.metric_date,
    pm.assessments_completed,
    pm.tasks_completed,
    pm.overall_completion,
    pm.study_hours,
    COUNT(ps.id) as planner_sessions_count,
    COUNT(ss.id) as study_sessions_count,
    ROUND(AVG(ss.productivity_rating), 2) as avg_productivity_rating
FROM progress_metrics pm
LEFT JOIN planner_sessions ps ON pm.user_id = ps.user_id AND pm.metric_date = ps.date
LEFT JOIN study_sessions ss ON pm.user_id = ss.user_id AND pm.metric_date = ss.session_date
GROUP BY pm.user_id, pm.metric_date, pm.assessments_completed, pm.tasks_completed, pm.overall_completion, pm.study_hours;

-- ========================================
-- COMPLETE!
-- ========================================
-- Your Assessment Manager database is now ready with:
-- ✅ Clerk user ID compatibility (TEXT format)
-- ✅ Row Level Security for all tables
-- ✅ Performance indexes
-- ✅ Automatic timestamp updates
-- ✅ Useful views for common queries
-- ✅ All foreign key relationships
-- ✅ Proper constraints and data types

-- The database is now ready to use with your Assessment Manager app!