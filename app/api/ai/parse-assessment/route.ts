import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseAssessmentFromAI, smartParseAssessments, getUserContext, validateParsedAssessment, createFallbackAssessment, type ParsedAssessment, type SmartParseResponse } from '@/lib/aiClient'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('AI Parse API called')

  try {
    // Get user session from Supabase
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Auth check:', { user: !!user, authError })

    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to use AI import' },
        { status: 401 }
      )
    }

    // Parse request body
    let body;
    try {
      body = await request.json()
      console.log('Request body received:', { hasText: !!body.text, textLength: body.text?.length })
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { text, useFallback = false } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log('Invalid text input:', { text, type: typeof text, length: text?.length })
      return NextResponse.json(
        { error: 'Please provide the text to parse' },
        { status: 400 }
      )
    }

    let smartResponse: SmartParseResponse | null = null
    let usedFallback = false
    let createdAssessments: any[] = []
    let createdTasks: any[] = []

    try {
      // Get user context for smarter parsing
      const userContext = await getUserContext(user.id)

      // Try smart parsing first
      smartResponse = await smartParseAssessments(text.trim(), userContext)
      console.log('Smart parsing successful:', {
        assessmentCount: smartResponse.assessments.length,
        confidence: smartResponse.confidence
      })

      // Create all assessments from the smart response
      for (const parsedAssessment of smartResponse.assessments) {
        // Validate parsed data
        const validation = validateParsedAssessment(parsedAssessment)
        if (!validation.isValid) {
          console.warn('Skipping assessment with validation errors:', validation.errors)
          continue
        }

        // Set default due date if not provided (30 days from now)
        if (!parsedAssessment.due_date) {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + 30)
          parsedAssessment.due_date = futureDate.toISOString().split('T')[0]
        }

        // Create assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .insert([{
            title: parsedAssessment.title,
            subject: parsedAssessment.subject || 'General',
            description: parsedAssessment.description,
            due_date: parsedAssessment.due_date,
            progress: 0,
            user_id: user.id
          }])
          .select()
          .single()

        if (assessmentError || !assessment) {
          console.error('Assessment creation error:', assessmentError)
          continue
        }

        // Create tasks for the assessment
        const tasksToInsert = parsedAssessment.tasks.map(task => ({
          assessment_id: assessment.id,
          title: task.title,
          description: task.description,
          completed: false,
          user_id: user.id
        }))

        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksToInsert)
          .select()

        if (tasksError) {
          console.error('Tasks creation error:', tasksError)
        }

        createdAssessments.push(assessment)
        createdTasks.push(...(tasks || []))
      }

      // If no assessments were created, fall back
      if (createdAssessments.length === 0) {
        throw new Error('No valid assessments could be created from smart parsing')
      }

    } catch (aiError) {
      console.error('Smart parsing failed:', aiError)

      if (useFallback) {
        // Create fallback assessment using the old method
        const fallbackAssessment = createFallbackAssessment(text.trim())

        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .insert([{
            title: fallbackAssessment.title,
            subject: fallbackAssessment.subject || 'General',
            description: fallbackAssessment.description,
            due_date: fallbackAssessment.due_date,
            progress: 0,
            user_id: user.id
          }])
          .select()
          .single()

        if (assessmentError || !assessment) {
          console.error('Fallback assessment creation error:', assessmentError)
          return NextResponse.json(
            { error: 'Failed to create fallback assessment' },
            { status: 500 }
          )
        }

        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .insert(fallbackAssessment.tasks.map(task => ({
            assessment_id: assessment.id,
            title: task.title,
            description: task.description,
            completed: false,
            user_id: user.id
          })))
          .select()

        createdAssessments = [assessment]
        createdTasks = tasks || []
        usedFallback = true
      } else {
        return NextResponse.json(
          {
            error: 'AI parsing failed. The text might be unclear or the AI service is unavailable.',
            details: aiError instanceof Error ? aiError.message : 'Unknown error'
          },
          { status: 422 }
        )
      }
    }

    // Return success response
    const responseData = {
      success: true,
      assessments: createdAssessments,
      tasks: createdTasks,
      usedFallback,
      confidence: smartResponse?.confidence || 0.5,
      clarifications_needed: smartResponse?.clarifications_needed || [],
      context_used: smartResponse?.context_used || '',
      message: usedFallback
        ? `Created ${createdAssessments.length} assessment(s) using smart parsing`
        : `Successfully created ${createdAssessments.length} assessment(s) from natural language`
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Optional: Add rate limiting or other middleware here
export async function GET() {
  return NextResponse.json(
    { message: 'AI Assessment Parser API - Use POST to parse assessment text' },
    { status: 200 }
  )
}