import React from 'react'
import { cn } from '@/lib/utils'

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function MobileContainer({
  children,
  className,
  padding = 'md',
  maxWidth = 'xl'
}: MobileContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4 py-2 sm:py-3',
    md: 'px-4 sm:px-6 py-4 sm:py-6',
    lg: 'px-4 sm:px-8 py-6 sm:py-8'
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      'w-full mx-auto',
      paddingClasses[padding],
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveGrid({
  children,
  className,
  cols = 1,
  gap = 'md'
}: ResponsiveGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  }

  return (
    <div className={cn(
      'grid',
      gridClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: 'vertical' | 'horizontal'
  spacing?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end'
}

export function ResponsiveStack({
  children,
  className,
  direction = 'vertical',
  spacing = 'md',
  align = 'start'
}: ResponsiveStackProps) {
  const stackClasses = {
    vertical: {
      start: 'flex flex-col items-start',
      center: 'flex flex-col items-center',
      end: 'flex flex-col items-end'
    },
    horizontal: {
      start: 'flex flex-row items-start sm:items-center',
      center: 'flex flex-row items-center',
      end: 'flex flex-row items-end'
    }
  }

  const spacingClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  }

  return (
    <div className={cn(
      stackClasses[direction][align],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  as?: React.ElementType
}

export function ResponsiveText({
  children,
  className,
  size = 'base',
  weight = 'normal',
  as: Component = 'p'
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
    '3xl': 'text-2xl sm:text-3xl'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  return (
    <Component className={cn(
      sizeClasses[size],
      weightClasses[weight],
      className
    )}>
      {children}
    </Component>
  )
}

interface ResponsiveIconProps {
  icon: React.ComponentType<{ className?: string }>
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveIcon({
  icon: Icon,
  className,
  size = 'md'
}: ResponsiveIconProps) {
  const sizeClasses = {
    xs: 'h-3 w-3 sm:h-4 sm:w-4',
    sm: 'h-4 w-4 sm:h-5 sm:w-5',
    md: 'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6',
    lg: 'h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7',
    xl: 'h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8'
  }

  return <Icon className={cn(sizeClasses[size], className)} />
}

interface MobileCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export function MobileCard({
  children,
  className,
  padding = 'md',
  interactive = false
}: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  return (
    <div className={cn(
      'bg-card border border-border/50 rounded-lg shadow-sm',
      paddingClasses[padding],
      interactive && 'hover:shadow-md transition-shadow cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function ResponsiveButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}: ResponsiveButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs sm:text-sm h-8 sm:h-9',
    md: 'px-4 py-2 text-sm sm:text-base h-9 sm:h-10',
    lg: 'px-6 py-3 text-base sm:text-lg h-10 sm:h-12'
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}