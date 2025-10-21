"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Filter, ChevronLeft, Calendar, Clock, CheckCircle, Circle, Sparkles, Loader2, AlertCircle, Trash2, Edit3 } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MotionWrapper } from "@/components/motion/MotionWrapper"
import { assessmentHelpers, taskHelpers } from "@/lib/databaseHelpers"
import type { Assessment as DBAssessment, Task as DBTask } from "@/types/database"

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
  return (
    <ProtectedRoute>
      <AssessmentsPage />
    </ProtectedRoute>
  )
}

function AssessmentsPage() {
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

  // AI Import state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiText, setAiText] = useState("")
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSuccess, setAiSuccess] = useState<string | null>(null)

  // Edit Assessment state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<LocalAssessment | null>(null)

  // Edit Task state
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingTaskAssessmentId, setEditingTaskAssessmentId] = useState<string | null>(null)

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

  // Delete task
  const deleteTask = async (assessmentId: string, taskId: string) => {
    try {
      // Delete task from database
      await taskHelpers.deleteTask(taskId)

      // Update local state
      setAssessments(prev => prev.map(assessment => {
        if (assessment.id === assessmentId) {
          const updatedTasks = assessment.tasks.filter(task => task.id !== taskId)
          const completedTasks = updatedTasks.filter(task => task.completed).length
          const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0

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
          const updatedTasks = updated.tasks.filter(task => task.id !== taskId)
          const completedTasks = updatedTasks.filter(task => task.completed).length
          const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0

          setSelectedAssessment({
            ...updated,
            tasks: updatedTasks,
            progress,
            status: progress === 100 ? "completed" : updated.status
          })
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Add new task
  const addTask = async (assessmentId: string, taskTitle: string) => {
    if (!taskTitle.trim() || !user) return

    try {
      // Create task in database
      const newTask = await taskHelpers.createTask({
        title: taskTitle,
        assessment_id: assessmentId
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
        due_date: newAssessment.dueDate
      }, user.id)

      const localAssessment: LocalAssessment = {
        id: assessment.id,
        title: assessment.title,
        subject: assessment.subject,
        description: assessment.description || "",
        dueDate: assessment.due_date,
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

  // AI Import assessment
  const importFromAI = async () => {
    if (!aiText.trim() || !user) return

    setIsAiProcessing(true)
    setAiError(null)
    setAiSuccess(null)

    try {
      const response = await fetch('/api/ai/parse-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiText.trim(),
          useFallback: true // Allow fallback if AI fails
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import assessment')
      }

      if (data.success) {
        const assessmentCount = data.assessments?.length || 1
        const confidence = data.confidence || 0.5
        const clarifications = data.clarifications_needed || []

        let successMessage = data.message || `Successfully imported ${assessmentCount} assessment(s)!`

        if (confidence < 0.7) {
          successMessage += ` (Confidence: ${Math.round(confidence * 100)}%)`
        }

        if (clarifications.length > 0) {
          successMessage += ` Note: ${clarifications.join(', ')}`
        }

        setAiSuccess(successMessage)

        // Refresh assessments list
        const fetchAssessments = async () => {
          try {
            const assessmentsData = await assessmentHelpers.getUserAssessments(user.id)
            const assessmentsWithTasks: LocalAssessment[] = await Promise.all(
              assessmentsData.map(async (assessment: DBAssessment) => {
                const tasks = await taskHelpers.getAssessmentTasks(assessment.id)
                const localTasks: Task[] = tasks.map((task: DBTask) => ({
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  completed: task.completed,
                  dueDate: task.due_date || undefined
                }))

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
            console.error('Error refreshing assessments:', error)
          }
        }

        await fetchAssessments()

        // Close modal and reset after a short delay
        setTimeout(() => {
          setIsAiModalOpen(false)
          setAiText("")
          setAiSuccess(null)
        }, 2000)
      }
    } catch (error) {
      console.error('AI import error:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to import assessment')
    } finally {
      setIsAiProcessing(false)
    }
  }

  // Delete assessment
  const deleteAssessment = async (assessmentId: string) => {
    if (!user) return

    try {
      await assessmentHelpers.deleteAssessment(assessmentId)
      setAssessments(prev => prev.filter(a => a.id !== assessmentId))

      // Close detail view if the deleted assessment was selected
      if (selectedAssessment?.id === assessmentId) {
        setSelectedAssessment(null)
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
    }
  }

  // Edit assessment
  const startEditAssessment = (assessment: LocalAssessment) => {
    setEditingAssessment(assessment)
    setIsEditModalOpen(true)
  }

  const updateAssessment = async () => {
    if (!user || !editingAssessment) return

    try {
      await assessmentHelpers.updateAssessment(editingAssessment.id, {
        title: editingAssessment.title,
        subject: editingAssessment.subject,
        description: editingAssessment.description,
        due_date: editingAssessment.dueDate
      })

      // Update local state
      setAssessments(prev => prev.map(a =>
        a.id === editingAssessment.id ? editingAssessment : a
      ))

      // Update selected assessment if it's currently open
      if (selectedAssessment?.id === editingAssessment.id) {
        setSelectedAssessment(editingAssessment)
      }

      setIsEditModalOpen(false)
      setEditingAssessment(null)
    } catch (error) {
      console.error('Error updating assessment:', error)
    }
  }

  // Edit task functions
  const startEditTask = (task: Task, assessmentId: string) => {
    setEditingTask(task)
    setEditingTaskAssessmentId(assessmentId)
    setIsEditTaskModalOpen(true)
  }

  const updateTask = async () => {
    if (!user || !editingTask || !editingTaskAssessmentId) return

    try {
      await taskHelpers.updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        completed: editingTask.completed
      })

      // Update local state
      setAssessments(prev => prev.map(assessment => {
        if (assessment.id === editingTaskAssessmentId) {
          const updatedTasks = assessment.tasks.map(task =>
            task.id === editingTask.id ? editingTask : task
          )

          // Recalculate progress and status
          const completedTasks = updatedTasks.filter(task => task.completed).length
          const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0
          const status = progress === 100 ? "completed" : assessment.status

          return {
            ...assessment,
            tasks: updatedTasks,
            progress,
            status
          }
        }
        return assessment
      }))

      // Update selected assessment if it's currently open
      if (selectedAssessment?.id === editingTaskAssessmentId) {
        const updatedTasks = selectedAssessment.tasks.map(task =>
          task.id === editingTask.id ? editingTask : task
        )
        const completedTasks = updatedTasks.filter(task => task.completed).length
        const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0
        const status = progress === 100 ? "completed" : selectedAssessment.status

        setSelectedAssessment({
          ...selectedAssessment,
          tasks: updatedTasks,
          progress,
          status
        })
      }

      setIsEditTaskModalOpen(false)
      setEditingTask(null)
      setEditingTaskAssessmentId(null)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your assessments</h1>
            <Button asChild>
              <a href="/auth">Sign In</a>
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

                {/* AI Import Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsAiModalOpen(true)}
                  className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Import
                </Button>

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

                {/* AI Import Modal */}
                <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Assessment Import
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Instructions */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Smart Input Examples:</h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">Natural Language:</p>
                            <p>"I have a science report due next week about cells"</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">Multiple Assessments:</p>
                            <p>"Math homework on Friday and history essay due Monday"</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">Relative Dates:</p>
                            <p>"Presentation in two weeks, study guide due Friday"</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">Traditional Format:</p>
                            <p>"Assessment: English Essay, Due: Nov 15, Tasks: Research, Write, Edit"</p>
                          </div>
                        </div>
                      </div>

                      {/* Text Input */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Paste your AI-generated assessment plan:
                        </label>
                        <Textarea
                          value={aiText}
                          onChange={(e) => setAiText(e.target.value)}
                          placeholder="Try natural language like:
• I have a science report due next week about cells
• Math homework on Friday and history essay due Monday
• Presentation in two weeks about photosynthesis
• Study for biology test on Friday, review chapters 1-5

Or traditional format:
Assessment: English Essay on Shakespeare
Due: November 15, 2025
Subject: English Literature
Tasks: Research, Write draft, Edit, Submit"
                          className="min-h-[200px] resize-none"
                          disabled={isAiProcessing}
                        />
                      </div>

                      {/* Error Message */}
                      {aiError && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-destructive">{aiError}</p>
                        </div>
                      )}

                      {/* Success Message */}
                      {aiSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="h-4 w-4 rounded-full bg-green-500 flex-shrink-0" />
                          <p className="text-sm text-green-700 dark:text-green-300">{aiSuccess}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAiModalOpen(false)
                            setAiText("")
                            setAiError(null)
                            setAiSuccess(null)
                          }}
                          disabled={isAiProcessing}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={importFromAI}
                          disabled={!aiText.trim() || isAiProcessing}
                          className="gap-2"
                        >
                          {isAiProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Create Assessment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Assessment Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Assessment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={editingAssessment?.title || ''}
                          onChange={(e) => setEditingAssessment(prev => prev ? {...prev, title: e.target.value} : null)}
                          placeholder="Assessment title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Subject</label>
                        <Input
                          value={editingAssessment?.subject || ''}
                          onChange={(e) => setEditingAssessment(prev => prev ? {...prev, subject: e.target.value} : null)}
                          placeholder="Subject name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editingAssessment?.description || ''}
                          onChange={(e) => setEditingAssessment(prev => prev ? {...prev, description: e.target.value} : null)}
                          placeholder="Brief description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Due Date</label>
                        <Input
                          type="date"
                          value={editingAssessment?.dueDate || ''}
                          onChange={(e) => setEditingAssessment(prev => prev ? {...prev, dueDate: e.target.value} : null)}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={updateAssessment} disabled={!editingAssessment?.title.trim()}>
                          Update Assessment
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Task Modal */}
                <Dialog open={isEditTaskModalOpen} onOpenChange={setIsEditTaskModalOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Task Title</label>
                        <Input
                          value={editingTask?.title || ''}
                          onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                          placeholder="Task title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editingTask?.description || ''}
                          onChange={(e) => setEditingTask(prev => prev ? {...prev, description: e.target.value} : null)}
                          placeholder="Task description (optional)"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="taskCompleted"
                          checked={editingTask?.completed || false}
                          onChange={(e) => setEditingTask(prev => prev ? {...prev, completed: e.target.checked} : null)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="taskCompleted" className="text-sm font-medium">
                          Mark as completed
                        </label>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditTaskModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={updateTask} disabled={!editingTask?.title.trim()}>
                          Update Task
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
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(assessment.status)}>
                                  {assessment.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditAssessment(assessment)
                                  }}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteAssessment(assessment.id)
                                  }}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditAssessment(selectedAssessment)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAssessment(selectedAssessment.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group">
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

                                <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditTask(task, selectedAssessment.id)}
                                  >
                                    <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                  </button>
                                  <button
                                    onClick={() => deleteTask(selectedAssessment.id, task.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                  </button>
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