"use client"

import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthPage() {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const [redirectUrl, setRedirectUrl] = useState('/assessments')

  useEffect(() => {
    // Safely access window object after component mounts
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/assessments`)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="h-12 w-12 flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Oris"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-foreground">Oris</span>
          </Link>
          <p className="mt-4 text-muted-foreground">
            Your intelligent assessment and progress management platform
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                    brandButtonText: 'hsl(var(--primary-foreground))',
                    defaultButtonBackground: 'hsl(var(--secondary))',
                    defaultButtonBackgroundHover: 'hsl(var(--secondary) / 0.8)',
                    defaultButtonBorder: 'hsl(var(--border))',
                    defaultButtonText: 'hsl(var(--secondary-foreground))',
                    dividerBackground: 'hsl(var(--border))',
                    inputBackground: 'hsl(var(--background))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                    inputLabelText: 'hsl(var(--foreground))',
                    inputPlaceholder: 'hsl(var(--muted-foreground))',
                    messageText: 'hsl(var(--foreground))',
                    messageTextDanger: 'hsl(var(--destructive))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary) / 0.8)',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  fonts: {
                    bodyFontFamily: `var(--font-geist-sans), ui-sans-serif, sans-serif`,
                    buttonFontFamily: `var(--font-geist-sans), ui-sans-serif, sans-serif`,
                    inputFontFamily: `var(--font-geist-sans), ui-sans-serif, sans-serif`,
                    labelFontFamily: `var(--font-geist-sans), ui-sans-serif, sans-serif`,
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    buttonBorderRadius: 'var(--radius)',
                    inputBorderRadius: 'var(--radius)',
                  },
                }
              },
              className: {
                anchor: 'text-primary hover:text-primary/80 transition-colors',
                button: 'transition-all duration-200 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                container: 'space-y-4',
                divider: 'text-muted-foreground',
                input: 'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                label: 'font-medium text-foreground',
                loader: 'text-primary',
                message: 'text-sm',
              }
            }}
            providers={['google', 'github']}
            redirectTo={redirectUrl}
            view="sign_in"
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  email_input_placeholder: 'Your email address',
                  password_label: 'Password',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: "Already have an account? Sign in",
                  forgot_password_text: 'Forgot your password?',
                },
                sign_up: {
                  email_label: 'Email address',
                  email_input_placeholder: 'Your email address',
                  password_label: 'Password',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                },
              }
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}