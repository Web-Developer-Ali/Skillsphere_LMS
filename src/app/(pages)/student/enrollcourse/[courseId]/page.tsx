"use client"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import Head from "next/head"
import type { Course } from "@/types/enrolleCourses"
import { CourseContent, CourseEnrollmentSidebar, CourseHeader, CourseStructuredData, CourseVideoPreview } from "@/components/students_components/enrollCourse/course-components"
import { Loader2 } from "lucide-react"


export default function CourseEnrollmentPage({ params }: { params: { courseId: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchCourse = useCallback(async () => {
    try {
      const response = await axios.get(`/api/student/getcourse_for_enrollement/${params.courseId}`)
      setCourse(response.data)
     if (response.data.chapterThumbnail) {
       const sasResponse = await axios.get("/api/generate-sas-token", {
         params: { blobName: response.data.chapterThumbnail},
       })
       setThumbnailUrl(sasResponse.data.sasURL)
     }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load course content",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [toast, params.courseId])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  const handleEnroll =() => {
    if (!course) return
    setEnrolling(true)
    router.replace(`/payment-gateway/${course.id}`)
    setEnrolling(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background dark:bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-gray-200 mb-4" />
      <p className="text-muted-foreground dark:text-gray-400">Loading your course...</p>
    </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Course not found</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{`${course.title} - Enroll Now`} | Your Platform Name</title>
        <meta
          name="description"
          content={`Enroll in ${course.title} taught by ${course.instructor}. ${course.description
            .replace(/<[^>]*>?/gm, "")
            .substring(0, 160)}...`}
        />
        <meta property="og:title" content={`${course.title} - Enroll Now`} />
        <meta
          property="og:description"
          content={`Learn ${course.title} from ${course.instructor}. ${course.description
            .replace(/<[^>]*>?/gm, "")
            .substring(0, 160)}...`}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://yourplatform.com/courses/${params.courseId}/enroll`}
        />
        {thumbnailUrl && <meta property="og:image" content={thumbnailUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${course.title} - Enroll Now`} />
        <meta
          name="twitter:description"
          content={`Learn ${course.title} from ${course.instructor}. ${course.description
            .replace(/<[^>]*>?/gm, "")
            .substring(0, 160)}...`}
        />
        {thumbnailUrl && <meta name="twitter:image" content={thumbnailUrl} />}
        <link
          rel="canonical"
          href={`https://yourplatform.com/courses/${params.courseId}/enroll`}
        />
      </Head>

      <CourseStructuredData course={course} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <article className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700/50 overflow-hidden">
            <div className="md:flex">
              {/* Course Content Section */}
              <div className="md:w-2/3 p-6 md:p-8">
                <CourseHeader course={course} />

                <CourseVideoPreview
                  videoUrl={course.videoUrl}
                  thumbnailUrl={thumbnailUrl}
                  title={course.title}
                  instructor={course.instructor}
                />

                <CourseContent course={course} />
              </div>

              {/* Enrollment Section */}
              <CourseEnrollmentSidebar 
                course={course} 
                enrolling={enrolling} 
                onEnroll={handleEnroll}
              />
            </div>
          </article>
        </div>
      </div>
    </>
  )
}