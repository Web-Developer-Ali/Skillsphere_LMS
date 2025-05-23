"use client"

import { Button } from "@/components/ui/button"
import CourseCardSkeleton from "@/components/students_components/browse-component/course-card-skeleton"
import CourseCard from "@/components/students_components/browse-component/course-card"
import type { Course, FilterState } from "@/types/browse-courses"

interface CourseListSectionProps {
  courses: Course[]
  loading: boolean
  error: string
  favorites: number[]
  handleFavoriteToggle: (courseId: number) => void
  fetchCourses: () => Promise<void>
  setCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: FilterState) => void
}

export function CourseListSection({
  courses,
  loading,
  error,
  favorites,
  handleFavoriteToggle,
  fetchCourses,
  setCategory,
  setSearchQuery,
  setFilters,
}: CourseListSectionProps) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:col-start-2 w-full">
      {loading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <CourseCardSkeleton key={`skeleton-${index}`} aria-label="Loading course" />
        ))
      ) : error ? (
        <div className="col-span-full text-center py-10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button onClick={fetchCourses} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="col-span-full text-center py-10">
          <p className="text-muted-foreground dark:text-gray-400">
            No courses found matching your criteria. Try adjusting your filters.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setCategory("All")
              setSearchQuery("")
              setFilters({
                levels: [],
                durations: [],
                priceRange: 50,
                ratings: [],
              })
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        courses.map((course) => (
          <CourseCard
            key={course.CourseID}
            course={course}
            onFavorite={handleFavoriteToggle}
            isFavorite={favorites.includes(course.CourseID)}
            aria-label={`Course: ${course.Title} by ${course.InstructorName}`}
          />
        ))
      )}
    </div>
  )
}
