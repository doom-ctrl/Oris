"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm border-border/40">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Page not found</CardTitle>
            <CardDescription>
              Sorry, we couldn't find the page you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <Link href="/assessments" className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="h-10 w-10 flex-shrink-0">
                  <Image
                    src="/logo.svg"
                    alt="Oris"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="font-semibold text-lg">Oris</span>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/assessments">
                  <Home className="mr-2 h-4 w-4" />
                  Go home
                </Link>
              </Button>

              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go back
              </Button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                You might be interested in:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/assessments" className="text-sm text-primary hover:underline">
                  Assessments
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link href="/planner" className="text-sm text-primary hover:underline">
                  Planner
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link href="/progress" className="text-sm text-primary hover:underline">
                  Progress
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}