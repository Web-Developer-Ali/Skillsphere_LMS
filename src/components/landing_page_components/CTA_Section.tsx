import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

function CTA_Section() {
  return (
    <section className="py-8 sm:py-12 md:py-24 lg:py-32 bg-background dark:bg-gray-900">
          <div className="min-w-full container px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl dark:text-gray-100">
                  Ready to start your learning journey?
                </h2>
                <p className="max-w-[600px] text-sm text-muted-foreground sm:text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
                  Join thousands of students and teachers on SkillSphere today and take the first step towards mastering
                  new skills.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-1 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
                  asChild
                >
                  <Link href="/sign-up">
                    Sign Up Now <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-1 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400 dark:hover:text-white"
                  asChild
                >
                  <Link href="/about-us">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
  )
}

export default CTA_Section