"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { profileHelpers } from '@/lib/databaseHelpers'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/types/database'

interface UserContextType {
  profile: Profile | null
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isClerkLoaded } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    if (!isSupabaseConfigured) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      let userProfile = await profileHelpers.getUserProfile(user.id)

      // If profile doesn't exist, create one
      if (!userProfile) {
        userProfile = await profileHelpers.upsertProfile({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          first_name: user.firstName || undefined,
          last_name: user.lastName || undefined,
          avatar_url: user.imageUrl || undefined,
        })
      }

      setProfile(userProfile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isClerkLoaded && user) {
      refreshProfile()
    } else if (isClerkLoaded && !user) {
      setProfile(null)
      setIsLoading(false)
    }
  }, [user, isClerkLoaded])

  return (
    <UserContext.Provider value={{ profile, isLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserProfile() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider')
  }
  return context
}