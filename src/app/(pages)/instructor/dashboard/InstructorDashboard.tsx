"use client"

import React, { useState, useMemo, useCallback } from "react"
import useSWR from "swr"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Users, BookOpen, DollarSign, TrendingUp, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import type { DashboardData } from "@/types/dashboard"

const fetcher = (url: string) => axios.get(url).then((res) => res.data)

interface InstructorDashboardProps {
  initialData?: DashboardData
}

interface CourseCardProps {
  name: string
  students: number
  revenue: number
  rating: number
}

const ITEMS_PER_PAGE = 6

const CourseCard = React.memo<CourseCardProps>(({ name, students, revenue, rating }) => (
  <Card className="dark:bg-gray-800 transition-all duration-200 hover:shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium dark:text-gray-200">{name}</CardTitle>
      <BookOpen className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground dark:text-gray-400">Students</p>
          <p className="text-2xl font-bold dark:text-white">{students}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground dark:text-gray-400">Revenue</p>
          <p className="text-2xl font-bold dark:text-white">${revenue}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground dark:text-gray-400">Rating</p>
          <p className="text-2xl font-bold dark:text-white">{rating.toFixed(1)}</p>
        </div>
      </div>
    </CardContent>
  </Card>
))

CourseCard.displayName = "CourseCard"

export default function InstructorDashboard({ initialData }: InstructorDashboardProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/instructor/dashboard", fetcher, {
    fallbackData: initialData,
    refreshInterval: 30000,
  })

  const paginatedCourses = useMemo(() => {
    if (!data?.courses) return []
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return data.courses.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [data?.courses, currentPage])

  const totalPages = useMemo(() => {
    return Math.ceil((data?.courses?.length || 0) / ITEMS_PER_PAGE)
  }, [data?.courses])

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
  }, [])

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background dark:bg-gray-900">
        <Card className="w-full max-w-md p-6 bg-card dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-xl font-semibold mb-2 dark:text-white">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground dark:text-gray-300 mb-6">
              There was an error loading your dashboard data. Please try again.
            </p>
            <Button
              variant="default"
              className="w-full dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              onClick={() => mutate()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-gray-200 mb-4" />
        <p className="text-muted-foreground dark:text-gray-400">Loading your data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">Instructor Dashboard</h1>
        <Button
          className="bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
          onClick={() => router.push("/instructor/add_courses")}
        >
          Create New Course
        </Button>
      </div>

      <Tabs defaultValue="overview" className="dark:text-gray-200">
        <TabsList className="dark:bg-gray-800 mb-4">
          <TabsTrigger value="overview" className="dark:data-[state=active]:bg-gray-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="courses" className="dark:data-[state=active]:bg-gray-700">
            Courses
          </TabsTrigger>
          <TabsTrigger value="students" className="dark:data-[state=active]:bg-gray-700">
            Students
          </TabsTrigger>
          <TabsTrigger value="revenue" className="dark:data-[state=active]:bg-gray-700">
            Revenue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Students"
              value={data?.overview.totalStudents}
              icon={<Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />}
            />
            <StatCard
              title="Total Courses"
              value={data?.overview.totalCourses}
              icon={<BookOpen className="h-4 w-4 text-muted-foreground dark:text-gray-400" />}
            />
            <StatCard
              title="Total Revenue"
              value={`$${data?.overview.totalRevenue}`}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground dark:text-gray-400" />}
            />
            <StatCard
              title="Average Rating"
              value={data?.overview.averageRating.toFixed(1)}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground dark:text-gray-400" />}
              progress={(data?.overview.averageRating ?? 0) * 20}
            />
          </div>

          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.revenue.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "none" }} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 dark:bg-gray-900 min-h-[calc(100vh-200px)] p-4">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Your Courses</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedCourses.map((course, index) => (
              <CourseCard key={index} {...course} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          <Button
            className="w-full mt-4 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors duration-200"
            onClick={() => router.push("/instructor/courses")}
          >
            View All Courses
          </Button>
        </TabsContent>

        <TabsContent value="students" className="space-y-4 dark:bg-gray-900 min-h-[calc(100vh-200px)] p-4">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Recent Enrollments</h2>
          <Card className="dark:bg-gray-800">
            <CardContent>
              <div className="space-y-8">
                {data?.students.map((student, i) => (
                  <StudentRow key={i} student={student} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Revenue Analytics</h2>
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Revenue by Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.revenue.revenueByCourse}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "none" }} />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const StatCard: React.FC<{ title: string; value?: number | string; icon: React.ReactNode; progress?: number }> = ({
  title,
  value,
  icon,
  progress,
}) => (
  <Card className="dark:bg-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium dark:text-gray-200">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold dark:text-white">{value}</div>
      {progress !== undefined && <Progress value={progress} className="mt-2 dark:bg-gray-700" />}
    </CardContent>
  </Card>
)

const StudentRow: React.FC<{ student: { name: string; avatar: string; courseName: string } }> = ({ student }) => (
  <div className="flex items-center">
    <Avatar className="h-9 w-9">
      <AvatarImage src={student.avatar} alt="Avatar" />
      <AvatarFallback className="dark:bg-gray-600 dark:text-white">{student.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="ml-4 space-y-1">
      <p className="text-sm font-medium leading-none dark:text-white">{student.name}</p>
      <p className="text-sm text-muted-foreground dark:text-gray-400">Enrolled in: {student.courseName}</p>
    </div>
    <Button
      variant="ghost"
      className="ml-auto dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200"
    >
      View Profile
    </Button>
  </div>
)

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => (
  <div className="flex justify-between items-center mt-4">
    <Button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors duration-200"
    >
      <ChevronLeft className="h-4 w-4 mr-2" />
      Previous
    </Button>
    <span className="dark:text-white">
      Page {currentPage} of {totalPages}
    </span>
    <Button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors duration-200"
    >
      Next
      <ChevronRight className="h-4 w-4 ml-2" />
    </Button>
  </div>
)

