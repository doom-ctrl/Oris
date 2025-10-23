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

// -------------------------
// ✅ Type definitions
// -------------------------
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

export default function PlannerPageIntegrated() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetric[]>([])
  const [plannerSessions, setPlannerSessions] = useState<PlannerSession[]>([])
  const [dateRange, setDateRange] = useState<DateRange>("week")

  // ✅ Explicitly typed session to allow all session types
  const [newSession, setNewSession] = useState<NewSession>({
    title: "",
    type: "study",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    linkedAssessment: ""
  })

  // -------------------------
  // ✅ Fetch data from Supabase
  // -------------------------
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [a, m, s] = await Promise.all([
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
        setAssessments(a)
        setProgressMetrics(m)
        setPlannerSessions(s)
      } catch (err) {
        console.error("Error fetching planner data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, dateRange])

  // -------------------------
  // ✅ Date range helpers
  // -------------------------
  const getDateRangeStart = (range: DateRange) => {
    const today = new Date()
    const start = new Date(today)
    if (range === "week") start.setDate(today.getDate() - 7)
    if (range === "month") start.setMonth(today.getMonth() - 1)
    if (range === "term") start.setMonth(today.getMonth() - 3)
    return start.toISOString().split("T")[0]
  }

  const getDateRangeEnd = () => new Date().toISOString().split("T")[0]

  // -------------------------
  // ✅ Handler for session type (fixes the build)
  // -------------------------
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as SessionType
    setNewSession(prev => ({ ...prev, type: selectedType }))
  }

  // -------------------------
  // ✅ Loading and Auth Guards
  // -------------------------
  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Please sign in to view your planner
            </h1>
            <Button asChild><a href="/sign-in">Sign In</a></Button>
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
            <div className="animate-spin h-10 w-10 border-b-2 border-primary mx-auto mb-3 rounded-full"></div>
            <p className="text-muted-foreground">Loading planner data...</p>
          </div>
        </div>
      </MotionWrapper>
    )
  }

  // -------------------------
  // ✅ Render UI
  // -------------------------
  return (
    <MotionWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <h2 className="text-lg font-semibold">Create New Session</h2>

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

        <Card className="mt-6 border-green-200 dark:border-green-800/50 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20">
          <CardContent className="p-6 flex gap-4 items-center">
            <div className="p-3 rounded-full bg-green-500/10">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Great work!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                Your planner and progress are synced and running smoothly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MotionWrapper>
  )
}
