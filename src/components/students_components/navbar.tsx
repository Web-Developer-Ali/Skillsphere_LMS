"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { GraduationCap, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border">
      <div className="container flex h-16 items-center">
        {/* Left - Brand */}
        <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary dark:text-blue-400" />
        <span className="text-lg font-bold sm:text-xl">SkillSphere</span>
      </div>

        {/* Center - Navigation (Desktop) */}
        <nav className="hidden w-1/3 md:flex justify-center">
          <ul className="flex space-x-8">
            <li>
              <Link href="/" className="text-sm font-medium transition-colors hover:text-primary dark:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/courses" className="text-sm font-medium transition-colors hover:text-primary dark:text-white">
                Courses
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary dark:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm font-medium transition-colors hover:text-primary dark:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right - User Profile */}
        <div className="flex w-1/3 items-center justify-end">
          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* User Profile */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                    <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{session.user?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout">Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/api/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background pt-16 md:hidden">
          <div className="container flex justify-end p-4">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="container flex-1 overflow-auto p-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <Link
                  href="/"
                  className="block text-lg font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="block text-lg font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="block text-lg font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="block text-lg font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}
