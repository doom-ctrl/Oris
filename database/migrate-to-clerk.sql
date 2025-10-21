-- Migration script: Convert UUID user_id fields to TEXT for Clerk compatibility
-- Run this script if you have an existing database with the old UUID-based schema

-- 1. Drop foreign key constraints
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_user_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE progress_metrics DROP CONSTRAINT IF EXISTS progress_metrics_user_id_fkey;
ALTER TABLE planner_sessions DROP CONSTRAINT IF EXISTS planner_sessions_user_id_fkey;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_user_id_fkey;
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey;

-- 2. Convert user_id columns from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE assessments ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE tasks ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE progress_metrics ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE planner_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE subjects ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE study_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 3. Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage their own progress metrics" ON progress_metrics;
DROP POLICY IF EXISTS "Users can manage their own planner sessions" ON planner_sessions;
DROP POLICY IF EXISTS "Users can manage their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can manage their own study sessions" ON study_sessions;

-- 4. Recreate RLS policies with Clerk compatibility
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid()::text);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid()::text);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid()::text);

CREATE POLICY "Users can manage their own assessments"
ON assessments FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can manage their own tasks"
ON tasks FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can manage their own progress metrics"
ON progress_metrics FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can manage their own planner sessions"
ON planner_sessions FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can manage their own subjects"
ON subjects FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can manage their own study sessions"
ON study_sessions FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- 5. Update views for compatibility
DROP VIEW IF EXISTS assessment_progress;
DROP VIEW IF EXISTS daily_summary;

-- Recreate views
CREATE VIEW assessment_progress AS
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

CREATE VIEW daily_summary AS
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

-- Migration complete!
-- Your database should now be compatible with Clerk user IDs