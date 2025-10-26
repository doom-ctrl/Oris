"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar"
import { MotionWrapper } from "@/components/motion/MotionWrapper"
import {
  assessmentHelpers,
  plannerHelpers
} from "@/lib/databaseHelpers"
import type { Assessment, PlannerSession } from "@/types/database"

// Types for the new calendar
interface CalendarEvent {
  id: number
  name: string
  time: string
  datetime: string
  type?: "assessment" | "study" | "milestone" | "other"
  assessmentId?: string
}

interface CalendarData {
  day: Date
  events: CalendarEvent[]
}

export default function NewPlannerPage() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [plannerSessions, setPlannerSessions] = useState<PlannerSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data from Supabase
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get current month and next month for better calendar coverage
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0)

        const [assessmentsData, sessionsData] = await Promise.all([
          assessmentHelpers.getUserAssessments(user.id),
          plannerHelpers.getPlannerSessions(
            user.id,
            startOfMonth.toISOString().split('T')[0],
            endOfNextMonth.toISOString().split('T')[0]
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
  }, [user])

  // Transform data for FullScreenCalendar component
  const transformCalendarData = (): CalendarData[] => {
    const calendarData: CalendarData[] = []
    const eventsByDate: { [key: string]: CalendarEvent[] } = {}

    // Process assessments
    assessments.forEach(assessment => {
      const dateStr = assessment.due_date
      if (dateStr && !eventsByDate[dateStr]) {
        eventsByDate[dateStr] = []
      }

      if (dateStr) {
        eventsByDate[dateStr].push({
          id: parseInt(assessment.id),
          name: `Assessment: ${assessment.title}`,
          time: 'Due Date',
          datetime: `${dateStr}T23:59:00`,
          type: 'assessment',
          assessmentId: assessment.id
        })
      }
    })

    // Process planner sessions
    plannerSessions.forEach(session => {
      const dateStr = session.date
      if (dateStr && !eventsByDate[dateStr]) {
        eventsByDate[dateStr] = []
      }

      if (dateStr) {
        eventsByDate[dateStr].push({
          id: parseInt(session.id),
          name: session.title,
          time: session.start_time || 'All day',
          datetime: `${dateStr}T${session.start_time || '00:00'}:00`,
          type: session.type as CalendarEvent['type'],
          assessmentId: session.linked_assessment_id || undefined
        })
      }
    })

    // Convert to CalendarData format
    Object.entries(eventsByDate).forEach(([dateStr, events]) => {
      calendarData.push({
        day: new Date(dateStr),
        events
      })
    })

    return calendarData
  }

  if (!user) {
    return (
      <MotionWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your planner</h1>
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">Planner</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{format(new Date(), 'MMMM yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Calendar */}
        <main className="flex-1">
          <FullScreenCalendar
            data={transformCalendarData()}
            onEventClick={(event) => {
              console.log('Event clicked:', event)
              // You can add event detail handling here
            }}
            onNewEvent={(date) => {
              console.log('New event for date:', date)
              // You can add new event creation here
            }}
          />
        </main>
      </div>
    </MotionWrapper>
  )
}