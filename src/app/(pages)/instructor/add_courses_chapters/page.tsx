"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios" 
import { Form } from "@/components/ui/form"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ChapterHeader } from "@/components/Courses_Chapter/ChapterHeader"
import { ChapterBasicInfo } from "@/components/Courses_Chapter/ChapterBasicInfo"
import { ChapterVideoUpload } from "@/components/Courses_Chapter/ChapterVideoUpload"
import { ChapterAccessSettings } from "@/components/Courses_Chapter/ChapterAccessSettings"
import { ProcessingOverlay } from "@/components/Courses_Chapter/ProcessingOverlay"

// Define schema using Zod
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  video: z.instanceof(File).refine((file) => file.size <= 100 * 1024 * 1024, "File size should be less than 100MB"),
  isFreePreview: z.boolean(),
})

// Component that uses useSearchParams (wrapped in Suspense)
function CourseChapterForm() {
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const [isPolling, setIsPolling] = useState(false)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [statusMessages, setStatusMessages] = useState<string[]>([])
  const router = useRouter() 

  const searchParams = useSearchParams() 
  const courseId = searchParams.get("id")

  // React Hook Form configuration
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      isFreePreview: false,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!courseId) {
      toast({
        title: "Error",
        description: "Course ID is missing. Please ensure you're on the correct page.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)
      setStatusMessages(["Starting chapter creation..."])

      const plainDescription = values.description.replace(/<[^>]*>/g, "")
      const formData = new FormData()
      formData.append("title", values.title)
      formData.append("description", plainDescription)
      formData.append("courseId", courseId)
      formData.append("isFreePreview", values.isFreePreview.toString())
      formData.append("video", values.video)

      setStatusMessages((prev) => [...prev, "Uploading chapter data..."])

  
      const { data } = await axios.put("/api/instructor/add_courses_chapters", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const chapterId = data.chapterId
      setStatusMessages((prev) => [...prev, "Chapter created successfully. Starting video processing..."])

      if (chapterId) {
        setIsPolling(true)
        pollingIntervalRef.current = setInterval(() => {
          checkTranscodingStatus(courseId, chapterId)
        }, 10000)
      }

      form.reset()
      setVideoPreview(null)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "There was an error creating your chapter."
        setStatusMessages((prev) => [...prev, `Error: ${errorMessage}`])
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        console.error("Unexpected error:", error)
      }
    }
    
  }

  const checkTranscodingStatus = useCallback(
    async (courseId: string, chapterId: string) => {
      try {
        setStatusMessages(["Checking video processing status..."])

        const { data } = await axios.get(`/api/instructor/add_courses_chapters`, {
          params: { courseId, chapterId },
        })

        setStatusMessages([`Video processing status: ${data.TranscodingStatus}`])

        if (data.TranscodingStatus === "Completed" && data.TranscodingError === null) {
          setIsPolling(false)
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
          setStatusMessages(["Video processing completed successfully!"])

          toast({
            title: "Video processing completed",
            description: "Your video has been successfully processed and is now ready for viewing.",
          })

          setTimeout(() => {
            router.push(`/instructor/courses_details_page?id=${courseId}`)
          }, 3000)
        } else if (data.TranscodingStatus === "Failed" && data.TranscodingError) {
          setIsPolling(false)
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
          setStatusMessages(["Error: Video processing failed. Please try again later."])
          toast({
            title: "Error",
            description: "Video processing failed. Please try again later.",
            variant: "destructive",
          })
          setTimeout(() => setIsProcessing(false), 3000)
        }
      } catch (error: unknown) {
        console.error("Error checking transcoding status:", error)
        setIsPolling(false)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
        setStatusMessages(["Error: Failed to check video processing status. Please try again later."])
        toast({
          title: "Error",
          description: "Failed to check video process video. Please try again later.",
          variant: "destructive",
        })
        setTimeout(() => setIsProcessing(false), 3000)
      }
    },
    [toast, router],
  )

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview)
      }
    }
  }, [videoPreview])

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="flex-1 relative dark:bg-gray-900">
      <ChapterHeader isProcessing={isProcessing} onSubmit={form.handleSubmit(onSubmit)} id={courseId} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 max-w-5xl mx-auto space-y-8">
          <ChapterBasicInfo form={form} />
          <ChapterVideoUpload form={form} videoPreview={videoPreview} onVideoChange={(file) => setVideoPreview(file ? URL.createObjectURL(file) : null)} />
          <ChapterAccessSettings form={form} />
        </form>
      </Form>

      <ProcessingOverlay
        isProcessing={isProcessing}
        isPolling={isPolling}
        statusMessages={statusMessages}
      />
    </div>
  )
}

// Wrap the form component inside Suspense
export default function CreateChapterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourseChapterForm />
    </Suspense>
  )
}
