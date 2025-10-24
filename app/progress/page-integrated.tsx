"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import {
  Award,
  BookOpen,
  CheckCircle,
  Activity,
  Target,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MotionWrapper } from "@/components/motion/MotionWrapper"
import {
  assessmentHelpers,
  progressHelpers,
  plannerHelpers
} from "@/lib/databaseHelpers"
import type { Assessment, ProgressMetric } from "@/types/database"

// --------------------------------------------------
// ✅ Types
// --------------------------------------------------
type DateRange = "week" | "month" | "term"
type SessionType = "study" | "review" | "break" | "assignment" | "project"

interface NewSession {
  title: string
  type: SessionType
  date: string
  startTime: string
  endTime: string
  description: string
  linkedAssessment: string
}

// --------------------------------------------------
// ✅ Component
// --------------------------------------------------
export default function PlannerPageIntegrated() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetric[]>([])
  const [dateRange] = useState<DateRange>("week")

  // ✅ Explicit type annotation fixes the “not assignable” error
  const [newSession, setNewSession] = useState<NewSession>({
    title: "",
    type: "study",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    linkedAssessment: ""
  })

  // --------------------------------------------------
  // ✅ Fetch data from Supabase
  // --------------------------------------------------
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [a, m] = await Promise.all([
          assessmentHelpers.getUserAssessments(user.id),
          progressHelpers.getProgressMetrics(
            user.id,
            getDateRangeStart(dateRange),
            getDateRangeEnd()
          ),
          plannerHelpers.getPlannerSessions(
            user.id,
            getDateRangeStart(dateRange),
            getDateRangeEnd()
          )
        ])
        setAssessments(a)
        setProgressMetrics(m)
      } catch (err) {
        console.error("Error fetching planner data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, dateRange])

  // --------------------------------------------------
  // ✅ Date helpers
  // --------------------------------------------------
  const getDateRangeStart = (range: DateRange): string => {
    const now = new Date()
    const start = new Date()
    
    switch (range) {
      case "week":
        start.setDate(now.getDate() - 7)
        break
      case "month":
        start.setMonth(now.getMonth() - 1)
        break
      case "term":
        start.setMonth(now.getMonth() - 3)
        break
    }
    
    return start.toISOString().split("T")[0]
  }

  const getDateRangeEnd = () => new Date().toISOString().split("T")[0]

  // --------------------------------------------------
  // ✅ Helper functions
  // --------------------------------------------------
  const getTrendColor = (trend: number | string): string => {
    const trendValue = typeof trend === 'string' ? parseInt(trend) : trend
    if (trendValue > 0) return "text-green-600"
    if (trendValue < 0) return "text-red-600"
    return "text-gray-600"
  }

  // Calculate summary metrics from progress metrics
  const summaryMetrics = {
    overallCompletion: progressMetrics.length > 0 
      ? Math.round(progressMetrics.reduce((acc, metric) => acc + (metric.overall_completion || 0), 0) / progressMetrics.length)
      : 0,
    completionChange: 12, // Placeholder - could be calculated from historical data
    weeklyTrend: 8, // Placeholder - could be calculated from historical data
    assessmentsCompleted: assessments.filter(a => a.status === 'completed').length,
    tasksCompleted: progressMetrics.reduce((acc, metric) => acc + (metric.tasks_completed || 0), 0),
    activeSubjects: new Set(assessments.map(a => a.subject)).size
  }

  // Mock recent activity data
  const recentActivity = [
    {
      id: '1',
      type: 'assessment' as const,
      title: 'Math Quiz Completed',
      description: 'Calculus fundamentals',
      timestamp: '2 hours ago',
      value: 85
    },
    {
      id: '2',
      type: 'task' as const,
      title: 'Assignment Submitted',
      description: 'History research paper',
      timestamp: '4 hours ago',
      value: null
    },
    {
      id: '3',
      type: 'milestone' as const,
      title: 'Study Goal Reached',
      description: '5 hours focused study',
      timestamp: '1 day ago',
      value: 100
    }
  ]

  // Mock subject data
  const filteredSubjectData = [
    {
      name: 'Mathematics',
      completedAssessments: 8,
      totalAssessments: 10,
      completion: 80,
      trend: 'up' as const,
      trendValue: 5
    },
    {
      name: 'Science',
      completedAssessments: 6,
      totalAssessments: 8,
      completion: 75,
      trend: 'up' as const,
      trendValue: 3
    },
    {
      name: 'History',
      completedAssessments: 4,
      totalAssessments: 7,
      completion: 57,
      trend: 'down' as const,
      trendValue: -2
    }
  ]

  // --------------------------------------------------
  // ✅ Handlers
  // --------------------------------------------------
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as SessionType
    setNewSession(prev => ({ ...prev, type: selectedType }))
  }

  // --------------------------------------------------
  // ✅ UI: Guards
  // --------------------------------------------------
  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Please sign in to view your planner
            </h1>
            <Button asChild>
              <a href="/sign-in">Sign In</a>
            </Button>
          </div>
        </div>
      </MotionWrapper>
    )
  }

  if (isLoading) {
    return (
      <MotionWrapper>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-b-2 border-primary mx-auto mb-3 rounded-full" />
            <p className="text-muted-foreground">Loading planner data...</p>
          </div>
        </div>
      </MotionWrapper>
    )
  }

  // --------------------------------------------------
  // ✅ UI: Main content
  // --------------------------------------------------
  return (
    <MotionWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        {/* Header */}
        <h2 className="text-lg font-semibold">Create New Session</h2>

        {/* Session Type Selector */}
        <select
          value={newSession.type}
          onChange={handleTypeChange}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="study">Study Session</option>
          <option value="review">Review</option>
          <option value="break">Break</option>
          <option value="assignment">Assignment</option>
          <option value="project">Project</option>
        </select>

        {/* Motivational Card */}
        <Card className="mt-6 border-green-200 dark:border-green-800/50 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20">
          <CardContent className="p-6 flex gap-4 items-center">
            <div className="p-3 rounded-full bg-green-500/10">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Great work!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                Your planner and progress are synced and running smoothly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Zone */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 container mx-auto px-4 py-8"
          >
            {/* Overall Completion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${getTrendColor(summaryMetrics.weeklyTrend)}`}>
                      <TrendingUp className="h-4 w-4" />
                      <span>{Math.abs(summaryMetrics.completionChange)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{summaryMetrics.overallCompletion}%</p>
                    <p className="text-sm text-muted-foreground">Overall Completion</p>
                    <Progress value={summaryMetrics.overallCompletion} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Assessments Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{summaryMetrics.assessmentsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Assessments Completed</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      <span>This term</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tasks Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+15%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{summaryMetrics.tasksCompleted}</p>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span>High productivity</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Subjects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      Balanced
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{summaryMetrics.activeSubjects}</p>
                    <p className="text-sm text-muted-foreground">Active Subjects</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Award className="h-3 w-3" />
                      <span>Well distributed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>

        {/* Analytics Zone */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Overall Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overall Progress Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 relative">
                    {/* Simple progress chart */}
                    <div className="absolute inset-0 flex items-end justify-between gap-2">
                      {progressMetrics.slice(-7).map((metric, index) => (
                        <motion.div
                          key={metric.id}
                          initial={{ height: 0 }}
                          animate={{ height: `${metric.overall_completion}%` }}
                          transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                          className="flex-1 bg-gradient-to-t from-primary/20 to-primary/60 rounded-t-md relative group cursor-pointer"
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-semibold">{metric.overall_completion}%</div>
                            <div className="text-muted-foreground">{new Date(metric.metric_date).toLocaleDateString()}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Time Progress</span>
                    <span>Completion Rate</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'assessment' ? 'bg-blue-500/10' :
                          activity.type === 'task' ? 'bg-green-500/10' :
                          'bg-purple-500/10'
                        }`}>
                          {activity.type === 'assessment' && <BookOpen className="h-4 w-4 text-blue-500" />}
                          {activity.type === 'task' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {activity.type === 'milestone' && <Award className="h-4 w-4 text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                        </div>
                        {activity.value && (
                          <Badge variant="outline" className="text-xs">
                            {activity.value}%
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Subject Breakdown */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredSubjectData.map((subject, index) => (
                    <motion.div
                      key={subject.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{subject.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {subject.completedAssessments}/{subject.totalAssessments} assessments
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{subject.completion}%</span>
                          <div className={`flex items-center gap-1 text-xs ${getTrendColor(subject.trend)}`}>
                            <TrendingUp className="h-3 w-3" />
                            <span>{Math.abs(subject.trendValue)}%</span>
                          </div>
                        </div>
                      </div>
                      <Progress value={subject.completion} className="h-2" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Motivational Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="border-green-200 dark:border-green-800/50 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Great work!
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      Your planner and progress are synced and running smoothly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </MotionWrapper>
  )
}
