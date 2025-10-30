import { MotionWrapper } from '@/components/motion/MotionWrapper'
import Image from 'next/image'
import Link from 'next/link'

export default function Loading() {
  return (
    <MotionWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          {/* Logo */}
          <Link href="/assessments" className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="h-16 w-16 flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Oris"
                width={64}
                height={64}
                className="object-contain animate-pulse"
                priority
              />
            </div>
            <span className="text-3xl font-bold text-foreground">Oris</span>
          </Link>

          {/* Loading Spinner */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">Loading your experience</p>
              <p className="text-sm text-muted-foreground animate-pulse">
                Preparing your personalized dashboard...
              </p>
            </div>
          </div>

          {/* Loading Progress Indicators */}
          <div className="space-y-3 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Authentication</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loading data</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-1/2 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Finalizing</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-0 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionWrapper>
  )
}