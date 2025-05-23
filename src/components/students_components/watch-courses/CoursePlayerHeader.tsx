"use client"

import { ChevronLeft, List, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CoursePlayerHeaderProps } from "@/types/watch-courses-api"


export function CoursePlayerHeader({
  title,
  instructorName,
  progressPercentage,
  onToggleSidebar,
  sidebarOpen
}: CoursePlayerHeaderProps) {
  const router = useRouter()

  return (
    <header className="border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-background dark:bg-gray-900 z-10 shadow-sm dark:shadow-gray-800">
      <div className="flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/student/dashboard")}
                className="mr-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5 dark:text-gray-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="dark:bg-gray-800 dark:text-white">
              Back to Dashboard
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold truncate max-w-[300px] lg:max-w-[500px] dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Instructor: {instructorName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center mr-4">
          <Progress
            value={progressPercentage}
            className="w-40 h-2 mr-2 bg-gray-200 dark:bg-gray-700 [&>div]:bg-blue-600 dark:[&>div]:bg-blue-400"
          />
          <span className="text-sm text-muted-foreground dark:text-gray-300">
            {progressPercentage}% complete
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <List className="h-4 w-4 dark:text-white" />}
        </Button>
      </div>
    </header>
  )
}