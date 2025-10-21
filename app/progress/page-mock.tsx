"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Calendar, BookOpen, CheckCircle, Activity, Award, Target, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MotionWrapper } from "@/components/motion/MotionWrapper"

// Types
interface ProgressData {
  date: string
  completion: number
  assessmentsCompleted: number
  tasksCompleted: number
}

interface SubjectData {
  name: string
  completion: number
  totalAssessments: number
  completedAssessments: number
  trend: "up" | "down" | "stable"
  trendValue: number
}

interface ActivityItem {
  id: string
  type: "assessment" | "task" | "milestone"
  title: string
  description: string
  timestamp: string
  value?: number
}

// Mock data
const mockProgressData: ProgressData[] = [
  { date: "2024-10-15", completion: 45, assessmentsCompleted: 2, tasksCompleted: 8 },
  { date: "2024-10-16", completion: 48, assessmentsCompleted: 2, tasksCompleted: 10 },
  { date: "2024-10-17", completion: 52, assessmentsCompleted: 3, tasksCompleted: 12 },
  { date: "2024-10-18", completion: 55, assessmentsCompleted: 3, tasksCompleted: 14 },
  { date: "2024-10-19", completion: 58, assessmentsCompleted: 4, tasksCompleted: 16 },
  { date: "2024-10-20", completion: 62, assessmentsCompleted: 5, tasksCompleted: 19 },
  { date: "2024-10-21", completion: 68, assessmentsCompleted: 6, tasksCompleted: 23 },
]

const mockSubjectData: SubjectData[] = [
  { name: "Mathematics", completion: 84, totalAssessments: 5, completedAssessments: 4, trend: "up", trendValue: 12 },
  { name: "English", completion: 72, totalAssessments: 4, completedAssessments: 3, trend: "up", trendValue: 8 },
  { name: "Physics", completion: 65, totalAssessments: 3, completedAssessments: 2, trend: "stable", trendValue: 0 },
  { name: "Chemistry", completion: 58, totalAssessments: 4, completedAssessments: 2, trend: "down", trendValue: -5 },
  { name: "History", completion: 91, totalAssessments: 2, completedAssessments: 2, trend: "up", trendValue: 15 },
]

const mockActivity: ActivityItem[] = [
  {
    id: "1",
    type: "assessment",
    title: "Literature Essay Completed",
    description: "English",
    timestamp: "2 hours ago",
    value: 100
  },
  {
    id: "2",
    type: "task",
    title: "Completed 3 tasks in Calculus",
    description: "Mathematics",
    timestamp: "5 hours ago"
  },
  {
    id: "3",
    type: "milestone",
    title: "Reached 80% completion",
    description: "Mathematics - Calculus Midterm",
    timestamp: "1 day ago",
    value: 80
  },
  {
    id: "4",
    type: "assessment",
    title: "Physics Lab Report",
    description: "Physics",
    timestamp: "2 days ago",
    value: 75
  }
]

type DateRange = "week" | "month" | "term"

export default function ProgressPage() {
  const [dateRange, setDateRange] = useState<DateRange>("week")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const currentData = mockProgressData[mockProgressData.length - 1]
    const previousData = mockProgressData[Math.max(0, mockProgressData.length - 2)]
    const completionChange = currentData.completion - previousData.completion

    return {
      overallCompletion: currentData.completion,
      completionChange,
      assessmentsCompleted: currentData.assessmentsCompleted,
      tasksCompleted: currentData.tasksCompleted,
      activeSubjects: mockSubjectData.filter(s => s.completion > 0).length,
      weeklyTrend: completionChange > 0 ? "up" : completionChange < 0 ? "down" : "stable"
    }
  }, [])

  // Filter subject data based on selection
  const filteredSubjectData = useMemo(() => {
    if (selectedSubject === "all") return mockSubjectData
    return mockSubjectData.filter(subject => subject.name.toLowerCase().includes(selectedSubject.toLowerCase()))
  }, [selectedSubject])

  // Get trend color
  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return "text-green-600 dark:text-green-400"
      case "down": return "text-red-600 dark:text-red-400"
      case "stable": return "text-muted-foreground"
      default: return "text-muted-foreground"
    }
  }

  // Get progress color
  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500"
    if (value >= 60) return "bg-blue-500"
    if (value >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
                  {mockSubjectData.map(subject => (
                    <option key={subject.name} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Summary Zone */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                    {/* Simple line chart visualization */}
                    <div className="absolute inset-0 flex items-end justify-between gap-2">
                      {mockProgressData.map((data, index) => (
                        <motion.div
                          key={data.date}
                          initial={{ height: 0 }}
                          animate={{ height: `${data.completion}%` }}
                          transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                          className="flex-1 bg-gradient-to-t from-primary/20 to-primary/60 rounded-t-md relative group cursor-pointer"
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-semibold">{data.completion}%</div>
                            <div className="text-muted-foreground">{formatDate(data.date)}</div>
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
                    {mockActivity.map((activity, index) => (
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
                        You've improved {Math.abs(summaryMetrics.completionChange)}% this week. Keep up the excellent momentum!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}
        </main>
      </div>
    </MotionWrapper>
  )
}