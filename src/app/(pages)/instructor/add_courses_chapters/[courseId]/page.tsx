"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { Form } from "@/components/ui/form"
import { useParams, useRouter } from "next/navigation"
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
  video: z.instanceof(File).refine((file) => file.size <= 150 * 1024 * 1024, "File size should be less than 150MB"),
  isFreePreview: z.boolean(),
  duration: z.number().optional(),
  thumbnail: z.instanceof(Blob).optional(),
})

function CourseChapterForm() {
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast()
  const [isPolling, setIsPolling] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [statusMessages, setStatusMessages] = useState<string[]>([])
  const router = useRouter()

  const params = useParams()
  const courseId = params.courseId as string

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
        description: "Course ID is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessages(["Starting chapter creation..."]);

      const fileName = `${courseId}_${Date.now()}_${values.video.name}`;
      const { data: sasData } = await axios.get("/api/generate-sas-token", {
        params: { blobName: fileName, type: "video" },
      });

      const sasUrl = sasData.sasURL;
      const contentType = sasData.contentType;
      const arrayBuffer = await values.video.arrayBuffer();
      const videoBuffer = Buffer.from(arrayBuffer);

      await axios.put(sasUrl, videoBuffer, {
        headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": contentType },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        },
      });

      setStatusMessages((prev) => [...prev, "Video uploaded successfully. Creating chapter..."]);

      const plainDescription = values.description.replace(/<[^>]*>/g, "");
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", plainDescription);
      formData.append("courseId", courseId);
      formData.append("isFreePreview", values.isFreePreview.toString());
      formData.append("videoUrl", sasUrl.split("?")[0]);

      if (values.duration !== undefined) formData.append("duration", values.duration.toString());
      if (values.thumbnail) formData.append("thumbnail", values.thumbnail, "thumbnail.jpg");

      const { data } = await axios.put("/api/instructor/add_courses_chapters", formData);
      const chapterId = data.chapterId;

      await axios.put(sasUrl, null, {
        headers: {
          "x-ms-meta-chapterId": chapterId.toString(),
          "x-ms-meta-isFreePreview": values.isFreePreview.toString(),
        },
        params: { comp: "metadata" },
      });

      setStatusMessages((prev) => [...prev, "Chapter created. Waiting for video processing..."]);

      if (chapterId) {
        setIsPolling(true);
        pollingIntervalRef.current = setInterval(() => {
          checkTranscodingStatus(courseId, chapterId);
        }, 10000);
      }

      form.reset();
      setVideoPreview(null);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Upload failed",
        description: "Something went wrong during the upload.",
        variant: "destructive",
      });
    }
  };

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
            router.push(`/instructor/courses_details_page/${courseId}`)
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

  const handleVideoChange = (file: File | null) => {
    if (!file) {
      setVideoPreview(null)
      form.setValue("video", null as unknown as File)
      form.setValue("duration", undefined)
      form.setValue("thumbnail", undefined)
      return
    }

    const videoUrl = URL.createObjectURL(file)
    const video = document.createElement("video")

    video.preload = "metadata"
    video.src = videoUrl

    video.onloadedmetadata = () => {
      const width = video.videoWidth
      const height = video.videoHeight
      const duration = Math.round(video.duration)

      if (width < 1920 || height < 1080) {
        toast({
          title: "Video resolution too low",
          description: "Minimum resolution required is 1920x1080 (1080p).",
          variant: "destructive",
        })
        URL.revokeObjectURL(videoUrl)
        setVideoPreview(null)
        form.setValue("video", null as unknown as File)
        form.setValue("duration", undefined)
        form.setValue("thumbnail", undefined)
      } else {
        // Store duration
        form.setValue("duration", duration)

        // Generate thumbnail
        generateThumbnail(video)
          .then((thumbnail) => {
            form.setValue("thumbnail", thumbnail)
            setVideoPreview(videoUrl)
            form.setValue("video", file)
          })
          .catch((error) => {
            console.error("Error generating thumbnail:", error)
            toast({
              title: "Thumbnail generation failed",
              description: "Could not generate thumbnail, but you can still upload the video.",
              variant: "default",
            })
            setVideoPreview(videoUrl)
            form.setValue("video", file)
          })
      }
    }

    video.onerror = () => {
      toast({
        title: "Invalid video file",
        description: "Could not read video metadata. Please try another file.",
        variant: "destructive",
      })
      URL.revokeObjectURL(videoUrl)
      setVideoPreview(null)
      form.setValue("video", null as unknown as File)
      form.setValue("duration", undefined)
      form.setValue("thumbnail", undefined)
    }
  }

  const generateThumbnail = (video: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Seek to 25% of the video duration for the thumbnail
        video.currentTime = video.duration * 0.25

        video.onseeked = () => {
          try {
            // Create a canvas element
            const canvas = document.createElement("canvas")
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw the current video frame to the canvas
            const ctx = canvas.getContext("2d")
            if (!ctx) {
              reject(new Error("Could not get canvas context"))
              return
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Convert canvas to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error("Failed to create thumbnail blob"))
                }
              },
              "image/jpeg",
              0.7,
            ) // JPEG format with 70% quality
          } catch (error) {
            reject(error)
          }
        }

        video.onerror = () => {
          reject(new Error("Error seeking video"))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  return (
    <div className="flex-1 relative dark:bg-gray-900">
      <ChapterHeader isProcessing={isProcessing} onSubmit={form.handleSubmit(onSubmit)} id={courseId} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 max-w-5xl mx-auto space-y-8">
          <ChapterBasicInfo form={form} />
          <ChapterVideoUpload
            form={form}
            videoPreview={videoPreview}
            onVideoChange={(file: File | undefined) => handleVideoChange(file || null)}
          />
          <ChapterAccessSettings form={form} />
        </form>
      </Form>

      <ProcessingOverlay uploadProgress={uploadProgress} isProcessing={isProcessing} isPolling={isPolling} statusMessages={statusMessages} />
    </div>
  )
}

export default function CreateChapterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourseChapterForm />
    </Suspense>
  )
}
