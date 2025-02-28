"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, Bell } from 'lucide-react'

type NavItem = {
  title: string
  href: string
  role: "all" | "student" | "instructor" | "admin"
}

const navItems: NavItem[] = [
  { title: "Home", href: "/", role: "all" },
  { title: "Courses", href: "/courses", role: "all" },
  { title: "My Learning", href: "/my-learning", role: "student" },
  { title: "Teach", href: "/teach", role: "instructor" },
  { title: "Dashboard", href: "/dashboard", role: "instructor" },
  { title: "Admin Panel", href: "/admin", role: "admin" },
]

type User = {
  name: string
  role: "student" | "instructor" | "admin"
}

export function Navbar({ user }: { user: User }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()

  const mainNavItems = navItems.filter(item => 
    item.role === "all" || item.role === user.role
  ).slice(0, 3) // Limit to first 3 items for main nav

  const dropdownNavItems = navItems.filter(item => 
    (item.role === "all" || item.role === user.role) && 
    !mainNavItems.includes(item)
  )

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus:ring-0 md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4">
                  {navItems.map((item, index) =>
                    (item.role === "all" || item.role === user.role) && (
                      <Link
                        key={index}
                        href={item.href}
                        className={cn(
                          "block px-2 py-1 text-lg",
                          pathname === item.href ? "font-medium text-primary" : "text-muted-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.title}
                      </Link>
                    )
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center space-x-2">
              <span className="h-8 w-8 rounded-full bg-primary" />
              <span className="text-xl font-bold">SkillSphere</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1">
            {mainNavItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "px-5 py-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.title}
              </Link>
            ))}
            {dropdownNavItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-5 py-2 text-sm font-medium">
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {dropdownNavItems.map((item, index) => (
                    <DropdownMenuItem key={index} asChild>
                      <Link href={item.href}>{item.title}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}