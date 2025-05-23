import { CheckCircle, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Badge } from '../ui/badge'

function Here_Section() {
  return (
    <section className="py-8 sm:py-12 md:py-24 lg:py-32 xl:py-48 bg-background dark:bg-gray-900">
    <div className="container px-4 md:px-6 min-w-full">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-2">
            <Badge className="inline-flex" variant="secondary">
              Launch your learning journey today
            </Badge>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl/none">
              Unlock Your Potential with <span className="text-primary dark:text-blue-400">SkillSphere</span>
            </h1>
            <p className="max-w-[600px] text-sm text-muted-foreground sm:text-base md:text-xl dark:text-gray-300">
              The ultimate learning platform where teachers share knowledge and students master new skills.
              Discover courses that transform your career and life.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button
              size="lg"
              className="w-full min-[400px]:w-auto gap-1 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
              asChild
            >
              <Link href="/sign-up">
                Get Started <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full min-[400px]:w-auto gap-1 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400 dark:hover:text-white"
              asChild
            >
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="inline-block h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-background bg-muted overflow-hidden dark:border-gray-800"
                >
                  <Image
                    src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? "women" : "men"}/${i + 10}.jpg`}
                    alt={`User ${i}`}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-muted-foreground dark:text-gray-300">
              Join <span className="font-medium text-foreground dark:text-gray-100">10,000+</span> learners
              worldwide
            </div>
          </div>
        </div>
        <div className="mx-auto flex items-center justify-center w-full max-w-[90%] sm:max-w-[500px] lg:max-w-none">
          <div className="relative w-full aspect-[4/3] rounded-lg border bg-background p-2 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              alt="SkillSphere Platform Preview"
              fill
              className="rounded-md object-cover"
            />
            <div className="absolute -bottom-4 right-0 sm:-right-4 rounded-lg border bg-background p-2 sm:p-4 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary dark:bg-blue-600 p-1.5">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
                <div className="text-xs sm:text-sm font-medium">500+ Courses Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  )
}

export default Here_Section