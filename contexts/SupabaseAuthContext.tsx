"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { safeSingle } from '@/lib/supabase-utils'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    try {
      // First check if profile exists without .single()
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)

      if (fetchError) {
        console.error('Error fetching profile:', fetchError)
        setProfile(null)
        return
      }

      // If no profile exists, create one
      if (!profiles || profiles.length === 0) {
        const { data: newProfile, error: createError } = await safeSingle(
          supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              avatar_url: user.user_metadata?.avatar_url || null
            })
            .select()
        )

        if (createError) {
          console.error('Error creating profile:', createError)
          setProfile(null)
        } else if (newProfile) {
          setProfile(newProfile)
        }
      } else {
        // Profile exists, use the first one
        setProfile(profiles[0] as Profile)
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error)
      setProfile(null)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      refreshProfile()
    } else {
      setProfile(null)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}