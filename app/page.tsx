"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { MotionWrapper } from "@/components/motion/MotionWrapper"

export default function RootRedirect() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/assessments")
      } else {
        router.replace("/auth/sign-in")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <MotionWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MotionWrapper>
    )
  }

  return null
}