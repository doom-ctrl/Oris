"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { TrendingUp, BookOpen, CheckCircle, Activity, Award, Target, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MotionWrapper } from "@/components/motion/MotionWrapper"
import {
  assessmentHelpers,
  progressHelpers,
  plannerHelpers
} from "@/lib/databaseHelpers"
import type { Assessment, ProgressMetric, PlannerSession } from "@/types/database"

// Subject data interface
interface SubjectData {
  name: string
  completion: number
  totalAssessments: number
  completedAssessments: number
  trend: "up" | "down" | "stable"
  trendValue: number
}

// Activity item interface
interface ActivityItem {
  id: string
  type: "assessment" | "task" | "milestone"
  title: string
  description: string
  timestamp: string
  value?: number
}

type DateRange = "week" | "month" | "term"

export default function ProgressPageIntegrated() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>("week")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetric[]>([])
  const [plannerSessions, setPlannerSessions] = useState<PlannerSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data from Supabase
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch all data in parallel
        const [assessmentsData, metricsData, sessionsData] = await Promise.all([
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

        setAssessments(assessmentsData)
        setProgressMetrics(metricsData)
        setPlannerSessions(sessionsData)
      } catch (error) {
        console.error('Error fetching progress data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, dateRange])

  // Get date range start and end
  const getDateRangeStart = (range: DateRange): string => {
    const today = new Date()
    const start = new Date(today)

    switch (range) {
      case "week":
        start.setDate(today.getDate() - 7)
        break
      case "month":
        start.setMonth(today.getMonth() - 1)
        break
      case "term":
        start.setMonth(today.getMonth() - 3)
        break
    }

    return start.toISOString().split('T')[0]
  }

  const getDateRangeEnd = (): string => {
    return new Date().toISOString().split('T')[0]
  }

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (assessments.length === 0) {
      return {
        overallCompletion: 0,
        completionChange: 0,
        assessmentsCompleted: 0,
        tasksCompleted: 0,
        activeSubjects: 0,
        weeklyTrend: "stable" as const
      }
    }

    const totalAssessments = assessments.length
    const completedAssessments = assessments.filter(a => a.status === 'completed').length
    const totalProgress = assessments.reduce((sum, a) => sum + a.progress, 0)
    const overallCompletion = Math.round(totalProgress / totalAssessments)

    // Calculate tasks completed
    const tasksCompleted = progressMetrics.reduce((sum, m) => sum + m.tasks_completed, 0)

    // Get unique subjects
    const uniqueSubjects = new Set(assessments.map(a => a.subject))

    // Calculate trend (simplified - using latest vs previous metric)
    const completionChange = progressMetrics.length >= 2
      ? progressMetrics[progressMetrics.length - 1].overall_completion -
        progressMetrics[progressMetrics.length - 2].overall_completion
      : 0

    return {
      overallCompletion,
      completionChange,
      assessmentsCompleted: completedAssessments,
      tasksCompleted,
      activeSubjects: uniqueSubjects.size,
      weeklyTrend: completionChange > 0 ? "up" as const : completionChange < 0 ? "down" as const : "stable" as const
    }
  }, [assessments, progressMetrics])

  // Generate subject data
  const subjectData = useMemo(() => {
    const subjectMap = new Map<string, SubjectData>()

    assessments.forEach(assessment => {
      if (!subjectMap.has(assessment.subject)) {
        subjectMap.set(assessment.subject, {
          name: assessment.subject,
          completion: 0,
          totalAssessments: 0,
          completedAssessments: 0,
          trend: "stable",
          trendValue: 0
        })
      }

      const subject = subjectMap.get(assessment.subject)!
      subject.totalAssessments++
      subject.completion += assessment.progress

      if (assessment.status === 'completed') {
        subject.completedAssessments++
      }
    })

    // Calculate averages and trends
    subjectMap.forEach(subject => {
      subject.completion = Math.round(subject.completion / subject.totalAssessments)
      // Simplified trend calculation
      subject.trend = subject.completion >= 80 ? "up" : subject.completion >= 60 ? "stable" : "down"
      subject.trendValue = Math.random() * 20 - 10 // Placeholder - would calculate from historical data
    })

    return Array.from(subjectMap.values())
  }, [assessments])

  // Generate recent activity
  const recentActivity: ActivityItem[] = useMemo(() => {
    const activities: ActivityItem[] = []

    // Add completed assessments
    assessments
      .filter(a => a.status === 'completed')
      .slice(-3)
      .forEach(assessment => {
        activities.push({
          id: assessment.id,
          type: "assessment",
          title: assessment.title,
          description: assessment.subject,
          timestamp: `${Math.floor(Math.random() * 7) + 1} hours ago`,
          value: 100
        })
      })

    // Add recent planner sessions
    plannerSessions
      .slice(-3)
      .forEach(session => {
        activities.push({
          id: session.id,
          type: session.type === 'milestone' ? 'milestone' : 'task',
          title: session.title,
          description: session.type,
          timestamp: `${Math.floor(Math.random() * 24) + 1} hours ago`
        })
      })

    return activities.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)).slice(0, 4)
  }, [assessments, plannerSessions])

  // Filter subject data
  const filteredSubjectData = useMemo(() => {
    if (selectedSubject === "all") return subjectData
    return subjectData.filter(subject => subject.name.toLowerCase().includes(selectedSubject.toLowerCase()))
  }, [subjectData, selectedSubject])

  // Get trend color
  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return "text-green-600 dark:text-green-400"
      case "down": return "text-red-600 dark:text-red-400"
      case "stable": return "text-muted-foreground"
      default: return "text-muted-foreground"
    }
  }

  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your progress</h1>
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your progress data...</p>
          </div>
        </div>
      </MotionWrapper>
    )
  }

  return (
    <MotionWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header Zone */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-foreground">Progress Overview</h1>
                <p className="text-muted-foreground">Your performance and trends at a glance</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Date Range Filter */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-md">
                  {[
                    { value: "week", label: "This Week" },
                    { value: "month", label: "This Month" },
                    { value: "term", label: "This Term" }
                  ].map((range) => (
                    <Button
                      key={range.value}
                      variant={dateRange === range.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDateRange(range.value as DateRange)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                {/* Subject Filter */}
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm"
                >
                  <option value="all">All Subjects</option>
                  {subjectData.map(subject => (
                    <option key={subject.name} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

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
          {summaryMetrics.weeklyTrend === "up" && (
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
                        You&apos;ve improved {Math.abs(summaryMetrics.completionChange)}% this {dateRange}. Keep up the excellent momentum!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}
        </div>
      </div>
    </MotionWrapper>
  )
}