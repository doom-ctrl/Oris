"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, ChevronLeft, CheckCircle, Circle, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MotionWrapper } from "@/components/motion/MotionWrapper"
import { assessmentHelpers, taskHelpers } from "@/lib/databaseHelpers"
import { Task as DBTask } from "@/types/database"

// Local task interface for UI
interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
}

// Local assessment interface for UI
interface LocalAssessment {
  id: string
  title: string
  subject: string
  description: string
  dueDate: string
  status: "upcoming" | "completed" | "overdue"
  progress: number
  tasks: Task[]
}

type DateRange = "all" | "upcoming" | "completed"

export default function AssessmentsPageIntegrated() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<LocalAssessment[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<LocalAssessment | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<DateRange>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    subject: "",
    description: "",
    dueDate: ""
  })

  // Fetch assessments from Supabase
  useEffect(() => {
    if (!user) return

    const fetchAssessments = async () => {
      try {
        setIsLoading(true)
        const assessmentsData = await assessmentHelpers.getUserAssessments(user.id)

        // Fetch tasks for each assessment
        const assessmentsWithTasks: LocalAssessment[] = await Promise.all(
          assessmentsData.map(async (assessment) => {
            const tasks = await taskHelpers.getAssessmentTasks(assessment.id)

            // Convert tasks to local format
            const localTasks: Task[] = tasks.map((task: DBTask) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              completed: task.completed,
              dueDate: task.due_date || undefined
            }))

            // Determine status based on due date and progress
            const today = new Date()
            const dueDate = new Date(assessment.due_date || '')
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            let status: "upcoming" | "completed" | "overdue" = "upcoming"
            if (assessment.progress === 100) {
              status = "completed"
            } else if (daysUntilDue < 0 && assessment.due_date) {
              status = "overdue"
            }

            return {
              id: assessment.id,
              title: assessment.title,
              subject: assessment.subject,
              description: assessment.description || "",
              dueDate: assessment.due_date || "",
              status,
              progress: assessment.progress,
              tasks: localTasks
            }
          })
        )

        setAssessments(assessmentsWithTasks)
      } catch (error) {
        console.error('Error fetching assessments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssessments()
  }, [user])

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || assessment.status === filter
    return matchesSearch && matchesFilter
  })

  // Get status color
  const getStatusColor = (status: LocalAssessment["status"]) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "overdue": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  // Calculate days until due
  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Toggle task completion
  const toggleTask = async (assessmentId: string, taskId: string) => {
    try {
      // Update task in database
      await taskHelpers.toggleTaskCompletion(taskId)

      // Update local state
      setAssessments(prev => prev.map(assessment => {
        if (assessment.id === assessmentId) {
          const updatedTasks = assessment.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
          const completedTasks = updatedTasks.filter(task => task.completed).length
          const progress = Math.round((completedTasks / updatedTasks.length) * 100)

          return {
            ...assessment,
            tasks: updatedTasks,
            progress,
            status: progress === 100 ? "completed" : assessment.status
          }
        }
        return assessment
      }))

      // Update selected assessment if it's currently open
      if (selectedAssessment?.id === assessmentId) {
        const updated = assessments.find(a => a.id === assessmentId)
        if (updated) {
          const updatedTasks = updated.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
          const completedTasks = updatedTasks.filter(task => task.completed).length
          const progress = Math.round((completedTasks / updatedTasks.length) * 100)

          setSelectedAssessment({
            ...updated,
            tasks: updatedTasks,
            progress,
            status: progress === 100 ? "completed" : updated.status
          })
        }
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  // Add new task
  const addTask = async (assessmentId: string, taskTitle: string) => {
    if (!taskTitle.trim() || !user) return

    try {
      // Create task in database
      const newTask = await taskHelpers.createTask({
        title: taskTitle,
        assessment_id: assessmentId,
        completed: false,
        priority: 'medium'
      }, user.id)

      // Update local state
      const localTask: Task = {
        id: newTask.id,
        title: newTask.title,
        completed: newTask.completed,
        dueDate: newTask.due_date
      }

      setAssessments(prev => prev.map(assessment => {
        if (assessment.id === assessmentId) {
          return { ...assessment, tasks: [...assessment.tasks, localTask] }
        }
        return assessment
      }))

      // Update selected assessment if it's currently open
      if (selectedAssessment?.id === assessmentId) {
        setSelectedAssessment(prev => prev ? {
          ...prev,
          tasks: [...prev.tasks, localTask]
        } : null)
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  // Create new assessment
  const createAssessment = async () => {
    if (!newAssessment.title || !newAssessment.subject || !newAssessment.dueDate || !user) return

    try {
      const assessment = await assessmentHelpers.createAssessment({
        title: newAssessment.title,
        subject: newAssessment.subject,
        description: newAssessment.description,
        due_date: newAssessment.dueDate,
        status: 'upcoming',
        progress: 0,
        priority: 'medium'
      }, user.id)

      const localAssessment: LocalAssessment = {
        id: assessment.id,
        title: assessment.title,
        subject: assessment.subject,
        description: assessment.description || "",
        dueDate: assessment.due_date || "",
        status: "upcoming",
        progress: 0,
        tasks: []
      }

      setAssessments(prev => [localAssessment, ...prev])
      setNewAssessment({ title: "", subject: "", description: "", dueDate: "" })
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Error creating assessment:', error)
    }
  }

  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your assessments</h1>
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
            <p className="text-muted-foreground">Loading your assessments...</p>
          </div>
        </div>
      </MotionWrapper>
    )
  }

  return (
    <MotionWrapper>
      <div className="min-h-screen bg-background">
        {/* Header Bar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">Your Assessments</h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-background/50"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-md">
                  {(["all", "upcoming", "completed"] as const).map((filterOption) => (
                    <Button
                      key={filterOption}
                      variant={filter === filterOption ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilter(filterOption)}
                      className="capitalize"
                    >
                      {filterOption}
                    </Button>
                  ))}
                </div>

                {/* Add Assessment */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Assessment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Assessment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={newAssessment.title}
                          onChange={(e) => setNewAssessment(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Assessment title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Subject</label>
                        <Input
                          value={newAssessment.subject}
                          onChange={(e) => setNewAssessment(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Subject name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={newAssessment.description}
                          onChange={(e) => setNewAssessment(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Due Date</label>
                        <Input
                          type="date"
                          value={newAssessment.dueDate}
                          onChange={(e) => setNewAssessment(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createAssessment}>
                          Create Assessment
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchQuery || filter !== "all" ? "No assessments found" : "No assessments yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery || filter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first assessment to get started"
                }
              </p>
              {!searchQuery && filter === "all" && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assessment
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {!selectedAssessment ? (
                // Assessment Overview
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredAssessments.map((assessment, index) => {
                    const daysUntilDue = getDaysUntilDue(assessment.dueDate)
                    const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0 && assessment.status !== "completed"

                    return (
                      <motion.div
                        key={assessment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="cursor-pointer"
                        onClick={() => setSelectedAssessment(assessment)}
                      >
                        <Card className={`h-full transition-all duration-300 hover:shadow-lg ${
                          isUrgent ? 'ring-2 ring-orange-200 dark:ring-orange-800/50' : ''
                        } ${assessment.status === 'completed' ? 'opacity-75' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold line-clamp-2">
                                  {assessment.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {assessment.subject}
                                </p>
                              </div>
                              <Badge className={`ml-2 ${getStatusColor(assessment.status)}`}>
                                {assessment.status}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {assessment.description}
                            </p>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(assessment.dueDate).toLocaleDateString()}</span>
                              {isUrgent && (
                                <Badge variant="outline" className="text-orange-600 border-orange-200">
                                  {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span>{assessment.progress}%</span>
                              </div>
                              <Progress value={assessment.progress} className="h-2" />
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                {assessment.tasks.filter(t => t.completed).length}/{assessment.tasks.length} tasks
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                // Focused Detail View
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedAssessment(null)}
                      className="gap-2 mb-4"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to all assessments
                    </Button>
                  </div>

                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl font-bold mb-2">
                            {selectedAssessment.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Due: {new Date(selectedAssessment.dueDate).toLocaleDateString()}
                            </span>
                            <Badge className={getStatusColor(selectedAssessment.status)}>
                              {selectedAssessment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground">
                          {selectedAssessment.description}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Overall Progress</h3>
                          <span>{selectedAssessment.progress}%</span>
                        </div>
                        <Progress value={selectedAssessment.progress} className="h-3" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Task Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Tasks</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {selectedAssessment.tasks.filter(t => t.completed).length}/{selectedAssessment.tasks.length} completed
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Add Task */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a task..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addTask(selectedAssessment.id, e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input')
                            if (input?.value) {
                              addTask(selectedAssessment.id, input.value)
                              input.value = ''
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>

                      {/* Task List */}
                      <div className="space-y-2">
                        <AnimatePresence>
                          {selectedAssessment.tasks.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="group"
                            >
                              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                                <button
                                  onClick={() => toggleTask(selectedAssessment.id, task.id)}
                                  className="mt-0.5"
                                >
                                  {task.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                                  )}
                                </button>

                                <div className="flex-1">
                                  <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </MotionWrapper>
  )
}