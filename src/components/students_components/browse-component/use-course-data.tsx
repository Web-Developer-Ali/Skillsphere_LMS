"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import axios, { type AxiosError } from "axios"
import type { ApiResponse, Course, SasResponse, FilterState } from "@/types/browse-courses"

interface UseCourseDataProps {
  page: number
  limit: number
  category: string
  sort: string
  searchQuery: string
  filters: FilterState
  isClient: boolean
  setIsSearching: (value: boolean) => void
}

export function useCourseData({
  page,
  limit,
  category,
  sort,
  searchQuery,
  filters,
  isClient,
  setIsSearching,
}: UseCourseDataProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [favorites, setFavorites] = useState<number[]>([])

  // Load favorites from localStorage on initial render
  useEffect(() => {
    if (!isClient) return
    const savedFavorites = localStorage.getItem("courseFavorites")
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error("Failed to parse favorites from localStorage", e)
      }
    }
  }, [isClient])

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (!isClient) return
    localStorage.setItem("courseFavorites", JSON.stringify(favorites))
  }, [favorites, isClient])

  // Fetch courses function
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const response = await axios.get<ApiResponse>("/api/student/browse-courses", {
        params: {
          page,
          limit,
          category: category !== "All" ? category : undefined,
          sort,
          search: searchQuery || undefined,
          level: filters.levels.length > 0 ? filters.levels.join(",") : undefined,
          duration: filters.durations.length > 0 ? filters.durations.join(",") : undefined,
          maxPrice: filters.priceRange,
          minRating: filters.ratings.length > 0 ? Math.min(...filters.ratings) : undefined,
        },
        timeout: 10000,
      })
      if (!response.data?.courses) {
        throw new Error("API response missing courses array")
      }

      // Fetch SAS URLs in parallel with error handling for each course
      const coursesWithSasUrls = await Promise.all(
        response.data.courses.map(async (course) => {
          if (!course.ThumbnailPublicID) return course

          try {
            const sasResponse = await axios.get<SasResponse>("/api/generate-sas-token", {
              params: { blobName: course.ThumbnailPublicID },
              timeout: 5000,
            })
            return { ...course, sasURL: sasResponse.data.sasURL }
          } catch (err) {
            console.error(`Error fetching SAS URL for ${course.ThumbnailPublicID}:`, err)
            return course
          }
        }),
      )

      setCourses(coursesWithSasUrls)
      setCategories(response.data.availableCategories)
      setTotalPages(response.data.totalPages)
      setTotalCount(response.data.totalCount)
    } catch (err) {
      const error = err as AxiosError
      console.error("Failed to load courses:", error)
      setError(
        error.response?.status === 429
          ? "Too many requests. Please wait a moment and try again."
          : "Failed to load courses. Please try again later.",
      )
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [page, limit, category, sort, searchQuery, filters, setIsSearching])

  // Fetch courses when dependencies change
  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleFavoriteToggle = (courseId: number) => {
    setFavorites((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]))
  }

  // Memoize the courses to prevent unnecessary re-renders
  const memoizedCourses = useMemo(() => courses, [courses])

  return {
    courses: memoizedCourses,
    categories,
    loading,
    error,
    totalPages,
    totalCount,
    favorites,
    fetchCourses,
    handleFavoriteToggle,
  }
}
