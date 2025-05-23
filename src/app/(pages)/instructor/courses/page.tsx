"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import CourseCard from "@/components/CourseCard"
import { Loader2, Plus, RefreshCw, Search, SlidersHorizontal, BookOpen, Users, Star, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface Course {
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

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const router = useRouter()

  const fetchCourses = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get("/api/instructor/get_allCourses")
      setCourses(response.data)
      setFilteredCourses(response.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to fetch courses. Please try again later.")
      } else {
        setError("An unexpected error occurred. Please try again later.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    // Filter and sort courses based on user selections
    let result = [...courses]

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((course) => course.Status.toLowerCase() === statusFilter)
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (course) =>
          course.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.Category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply sorting
    switch (sortBy) {
      case "title":
        result.sort((a, b) => a.Title.localeCompare(b.Title))
        break
      case "rating":
        result.sort((a, b) => b.Rating - a.Rating)
        break
      case "price":
        result.sort((a, b) => b.Fees - a.Fees)
        break
      default: // newest
        result.sort((a, b) => b.CourseID - a.CourseID)
    }

    setFilteredCourses(result)
  }, [courses, searchQuery, statusFilter, sortBy])

  const getStats = () => {
    const published = courses.filter((course) => course.Status.toLowerCase() === "published").length
    const draft = courses.filter((course) => course.Status.toLowerCase() === "draft").length
    const totalRating = courses.reduce((sum, course) => sum + course.Rating, 0)
    const averageRating = courses.length > 0 ? totalRating / courses.length : 0

    return {
      total: courses.length,
      published,
      draft,
      averageRating,
    }
  }

  const stats = getStats()

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-gray-200 mb-4" />
        <p className="text-muted-foreground dark:text-gray-400">Loading your courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-6 bg-card dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <div className="text-destructive dark:text-red-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Error Loading Courses</h3>
          </div>
          <p className="text-muted-foreground dark:text-gray-300 mb-6">{error}</p>
          <Button
            variant="default"
            className="w-full dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            onClick={fetchCourses}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-full container mx-auto px-4 py-8 bg-background dark:bg-gray-900">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6 dark:text-white">Courses</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="dark:bg-gray-800">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total Courses</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4 text-primary dark:text-gray-200" />
                <span className="text-2xl font-bold dark:text-white">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Published</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-green-500 dark:text-green-400" />
                <span className="text-2xl font-bold dark:text-white">{stats.published}</span>
              </div>
              <Progress value={stats.total > 0 ? (stats.published / stats.total) * 100 : 0} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Drafts</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4 text-amber-500 dark:text-amber-400" />
                <span className="text-2xl font-bold dark:text-white">{stats.draft}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search courses..."
              className="pl-8 w-full dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] dark:bg-gray-800 dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="dark:bg-gray-800 dark:text-white">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800">
                <DropdownMenuItem
                  onClick={() => setSortBy("newest")}
                  className="dark:text-white dark:focus:bg-gray-700"
                >
                  Sort by Newest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")} className="dark:text-white dark:focus:bg-gray-700">
                  Sort by Title
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("rating")}
                  className="dark:text-white dark:focus:bg-gray-700"
                >
                  Sort by Rating
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price")} className="dark:text-white dark:focus:bg-gray-700">
                  Sort by Price
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Button
          className="w-full sm:w-auto dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 mr-2"
          onClick={() => router.push("/instructor/dashboard")}
        >
          <Layout className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          className="w-full sm:w-auto dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          onClick={() => router.push("/instructor/add_courses")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Course
        </Button>
      </div>

      {/* Course List */}
      <Tabs defaultValue="grid" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Showing <span className="font-medium dark:text-white">{filteredCourses.length}</span> of{" "}
            <span className="font-medium dark:text-white">{courses.length}</span> courses
          </p>
          <TabsList className="dark:bg-gray-800">
            <TabsTrigger
              value="grid"
              className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Grid
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              List
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-0">
          {filteredCourses.length === 0 ? (
            <EmptyState
              searchQuery={searchQuery}
              onClear={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              onCreateNew={() => router.push("/instructor/add_courses")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map((course) => (
                <CourseCard key={course.CourseID} course={course} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          {filteredCourses.length === 0 ? (
            <EmptyState
              searchQuery={searchQuery}
              onClear={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              onCreateNew={() => router.push("/instructor/add_courses")}
            />
          ) : (
            <div className="space-y-2">
              {filteredCourses.map((course) => (
                <div key={course.CourseID} className="bg-card dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <CourseCard course={course} variant="compact" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({
  searchQuery,
  onClear,
  onCreateNew,
}: {
  searchQuery: string
  onClear: () => void
  onCreateNew: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center dark:bg-gray-800">
      <div className="w-16 h-16 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-muted-foreground dark:text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2 dark:text-white">
        {searchQuery ? "No courses found" : "No courses created yet"}
      </h3>
      <p className="text-muted-foreground dark:text-gray-300 max-w-md mb-6">
        {searchQuery
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : "Start creating your first course to share your knowledge with students around the world."}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        {searchQuery && (
          <Button
            variant="outline"
            onClick={onClear}
            className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Clear Filters
          </Button>
        )}
        <Button onClick={onCreateNew} className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
          <Plus className="mr-2 h-4 w-4" />
          Create New Course
        </Button>
      </div>
    </div>
  )
}

