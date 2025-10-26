"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  ClipboardList,
  Calendar,
  TrendingUp,
  LogIn,
  LogOut,
  UserRound,
  Settings
} from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  {
    name: "Assessments",
    href: "/assessments",
    icon: ClipboardList,
    public: false
  },
  {
    name: "Planner",
    href: "/planner",
    icon: Calendar,
    public: false
  },
  {
    name: "Progress",
    href: "/progress",
    icon: TrendingUp,
    public: false
  },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, signOut, profile } = useAuth()

  const filteredNavigation = navigation.filter(item =>
    item.public || user
  )

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/assessments" className="flex items-center space-x-2">
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

            <div className="hidden md:flex items-center space-x-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle - Always visible */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {user.email}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={user.email} />
                        <AvatarFallback>
                          {profile?.first_name && profile?.last_name
                            ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
                            : profile?.first_name
                            ? profile.first_name[0].toUpperCase()
                            : user.email?.charAt(0)?.toUpperCase() || 'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.first_name && profile?.last_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : profile?.first_name
                            ? profile.first_name
                            : user.email
                          }
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/sign-in" className="flex items-center space-x-1">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/sign-up" className="flex items-center space-x-1">
                    <UserRound className="h-4 w-4" />
                    <span className="hidden sm:inline">Get Started</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}