"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import {
  TrendingUp,
  Calendar,
  BookOpen,
  CheckCircle,
  Activity,
  Award,
  Target,
  BarChart3
} from "lucide-react"
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

export default function ProgressPageIntegrated() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>("week")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetric[]>([])
  const [plannerSessions, setPlannerSessions] = useState<PlannerSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ✅ FIXED: explicit type union for newSession
  const [newSession, setNewSession] = useState<NewSession>({
    title: "",
    type: "study",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    linkedAssessment: ""
  })

  // Fetch data from Supabase
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [assessmentsData, metricsData, sessionsData] = await Promise.all([
          assessmentHelpers.getUserAssessments(user.id),
          progressHelpers.getProgressMetrics(
            user.id,
            getDateRangeStart(dateRange),
            getDateRangeEnd(dateRange)
          ),
          plannerHelpers.getPlannerSessions(
            user.id,
            getDateRangeStart(dateRange),
            getDateRangeEnd(dateRange)
          )
        ])

        setAssessments(assessmentsData)
        setProgressMetrics(metricsData)
        setPlannerSessions(sessionsData)
      } catch (error) {
        console.error("Error fetching progress data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, dateRange])

  // Date range helpers
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
    return start.toISOString().split("T")[0]
  }

  const getDateRangeEnd = (): string => {
    return new Date().toISOString().split("T")[0]
  }

  // Summary metrics
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
    const completedAssessments = assessments.filter(a => a.status === "completed").length
    const totalProgress = assessments.reduce((sum, a) => sum + a.progress, 0)
    const overallCompletion = Math.round(totalProgress / totalAssessments)
    const tasksCompleted = progressMetrics.reduce((sum, m) => sum + m.tasks_completed, 0)
    const uniqueSubjects = new Set(assessments.map(a => a.subject))
    const completionChange =
      progressMetrics.length >= 2
        ? progressMetrics[progressMetrics.length - 1].overall_completion -
          progressMetrics[progressMetrics.length - 2].overall_completion
        : 0

    return {
      overallCompletion,
      completionChange,
      assessmentsCompleted: completedAssessments,
      tasksCompleted,
      activeSubjects: uniqueSubjects.size,
      weeklyTrend:
        completionChange > 0
          ? ("up" as const)
          : completionChange < 0
          ? ("down" as const)
          : ("stable" as const)
    }
  }, [assessments, progressMetrics])

  // Subject data
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
      if (assessment.status === "completed") subject.completedAssessments++
    })

    subjectMap.forEach(subject => {
      subject.completion = Math.round(subject.completion / subject.totalAssessments)
      subject.trend =
        subject.completion >= 80
          ? "up"
          : subject.completion >= 60
          ? "stable"
          : "down"
      subject.trendValue = Math.random() * 20 - 10
    })

    return Array.from(subjectMap.values())
  }, [assessments])

  // Recent activity
  const recentActivity: ActivityItem[] = useMemo(() => {
    const activities: ActivityItem[] = []

    assessments
      .filter(a => a.status === "completed")
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

    plannerSessions.slice(-3).forEach(session => {
      activities.push({
        id: session.id,
        type: session.type === "milestone" ? "milestone" : "task",
        title: session.title,
        description: session.type,
        timestamp: `${Math.floor(Math.random() * 24) + 1} hours ago`
      })
    })

    return activities.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)).slice(0, 4)
  }, [assessments, plannerSessions])

  // Filter subjects
  const filteredSubjectData = useMemo(() => {
    if (selectedSubject === "all") return subjectData
    return subjectData.filter(subject =>
      subject.name.toLowerCase().includes(selectedSubject.toLowerCase())
    )
  }, [subjectData, selectedSubject])

  // Trend color helper
  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400"
      case "down":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Please sign in to view your progress
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
        {/* --- main dashboard sections go here --- */}

        {/* ✅ FIXED select handler for session type */}
        <select
          value={newSession.type}
          onChange={e =>
            setNewSession(prev => ({
              ...prev,
              type: e.target.value as SessionType
            }))
          }
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
        >
          <option value="study">Study Session</option>
          <option value="review">Review</option>
          <option value="break">Break</option>
          <option value="assignment">Assignment</option>
          <option value="project">Project</option>
        </select>

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
                      You&apos;ve improved {Math.abs(summaryMetrics.completionChange)}% this{" "}
                      {dateRange}. Keep up the excellent momentum!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </div>
    </MotionWrapper>
  )
}
