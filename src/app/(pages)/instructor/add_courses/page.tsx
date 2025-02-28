"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { useRouter } from "next/navigation"
import type { z } from "zod"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { CourseSchema } from "@/zodScheams/addCourses"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the Add_coursesForm component to avoid SSR issues
const Add_coursesForm = dynamic(() => import("@/components/AddCourses/Add_coursesForm"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
})

type FormSchema = z.infer<typeof CourseSchema>

export default function AddCoursePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true) // Ensures we are in the browser
  }, [])

  const form = useForm<FormSchema>({
    resolver: zodResolver(CourseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      skillLevel: "",
      isFree: true,
      price: 0,
    },
  })

  const router = useRouter()
  const { toast } = useToast()

  const onSubmit = async (values: FormSchema) => {
    setIsSubmitting(true)

    // Prepare FormData for the API request
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (key === "courseThumbnail") {
        if (value && value.length > 0) {
          formData.append(key, value[0])
        }
      } else if (key !== "courseContent") {
        formData.append(key, value as string | Blob)
      }
    })

    try {
      // Send the form data to the backend API using axios
      const response = await axios.post("/api/instructor/add_courses", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true, // Ensures cookies are sent with the request
      })

      // Handle the response from the API
      if (response.status === 201) {
        toast({
          title: "Success",
          description: "Your course has been successfully created.",
          variant: "default",
        })
        router.push("/instructor/courses")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "There was an error creating your course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isClient) return null // Prevents rendering on the server

  return (
    <div className="container mx-auto p-6 dark:bg-gray-900 min-h-screen">
      <Card className="max-w-2xl mx-auto dark:bg-gray-800 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold dark:text-white">Add New Course</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Create an engaging new course for your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Add_coursesForm form={form} />
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            className="w-full dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white transition-colors duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Course...
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

