"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, Bell, GraduationCap } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Blank_profile_image from "../../public/Blank_profile_image.webp";

type NavItem = {
  title: string;
  href: string;
  role: "all" | "Student" | "Instructor";
};

export function Navbar() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // Loading state
  if (status === "loading") {
    return (
      <nav className="border-b bg-background dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
              <Skeleton className="h-6 w-24 dark:bg-gray-700" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // User data
  const userRole =
    (session?.user?.role as "Student" | "Instructor" | undefined) || "Student";
  const userName = session?.user?.name || "Guest";
  const userAvatar = session?.user?.image || session?.user?.avatar || null;

  const navItems: NavItem[] =
    userRole === "Student"
      ? [
          { title: "Dashboard", href: "/student/dashboard", role: "Student" },
          {
            title: "Courses",
            href: "/student/browse-courses",
            role: "Student",
          },
          { title: "About Us", href: "/about-us", role: "all" },
        ]
      : [
          {
            title: "Dashboard",
            href: "/instructor/dashboard",
            role: "Instructor",
          },
          { title: "Courses", href: "/instructor/courses", role: "Instructor" },
          { title: "About Us", href: "/about-us", role: "all" },
        ];

  const mainNavItems = navItems
    .filter((item) => item.role === "all" || item.role === userRole)
    .slice(0, 3);

  const dropdownNavItems = navItems.filter(
    (item) =>
      (item.role === "all" || item.role === userRole) &&
      !mainNavItems.includes(item)
  );

  return (
    <nav className="border-b bg-background dark:bg-gray-900 dark:border-gray-800">
      <div className="min-w-full container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="mr-2 px-0 text-base hover:bg-transparent focus:ring-0 md:hidden dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] sm:w-[400px] bg-background dark:bg-gray-900 dark:border-gray-800"
              >
                <nav className="flex flex-col gap-4">
                  {navItems.map(
                    (item, index) =>
                      (item.role === "all" || item.role === userRole) && (
                        <Link
                          key={index}
                          href={item.href}
                          className={cn(
                            "block px-2 py-1 text-lg",
                            pathname === item.href
                              ? "font-medium text-primary dark:text-blue-400"
                              : "text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-blue-400"
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
              <GraduationCap className="h-6 w-6 text-primary dark:text-blue-400" />
              <span className="text-xl font-bold dark:text-white">
                SkillSphere
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1 gap-2">
            {mainNavItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-primary dark:text-blue-400"
                    : "text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-blue-400"
                )}
              >
                {item.title}
              </Link>
            ))}
            {dropdownNavItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-blue-400"
                  >
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background dark:bg-gray-900 border dark:border-gray-700 shadow-lg dark:shadow-gray-900/50">
                  {dropdownNavItems.map((item, index) => (
                    <DropdownMenuItem
                      key={index}
                      asChild
                      className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 cursor-pointer"
                    >
                      <Link
                        href={item.href}
                        className="w-full dark:text-gray-300"
                      >
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-blue-400"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary dark:bg-blue-400"></span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0 overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {userAvatar ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={userAvatar}
                        alt="User avatar"
                        fill
                        sizes="32px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = Blank_profile_image.src;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <User className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                    </div>
                  )}
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-background dark:bg-gray-900 border dark:border-gray-700 shadow-lg dark:shadow-gray-900/50"
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  {userAvatar ? (
                    <div className="relative h-10 w-10">
                      <Image
                        src={userAvatar}
                        alt="User avatar"
                        fill
                        sizes="40px"
                        className="rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground dark:text-gray-300" />
                    </div>
                  )}
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium dark:text-white">{userName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground dark:text-gray-400">
                      {userRole}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                {session ? (
                  <>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    <DropdownMenuItem
                      className="hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 cursor-pointer dark:text-gray-300"
                      onClick={() => signOut({ callbackUrl: "/sign-in" })}
                    >
                      Log out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    asChild
                    className="hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <Link href="/sign-in" className="w-full dark:text-gray-300">
                      Sign in
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
