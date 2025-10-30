"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createBrowserSupabaseClient, createCustomSupabaseClient, isSupabaseClientAvailable } from '@/lib/supabase-client'
import { env, isSupabaseConfigured } from '@/lib/env'
import { safeSingle } from '@/lib/supabase-utils'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string, options?: SignInOptions) => Promise<{ error: any }>
  signUp: (email: string, password: string, metadata?: any, options?: SignUpOptions) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any; data?: Profile }>
}

interface SignInOptions {
  redirectTo?: string
  createUser?: boolean
}

interface SignUpOptions {
  redirectTo?: string
  data?: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured())
  const supabase = createBrowserSupabaseClient()

  // If Supabase is not configured, show a helpful message
  if (!isConfigured || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Not Configured</h2>
          <p className="text-gray-600 mb-6">
            Please add your Supabase credentials to the <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file:
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
            <p className="font-mono text-sm text-gray-700 mb-2">NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</p>
            <p className="font-mono text-sm text-gray-700">NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</p>
          </div>
          <p className="text-sm text-gray-500">
            You can find these in your Supabase dashboard under Settings → API
          </p>
        </div>
      </div>
    )
  }

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
        const insertResult = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            avatar_url: user.user_metadata?.avatar_url || null
          })
          .select()
          .single()
        
        const { data: newProfile, error: createError } = await safeSingle(insertResult)

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

  const signIn = async (email: string, password: string, options?: SignInOptions) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any, options?: SignUpOptions) => {
    try {
      const emailRedirectTo = options?.redirectTo || `${env.NEXT_PUBLIC_APP_URL}/auth/sign-in`

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
          emailRedirectTo
        }
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    // Redirect to custom sign-in page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/sign-in'
    }
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No authenticated user') }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { error }
      }

      setProfile(data)
      return { error: null, data }
    } catch (error) {
      return { error }
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signIn, signUp, resetPassword, signOut, refreshProfile, updateProfile }}>
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