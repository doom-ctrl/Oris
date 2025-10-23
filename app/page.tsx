"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, Calendar, TrendingUp, BookOpen, Target, Shield, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionWrapper } from "@/components/motion/MotionWrapper"
import { useAuth } from "@/contexts/SupabaseAuthContext"

const features = [
  {
    icon: BookOpen,
    title: "Assessment Management",
    description: "Organize and track all your academic assessments in one place with intuitive categorization and progress monitoring."
  },
  {
    icon: Target,
    title: "Task Breakdown",
    description: "Break down complex assessments into manageable tasks with completion tracking and progress visualization."
  },
  {
    icon: Calendar,
    title: "Smart Planning",
    description: "Plan your study schedule with intelligent deadline tracking and priority-based task management."
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description: "Visualize your academic progress with comprehensive analytics and achievement tracking."
  }
]

const setupSteps = [
  {
    icon: Database,
    title: "Set up Supabase",
    description: "Create a Supabase project and run the provided SQL schema to set up your database."
  },
  {
    icon: Shield,
    title: "Configure Authentication",
    description: "Set up Supabase authentication and configure your environment variables for secure access."
  },
  {
    icon: CheckCircle,
    title: "Start Organizing",
    description: "Sign in and start adding your assessments and tasks to take control of your academic journey."
  }
]

export default function Home() {
  const { user } = useAuth()
  return (
    <MotionWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                  Assessment Manager
                  <span className="block text-2xl lg:text-3xl font-normal text-muted-foreground mt-4">
                    Academic Excellence Through Organized Learning
                  </span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
              >
                Transform your academic journey with a powerful assessment management system.
                Track deadlines, break down complex tasks, and achieve your educational goals
                with confidence and clarity.
              </motion.p>

              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="gap-2 text-base px-8 py-3">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="text-base px-8 py-3">
                    Learn More
                  </Button>
                </motion.div>
              )}

              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <Link href="/assessments">
                    <Button size="lg" className="gap-2 text-base px-8 py-3">
                      Go to Assessments
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/planner">
                    <Button variant="outline" size="lg" className="text-base px-8 py-3">
                      View Planner
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Everything You Need for Academic Success
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive platform provides all the tools you need to manage your assessments
                and achieve your educational goals effectively.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-lg border-border/50">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Developer Setup Section */}
        {!user && (
          <section className="py-20 lg:py-32 bg-muted/30">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Developer Setup Guide
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get your Assessment Manager running in minutes with these simple steps.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {setupSteps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center mt-12"
              >
                <Card className="max-w-2xl mx-auto border-border/50">
                  <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="text-left">
                    <p className="text-sm text-muted-foreground mb-4">
                      Copy the example file and add your keys:
                    </p>
                    <code className="block bg-muted p-4 rounded-md text-sm">
                      cp .env.local.example .env.local
                    </code>
                    <p className="text-sm text-muted-foreground mt-4">
                      Then add your Supabase credentials to <code>.env.local</code>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {!user && (
          <section className="py-20 lg:py-32">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto text-center"
              >
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Ready to Transform Your Academic Journey?
                </h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Join thousands of students who have already improved their academic performance
                  through better organization and task management.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Secure authentication</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Private data storage</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Always in control</span>
                  </div>
                </div>

                <Link href="/auth/sign-up">
                  <Button size="lg" className="gap-2 text-base px-8 py-3">
                    Get Started Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>
        )}
      </div>
    </MotionWrapper>
  )
}