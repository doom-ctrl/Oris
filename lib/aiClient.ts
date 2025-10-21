/**
 * AI Client for parsing assessment plans from AI-generated text
 * Integrates with OpenRouter to convert natural language assessment plans
 * into structured assessment and task objects
 */

export interface ParsedAssessment {
  title: string
  subject?: string
  due_date?: string
  description?: string
  tasks: Array<{
    title: string
    description?: string
  }>
}

export interface SmartParseResponse {
  assessments: ParsedAssessment[]
  confidence: number
  clarifications_needed?: string[]
  context_used?: string
}

export interface AIImportResponse {
  success: boolean
  assessment?: any
  tasks?: any[]
  error?: string
}

/**
 * Smart parsing that handles natural language, multiple assessments, and context inference
 */
export async function smartParseAssessments(rawText: string, userContext?: {
  recentSubjects?: string[]
  currentSemester?: string
  defaultDueDays?: number
}): Promise<SmartParseResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured')
  }

  const today = new Date().toISOString().split('T')[0]
  const contextInfo = userContext ? `
User Context:
- Recent subjects: ${userContext.recentSubjects?.join(', ') || 'None'}
- Current semester: ${userContext.currentSemester || 'Unknown'}
- Default due days: ${userContext.defaultDueDays || 14}
Today's date: ${today}
` : `Today's date: ${today}`

  const prompt = `
You are an intelligent academic assessment planner that can understand natural language and extract multiple assessments from freeform text.

${contextInfo}

Analyze this text and extract ALL assessments mentioned:
"""${rawText}"""

Capabilities:
- Handle natural language ("I have a science report due next week about cells")
- Parse multiple assessments in one message
- Infer missing information using context
- Convert relative dates to exact dates
- Recognize subjects from content
- Generate appropriate tasks when not specified

Rules:
1. Return ONLY valid JSON, no extra text
2. Extract EVERY assessment mentioned, even implied ones
3. Use context to fill missing subjects, due dates, etc.
4. Convert "next week", "in two weeks", "Friday" to exact dates (YYYY-MM-DD)
5. Generate 3-5 logical tasks for assessments without explicit tasks
6. Set confidence score based on clarity of input (0.1-1.0)
7. List clarifications needed if information is ambiguous

Return this structure:
{
  "assessments": [
    {
      "title": "Assessment title",
      "subject": "Subject name (inferred if needed)",
      "due_date": "YYYY-MM-DD (calculated from relative terms)",
      "description": "Brief description",
      "tasks": [
        {"title": "Task title", "description": "Task details"}
      ]
    }
  ],
  "confidence": 0.8,
  "clarifications_needed": ["Any unclear items"],
  "context_used": "What context helped fill gaps"
}

Examples of input handling:
- "Math homework due Friday" → due_date = this Friday's date
- "Science report about cells" → subject = "Science", generate research tasks
- "Essay and presentation next week" → create two separate assessments
- "Same subject as before" → use from recent subjects context
`.trim()

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3009",
        "X-Title": "Assessment Manager AI Import"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an intelligent academic assessment planner that excels at understanding natural language and extracting structured assessment data. Always return valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response content from AI')
    }

    // Clean the response to ensure it's valid JSON
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()

    try {
      const parsed: SmartParseResponse = JSON.parse(cleanContent)

      // Validate required fields for smart parsing
      if (!parsed.assessments || !Array.isArray(parsed.assessments)) {
        throw new Error('Invalid AI response: missing assessments array')
      }

      // Validate each assessment
      const validAssessments = parsed.assessments.filter(assessment => {
        if (!assessment.title || !assessment.title.trim()) {
          console.warn('Skipping assessment without title:', assessment)
          return false
        }
        if (!Array.isArray(assessment.tasks)) {
          console.warn('Skipping assessment without tasks array:', assessment)
          return false
        }
        return true
      })

      // Process and clean each assessment
      const processedAssessments = validAssessments.map(assessment => ({
        title: assessment.title.trim(),
        subject: assessment.subject?.trim() || undefined,
        due_date: assessment.due_date || undefined,
        description: assessment.description?.trim() || undefined,
        tasks: assessment.tasks
          .filter((task: any) => task.title && task.title.trim())
          .map((task: any) => ({
            title: task.title.trim(),
            description: task.description?.trim() || undefined
          }))
      }))

      return {
        assessments: processedAssessments,
        confidence: parsed.confidence || 0.5,
        clarifications_needed: parsed.clarifications_needed || [],
        context_used: parsed.context_used || ''
      }
    } catch (parseError) {
      console.error('Failed to parse AI smart response:', content)
      throw new Error('AI smart response was not valid JSON')
    }
  } catch (error) {
    console.error('AI parsing error:', error)
    throw new Error(`Failed to parse assessment with AI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Gets user context for smarter AI parsing
 */
export async function getUserContext(userId: string): Promise<{
  recentSubjects: string[]
  currentSemester: string
  defaultDueDays: number
}> {
  try {
    // This would typically fetch from your database
    // For now, return sensible defaults
    return {
      recentSubjects: [],
      currentSemester: 'Current',
      defaultDueDays: 14
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return {
      recentSubjects: [],
      currentSemester: 'Current',
      defaultDueDays: 14
    }
  }
}

/**
 * Validates the parsed assessment data before database insertion
 */
export function validateParsedAssessment(data: ParsedAssessment): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Assessment title is required')
  }

  if (!data.tasks || data.tasks.length === 0) {
    errors.push('At least one task is required')
  } else {
    data.tasks.forEach((task, index) => {
      if (!task.title || task.title.trim().length === 0) {
        errors.push(`Task ${index + 1} title is required`)
      }
    })
  }

  if (data.due_date) {
    const dueDate = new Date(data.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date format')
    } else if (dueDate < today) {
      errors.push('Due date cannot be in the past')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Creates a fallback assessment when AI parsing fails
 */
export function createFallbackAssessment(rawText: string): ParsedAssessment {
  const lines = rawText.split('\n').filter(line => line.trim())
  const firstLine = lines[0] || 'Imported Assessment'

  return {
    title: firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine,
    subject: 'General',
    description: rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''),
    tasks: [
      { title: 'Review imported plan' },
      { title: 'Break down into smaller tasks' },
      { title: 'Set timeline and milestones' }
    ]
  }
}