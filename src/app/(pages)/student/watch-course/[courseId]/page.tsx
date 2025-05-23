"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useParams  } from "next/navigation"
import axios from "axios"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/course-player"
import { X } from "lucide-react"
import { Course, Video } from "@/types/watch-courses-api"
import { CoursePlayerHeader } from "@/components/students_components/watch-courses/CoursePlayerHeader"
import { CoursePlayerContent } from "@/components/students_components/watch-courses/CoursePlayerContent"
import { CoursePlayerSidebar } from "@/components/students_components/watch-courses/CoursePlayerSidebar"

function LoadingState() {
  return (
    <div className="flex flex-col h-screen bg-background dark:bg-gray-900">
      <header className="border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-background dark:bg-gray-900">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 rounded-full dark:bg-gray-700" />
          <div className="ml-4">
            <Skeleton className="h-4 w-[250px] dark:bg-gray-700" />
            <Skeleton className="h-3 w-[180px] mt-2 dark:bg-gray-700" />
          </div>
        </div>
      </header>
      <div className="flex flex-1 p-4 gap-4">
        <div className="w-1/4 hidden md:block">
          <Skeleton className="h-[calc(100vh-120px)] w-full rounded-md dark:bg-gray-800" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton className="h-[50vh] w-full rounded-md dark:bg-gray-800" />
          <Skeleton className="h-6 w-3/4 dark:bg-gray-800" />
          <Skeleton className="h-4 w-full dark:bg-gray-800" />
          <Skeleton className="h-4 w-full dark:bg-gray-800" />
          <Skeleton className="h-4 w-2/3 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  const router = useRouter()
  return (
    <div className="flex items-center justify-center h-screen bg-background dark:bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-flex items-center justify-center mb-6">
          <X className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Error Loading Course</h2>
        <p className="text-muted-foreground dark:text-gray-400 mb-6">{error}</p>
        <Button onClick={() => router.push("/student/dashboard")}>Return to Dashboard</Button>
      </div>
    </div>
  )
}

function NotFoundState() {
  const router = useRouter()
  return (
    <div className="flex items-center justify-center h-screen bg-background dark:bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full inline-flex items-center justify-center mb-6">
          <X className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Course Not Found</h2>
        <p className="text-muted-foreground dark:text-gray-400 mb-6">
          The course you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/student/dashboard")}>Return to Dashboard</Button>
      </div>
    </div>
  )
}

function EnrollmentRequiredState({ courseId }: { courseId: string | null }) {
  const router = useRouter()
  return (
    <div className="flex items-center justify-center h-screen bg-background dark:bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full inline-flex items-center justify-center mb-6">
          <X className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Enrollment Required</h2>
        <p className="text-muted-foreground dark:text-gray-400 mb-6">
          You need to enroll in this course to access its content.
        </p>
        <Button onClick={() => router.push(`/courses/${courseId}`)}>View Course Details</Button>
      </div>
    </div>
  )
}

export default function CoursePlayer() {
    const isMobile = useMobile()
  const params = useParams()
  const courseID = params.courseId as string 

  const [course, setCourse] = useState<Course | null>(null)
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourseData = useCallback(async () => {
    if (!courseID) {
      setError("No course ID provided")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`/api/student/watch-courses?courseId=${courseID}`)
      const courseData = response.data

      if (!courseData.chapters || !Array.isArray(courseData.chapters)) {
        courseData.chapters = []
      }

      try {
        const completionResponse = await axios.get(`/api/student/get-chapter-completionStatus?courseId=${courseID}`)
        const completedChapters = completionResponse.data.completedChapterIds
        
        if (completedChapters?.length > 0) {
          courseData.chapters = courseData.chapters.map((chapter: any) => ({
            ...chapter,
            isCompleted: completedChapters.includes(chapter.chapterId),
          }))
          courseData.completedVideos = courseData.chapters.filter((ch: any) => ch.isCompleted).length || 0
        }
      } catch (err) {
        console.error("Failed to fetch completion data:", err)
      }

      const totalVideos = courseData.chapters.length || 0
      const completedVideos = courseData.chapters.filter((ch: any) => ch.isCompleted).length || 0

      setCourse({
        ...courseData,
        totalVideos,
        completedVideos,
      })

      if (courseData.isEnrolled && courseData.chapters.length) {
        setCurrentVideo(courseData.chapters[0])
      }
    } catch (err) {
      setError("Failed to load course data")
    } finally {
      setLoading(false)
    }
  }, [courseID])

  useEffect(() => {
    fetchCourseData()
  }, [fetchCourseData])

  const handleVideoSelect = useCallback((video: Video) => {
    setCurrentVideo(video)
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const markVideoAsCompleted = useCallback(async (chapterId: number) => {
    if (!course) return

    try {
      setCourse(prev => {
        if (!prev) return null
        const updatedChapters = prev.chapters.map(ch => 
          ch.chapterId === chapterId ? { ...ch, isCompleted: true } : ch
        )
        return {
          ...prev,
          chapters: updatedChapters,
          completedVideos: updatedChapters.filter(ch => ch.isCompleted).length
        }
      })

      await axios.post("/api/student/track-course-progress", {
        chapterId,
        courseId: Number(courseID || "0"),
      })
    } catch (err) {
      console.error("Failed to mark video as completed:", err)
    }
  }, [course, courseID])

  const progressPercentage = course?.totalVideos && course.completedVideos 
    ? Math.round((course.completedVideos / course.totalVideos) * 100) 
    : 0

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!course) return <NotFoundState />
  if (!course.isEnrolled) return <EnrollmentRequiredState courseId={courseID} />

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-gray-900">
      <CoursePlayerHeader
        title={course.title}
        instructorName={course.instructorName}
        progressPercentage={progressPercentage}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
      />

      <div className="flex flex-1 overflow-hidden">
        <CoursePlayerContent
          courseId={course.courseId}
          currentVideo={currentVideo}
          instructorName={course.instructorName}
          chapters={course.chapters}
          onMarkComplete={markVideoAsCompleted}
        />
        <CoursePlayerSidebar
          title={course.title}
          chapters={course.chapters}
          currentVideoId={currentVideo?.chapterId || null}
          progressPercentage={progressPercentage}
          totalVideos={course.totalVideos}
          completedVideos={course.completedVideos}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSelectVideo={handleVideoSelect}
        />
      </div>
    </div>
  )
}