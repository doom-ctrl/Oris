"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { profileHelpers } from '@/lib/databaseHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, User, Mail, Camera, AlertCircle } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { Profile } from '@/types/database'

interface FormData {
  first_name: string
  last_name: string
  avatar_url: string
}

interface FormErrors {
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // First name validation
    if (formData.first_name && formData.first_name.length > 50) {
      newErrors.first_name = 'First name must be less than 50 characters'
    }
    if (formData.first_name && !/^[a-zA-Z\s'-]+$/.test(formData.first_name)) {
      newErrors.first_name = 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }

    // Last name validation
    if (formData.last_name && formData.last_name.length > 50) {
      newErrors.last_name = 'Last name must be less than 50 characters'
    }
    if (formData.last_name && !/^[a-zA-Z\s'-]+$/.test(formData.last_name)) {
      newErrors.last_name = 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }

    // Avatar URL validation
    if (formData.avatar_url) {
      try {
        new URL(formData.avatar_url)
        // Additional check for image file extensions
        const url = formData.avatar_url.toLowerCase()
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        const hasImageExtension = imageExtensions.some(ext => url.includes(ext))

        if (!hasImageExtension && !url.includes('gravatar.com')) {
          newErrors.avatar_url = 'Please enter a valid image URL'
        }
      } catch {
        newErrors.avatar_url = 'Please enter a valid URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsLoading(true)
    try {
      // Build profile data with only the fields that exist
      const profileData: Partial<Profile> & { id: string; email: string } = {
        id: user.id,
        email: user.email || '',
      }

      // Only include fields that have values and might not exist in the schema
      if (formData.first_name.trim()) {
        profileData.first_name = formData.first_name.trim()
      }
      if (formData.last_name.trim()) {
        profileData.last_name = formData.last_name.trim()
      }
      if (formData.avatar_url.trim()) {
        profileData.avatar_url = formData.avatar_url.trim()
      }

      await profileHelpers.upsertProfile(profileData)

      await refreshProfile()
      setIsEditing(false)
      setErrors({})
      toast.success('Profile updated successfully!')
    } catch (error: unknown) {
      console.error('Error updating profile:', error)

      // Handle specific database column errors
      const supabaseError = error as { code?: string }
      if (supabaseError?.code === 'PGRST204') {
        toast.error('Some profile fields are not yet available in the database. Please update the database schema.')
      } else {
        toast.error('Failed to update profile. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || ''
      })
    }
    setIsEditing(false)
    setErrors({})
  }

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName[0].toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mt-8"
        >
          <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">My Profile</CardTitle>
            <CardDescription className="text-gray-600">
              Manage your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.avatar_url || ''} alt="Profile" />
                  <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                    {getInitials(formData.first_name, formData.last_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Database Schema Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Database Setup Required</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Some profile fields may not be available yet. To enable all features, run the SQL migration script in your Supabase SQL editor:
                  </p>
                  <code className="text-xs bg-amber-100 px-2 py-1 rounded mt-2 block">
                    /database/migrations/001_add_profile_columns.sql
                  </code>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">Email cannot be changed</p>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your first name"
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.first_name}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your last name"
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.last_name}
                  </p>
                )}
              </div>

              {/* Avatar URL */}
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Textarea
                  id="avatar_url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter a URL for your profile picture"
                  rows={3}
                  className={errors.avatar_url ? 'border-red-500' : ''}
                />
                {errors.avatar_url && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.avatar_url}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Enter a URL to an image for your profile picture (JPG, PNG, GIF, WebP, or Gravatar)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>

            {/* Account Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since:</span>
                  <span className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account ID:</span>
                  <span className="font-medium font-mono text-xs">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  )
}