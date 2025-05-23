import { GraduationCap } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function Footer() {
  return (
    <footer className="border-t bg-background dark:bg-gray-900 dark:border-gray-800">
    <div className="min-w-full container flex flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:gap-12">
      <div className="flex flex-col gap-4 lg:w-1/3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary dark:text-blue-400" />
          <span className="text-xl font-bold">SkillSphere</span>
        </div>
        <p className="text-sm text-muted-foreground dark:text-gray-300">
          SkillSphere is the leading online learning platform for students and teachers worldwide. Our mission is to
          provide accessible, high-quality education for everyone.
        </p>
        <div className="flex gap-4">
          {["Twitter", "Facebook", "Instagram", "LinkedIn"].map((social) => (
            <Link
              key={social}
              href='#'
              className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
            >
              {social}
            </Link>
          ))}
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Platform</h3>
          <ul className="space-y-2 text-sm">
            {["Courses", "Pricing", "Teachers", "Students", "Resources"].map((item) => (
              <li key={item}>
                <Link
                  href='#'
                  className="text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Company</h3>
          <ul className="space-y-2 text-sm">
            {["About", "Careers", "Blog", "Press", "Partners"].map((item) => (
              <li key={item}>
                <Link
                  href='#'
                  className="text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Legal</h3>
          <ul className="space-y-2 text-sm">
            {["Terms", "Privacy", "Cookies", "Licenses", "Contact"].map((item) => (
              <li key={item}>
                <Link
                 href='#'
                  className="text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Support</h3>
          <ul className="space-y-2 text-sm">
            {["Help Center", "FAQs", "Community", "Contact Us", "Accessibility"].map((item) => (
              <li key={item}>
                <Link
                 href='#'
                  className="text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t py-6 dark:border-gray-800">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 sm:px-6 lg:flex-row">
        <p className="text-center text-sm text-muted-foreground lg:text-left dark:text-gray-300">
          &copy; {new Date().getFullYear()} SkillSphere. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link
            href='#'
            className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
          >
            Terms of Service
          </Link>
          <Link
            href='#'
            className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
          >
            Privacy Policy
          </Link>
          <Link
            href='#'
            className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
          >
            Cookie Settings
          </Link>
        </div>
      </div>
    </div>
  </footer>
  )
}

export default Footer