"use client"

import { X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ChapterItem from "@/components/students_components/watch-courses/chapter-item"
import { CoursePlayerSidebarProps } from "@/types/watch-courses-api"


export function CoursePlayerSidebar({
  title,
  chapters,
  currentVideoId,
  progressPercentage,
  totalVideos,
  completedVideos,
  isMobile,
  sidebarOpen,
  onToggleSidebar,
  onSelectVideo
}: CoursePlayerSidebarProps) {
  return (
    <aside
      className={cn(
        "w-full md:w-80 lg:w-96 border-l dark:border-gray-700 bg-background dark:bg-gray-900 flex-shrink-0 overflow-y-auto flex-col",
        isMobile ? "fixed inset-0 z-50 transition-transform duration-300 ease-in-out" : "relative",
        sidebarOpen ? "flex" : isMobile ? "translate-x-[100%]" : "hidden md:flex",
      )}
    >
      {isMobile && (
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-background dark:bg-gray-900 sticky top-0 z-10">
          <h2 className="font-semibold dark:text-white">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label="Close sidebar"
            className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="p-4 border-b dark:border-gray-700 bg-background dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium dark:text-white">Up Next</h3>
          <span className="text-sm font-medium dark:text-gray-300">
            {completedVideos}/{totalVideos} videos
          </span>
        </div>
        <Progress
          value={progressPercentage}
          className={cn(
            "h-1 bg-gray-200 dark:bg-gray-700",
            progressPercentage === 100 
              ? "[&>div]:bg-green-500 dark:[&>div]:bg-green-400" 
              : "[&>div]:bg-blue-600 dark:[&>div]:bg-blue-400"
          )}
        />
        {progressPercentage === 100 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 text-center font-medium">
            Course completed! 🎉
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-2">
          {chapters.map((chapter, index) => (
            <ChapterItem
              key={chapter.chapterId}
              chapter={chapter}
              index={index}
              isActive={currentVideoId === chapter.chapterId}
              onSelect={() => onSelectVideo(chapter)}
            />
          ))}
        </ul>
      </div>
    </aside>
  )
}