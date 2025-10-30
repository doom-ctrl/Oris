-- Ensure RLS is applied by using security invoker views
BEGIN;

CREATE OR REPLACE VIEW assessment_progress
WITH (security_invoker = true) AS
SELECT
    a.id,
    a.user_id,
    a.title,
    a.subject,
    a.status,
    a.progress,
    COUNT(t.id) AS total_tasks,
    COUNT(CASE WHEN t.completed = TRUE THEN 1 END) AS completed_tasks,
    ROUND(
        CASE
            WHEN COUNT(t.id) = 0 THEN a.progress
            ELSE (COUNT(CASE WHEN t.completed = TRUE THEN 1 END) * 100.0 / COUNT(t.id))
        END, 2
    ) AS calculated_progress,
    a.due_date,
    a.created_at
FROM assessments a
LEFT JOIN tasks t ON a.id = t.assessment_id
GROUP BY a.id, a.user_id, a.title, a.subject, a.status, a.progress, a.due_date, a.created_at;

CREATE OR REPLACE VIEW daily_summary
WITH (security_invoker = true) AS
SELECT
    pm.user_id,
    pm.metric_date,
    pm.assessments_completed,
    pm.tasks_completed,
    pm.overall_completion,
    pm.study_hours,
    COUNT(ps.id) AS planner_sessions_count,
    COUNT(ss.id) AS study_sessions_count,
    ROUND(AVG(ss.productivity_rating), 2) AS avg_productivity_rating
FROM progress_metrics pm
LEFT JOIN planner_sessions ps
    ON pm.user_id = ps.user_id AND pm.metric_date = ps.session_date
LEFT JOIN study_sessions ss
    ON pm.user_id = ss.user_id AND pm.metric_date = ss.session_date
GROUP BY
    pm.user_id,
    pm.metric_date,
    pm.assessments_completed,
    pm.tasks_completed,
    pm.overall_completion,
    pm.study_hours;

COMMIT;
