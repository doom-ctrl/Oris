"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
}

export function MotionWrapper({ children, className, ...props }: MotionWrapperProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}