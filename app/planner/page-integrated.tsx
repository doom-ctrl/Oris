"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Edit3,
  Trash2,
  X,
  Target,
  Coffee
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MotionWrapper } from "@/components/motion/MotionWrapper"
import {
  assessmentHelpers,
  plannerHelpers
} from "@/lib/databaseHelpers"
import type { Assessment, PlannerSession } from "@/types/database"

// Types
interface DayCell {
  date: Date
  events: CalendarEvent[]
  isCurrentDay: boolean
  isToday: boolean
}

interface CalendarEvent {
  id: string
  title: string
  type: "assessment" | "study" | "milestone" | "review"
  date: string
  startTime?: string
  endTime?: string
  description?: string
  linkedAssessment?: string
  color?: string
}

type ViewMode = "week" | "month"

export default function PlannerPageIntegrated() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [plannerSessions, setPlannerSessions] = useState<PlannerSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newSession, setNewSession] = useState<{
    title: string
    type: "assessment" | "study" | "milestone" | "review"
    date: string
    startTime: string
    endTime: string
    description: string
    linkedAssessment: string
  }>({
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

        const [assessmentsData, sessionsData] = await Promise.all([
          assessmentHelpers.getUserAssessments(user.id),
          plannerHelpers.getPlannerSessions(
            user.id,
            getDateRangeStart(currentDate, viewMode),
            getDateRangeEnd(currentDate, viewMode)
          )
        ])

        setAssessments(assessmentsData)
        setPlannerSessions(sessionsData)
      } catch (error) {
        console.error('Error fetching planner data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, currentDate, viewMode])

  // Get date range for display
  const getDateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (viewMode === "week") {
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
      end.setDate(start.getDate() + 6)
    } else {
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
    }

    return { start, end }
  }, [currentDate, viewMode])

  // Format date range for header
  const formatDateRange = () => {
    const { start, end } = getDateRange
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

    if (viewMode === "week") {
      return `Week of ${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }
  }

  // Generate calendar days
  const generateCalendarDays = (): DayCell[] => {
    const { start, end } = getDateRange
    const days: DayCell[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]

      // Combine planner sessions and assessments
      const assessmentEvents = assessments
        .filter(assessment => assessment.due_date === dateStr)
        .map(assessment => ({
          id: assessment.id,
          title: assessment.title,
          type: 'assessment' as const,
          date: dateStr,
          description: assessment.description,
          linkedAssessment: assessment.id,
          color: 'indigo'
        }))

      const sessionEvents = plannerSessions
        .filter(session => session.date === dateStr)
        .map(session => ({
          id: session.id,
          title: session.title,
          type: session.type,
          date: dateStr,
          startTime: session.start_time,
          endTime: session.end_time,
          description: session.description,
          linkedAssessment: session.linked_assessment_id || undefined,
          color: session.type === 'assessment' ? 'indigo' :
                 session.type === 'study' ? 'emerald' : 'amber'
        }))

      const allEvents = [...assessmentEvents, ...sessionEvents]

      days.push({
        date: new Date(current),
        events: allEvents,
        isCurrentDay: current.toDateString() === currentDate.toDateString(),
        isToday: current.toDateString() === today.toDateString()
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // Get date range start and end for fetching
  const getDateRangeStart = (date: Date, mode: ViewMode): string => {
    const start = new Date(date)
    if (mode === "week") {
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
    } else {
      start.setDate(1)
    }
    return start.toISOString().split('T')[0]
  }

  const getDateRangeEnd = (date: Date, mode: ViewMode): string => {
    const end = new Date(date)
    if (mode === "week") {
      const start = new Date(date)
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
      end.setDate(start.getDate() + 6)
    } else {
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
    }
    return end.toISOString().split('T')[0]
  }

  // Navigate time
  const navigateTime = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Get event type color
  const getEventColor = (type: CalendarEvent["type"], color?: string) => {
    switch (type) {
      case "assessment":
        return color === "indigo" ? "bg-indigo-100 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300" :
               "bg-red-100 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
      case "study":
        return "bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
      case "milestone":
        return "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
      default:
        return "bg-gray-100 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300"
    }
  }

  // Get event icon
  const getEventIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "assessment":
        return <BookOpen className="h-3 w-3" />
      case "study":
        return <Target className="h-3 w-3" />
      case "milestone":
        return <Coffee className="h-3 w-3" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  // Add new session
  const addSession = async () => {
    if (!newSession.title || !newSession.date || !user) return

    try {
      const session = await plannerHelpers.createPlannerSession({
        title: newSession.title,
        type: newSession.type,
        date: newSession.date,
        start_time: newSession.startTime || undefined,
        end_time: newSession.endTime || undefined,
        description: newSession.description,
        linked_assessment_id: newSession.linkedAssessment || undefined,
        is_completed: false
      }, user.id)

      setPlannerSessions(prev => [...prev, session])
      setNewSession({
        title: "",
        type: "study",
        date: "",
        startTime: "",
        endTime: "",
        description: "",
        linkedAssessment: ""
      })
      setIsAddSessionOpen(false)
    } catch (error) {
      console.error('Error adding session:', error)
    }
  }

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      await plannerHelpers.deletePlannerSession(eventId)
      setPlannerSessions(prev => prev.filter(session => session.id !== eventId))
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const calendarDays = generateCalendarDays()

  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your planner</h1>
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
            <p className="text-muted-foreground">Loading your planner...</p>
          </div>
        </div>
      </MotionWrapper>
    )
  }

  return (
    <MotionWrapper>
      <div className="min-h-screen bg-background">
        {/* Header Zone */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">Planner</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRange()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Navigation */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateTime("prev")}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateTime("next")}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* View Toggle */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-md">
                  {(["week", "month"] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode(mode)}
                      className="capitalize"
                    >
                      {mode}
                    </Button>
                  ))}
                </div>

                {/* Add Session */}
                <Button
                  onClick={() => setIsAddSessionOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Session
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Calendar Zone */}
        <main className="container mx-auto px-4 py-6">
          <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-foreground border-r border-border/50 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className={`grid grid-cols-7 ${viewMode === "month" ? "min-h-[600px]" : "min-h-[400px]"}`}>
              <AnimatePresence mode="wait">
                {calendarDays.map((day, index) => (
                  <motion.div
                    key={day.date.toISOString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`
                      border-r border-b border-border/50 p-2 min-h-[100px]
                      ${day.isToday ? 'bg-primary/5' : ''}
                      ${index % 2 === 0 ? 'bg-muted/10' : ''}
                      ${index % 7 === 6 ? 'border-r-0' : ''}
                    `}
                  >
                    {/* Date Label */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`
                        text-sm font-medium
                        ${day.isToday ? 'text-primary' : 'text-muted-foreground'}
                        ${day.isCurrentDay ? 'font-bold' : ''}
                      `}>
                        {day.date.getDate()}
                      </span>
                      {day.isToday && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          Today
                        </Badge>
                      )}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {day.events.slice(0, 3).map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                          onClick={() => setSelectedEvent(event)}
                          className={`
                            p-2 rounded-md cursor-pointer text-xs
                            border-l-2 transition-all duration-200
                            ${getEventColor(event.type, event.color)}
                            hover:shadow-sm hover:translate-y-[-1px]
                          `}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {getEventIcon(event.type)}
                            <span className="font-medium truncate">
                              {event.title}
                            </span>
                          </div>
                          {event.startTime && (
                            <div className="flex items-center gap-1 opacity-75">
                              <Clock className="h-3 w-3" />
                              <span>{event.startTime}</span>
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {/* More Events Indicator */}
                      {day.events.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{day.events.length - 3} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Event Details Drawer */}
        <AnimatePresence>
          {selectedEvent && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                onClick={() => setSelectedEvent(null)}
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl z-50"
              >
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type, selectedEvent.color)}`}>
                          {getEventIcon(selectedEvent.type)}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">{selectedEvent.title}</h2>
                          <Badge variant="outline" className="mt-1">
                            {selectedEvent.type}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-foreground">
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    {selectedEvent.startTime && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Time</label>
                        <p className="text-foreground">
                          {selectedEvent.startTime}
                          {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                        </p>
                      </div>
                    )}

                    {selectedEvent.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-foreground mt-1">{selectedEvent.description}</p>
                      </div>
                    )}

                    {selectedEvent.linkedAssessment && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Linked Assessment</label>
                        <p className="text-foreground">Assessment #{selectedEvent.linkedAssessment}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-6 border-t border-border">
                    <div className="flex gap-2">
                      <Button variant="outline" className="gap-2 flex-1">
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => deleteEvent(selectedEvent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Add Session Modal */}
        <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Study Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Session Title</label>
                <Input
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Math Review"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={newSession.type}
                    onChange={(e) => setNewSession(prev => ({ ...prev, type: e.target.value as 'study' | 'milestone' }))}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                  >
                    <option value="study">Study Session</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={newSession.startTime}
                    onChange={(e) => setNewSession(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={newSession.endTime}
                    onChange={(e) => setNewSession(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What do you want to accomplish?"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Link to Assessment</label>
                <select
                  value={newSession.linkedAssessment}
                  onChange={(e) => setNewSession(prev => ({ ...prev, linkedAssessment: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                >
                  <option value="">None</option>
                  {assessments.map(assessment => (
                    <option key={assessment.id} value={assessment.id}>
                      {assessment.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddSessionOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={addSession} className="flex-1">
                  Add Session
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MotionWrapper>
  )
}