"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface CourseCardProps {
  course: {
    CourseID: number
    Title: string
    Description: string
    Category: string
    DifficultyLevel: string
    Status: string
    Fees: number
    Rating: number
    ThumbnailPublicID: string | null
  }
  variant?: "default" | "compact"
}

const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>?/gm, "") // Remove all HTML tags
}

export default function CourseCard({ course, variant = "default" }: CourseCardProps) {
  const [sasURL, setSasURL] = useState<string | null>(null)
  const router = useRouter()
  const isCompact = variant === "compact"

  useEffect(() => {
    if (course.ThumbnailPublicID) {
      fetch(`/api/generate-sas-token?blobName=${course.ThumbnailPublicID}`)
        .then((response) => response.json())
        .then((data) => setSasURL(data.sasURL))
        .catch((error) => {
          console.error("Error fetching SAS URL:", error)
          setSasURL(null)
        })
    }
  }, [course.ThumbnailPublicID])

  const handleAddContent = () => {
    router.push(`/instructor/courses_details_page/${course.CourseID}`)
  }

  // Strip HTML tags from the description
  const plainTextDescription = stripHtmlTags(course.Description)

  return (
    <Card className={`overflow-hidden dark:bg-gray-800 ${isCompact ? "flex" : "flex flex-col"}`}>
      <div className={`relative ${isCompact ? "w-24 h-24" : "w-full pt-[56.25%]"}`}>
        {sasURL ? (
          <Image
            src={sasURL || "/placeholder.svg"}
            alt={course.Title}
            fill
            sizes={isCompact ? "96px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
            className={`object-cover ${isCompact ? "" : "rounded-t-lg"}`}
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">No image</span>
          </div>
        )}
      </div>
      <CardContent className={`p-4 flex-grow ${isCompact ? "flex-1" : ""}`}>
        <div className="flex justify-between items-start mb-2">
          <h2 className={`font-semibold dark:text-white ${isCompact ? "text-base" : "text-xl"} line-clamp-1`}>
            {course.Title}
          </h2>
          <Badge
            variant={course.Status === "published" ? "secondary" : "destructive"}
            className={`ml-2 ${
              course.Status === "published" ? "bg-green-700 text-green-100" : "bg-red-700 text-red-100"
            }`}
          >
            {course.Status}
          </Badge>
        </div>
        {!isCompact && <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{plainTextDescription}</p>}
        <div className={`flex justify-between items-center ${isCompact ? "mb-0" : "mb-2"}`}>
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1">★</span>
            <span className="dark:text-gray-300">{course.Rating}</span>
          </div>
          <span className="text-lg font-bold dark:text-white">${course.Fees}</span>
        </div>
        {!isCompact && (
          <div className="flex justify-between items-center mt-2">
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
              {course.Category}
            </Badge>
            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
              {course.DifficultyLevel}
            </Badge>
          </div>
        )}
      </CardContent>
      {!isCompact && (
        <CardFooter className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-end items-center">
          <Button
            onClick={handleAddContent}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            Add Content
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

