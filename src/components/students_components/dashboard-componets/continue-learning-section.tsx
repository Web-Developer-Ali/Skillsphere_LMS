"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookMarked,
  ChevronRight,
  Calendar,
  ArrowRight,
  Bookmark,
} from "lucide-react";
import { BookOpen } from "lucide-react";

interface Course {
  CourseID: number;
  Title: string;
  Category: string;
  DifficultyLevel: string;
  CompletionStatus: boolean;
  EnrollmentDate: string;
  ThumbnailPublicID: string;
  Rating?: number;
  Fees: number;
  Description?: string;
}

interface ContinueLearningProps {
  courses: Course[];
  sasURLs: Record<number, string>;
  formatDate: (dateString: string) => string;
  calculateProgress: (course: Course) => number;
  handleCourseClick: (courseId: number) => void;
  activeTab: string;
}

function ContinueLearningSection({
  courses,
  sasURLs,
  formatDate,
  calculateProgress,
  handleCourseClick,
  activeTab,
}: ContinueLearningProps) {
  const isVisible = activeTab === "overview" || activeTab === "learning";

  return (
    <div className={`mt-8 space-y-4 ${!isVisible ? "hidden md:block" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight dark:text-white flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary hidden md:inline-block" />
          Continue Learning
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <span className="hidden sm:inline">View All Courses</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses in progress</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            You haven&apos;t enrolled in any courses yet. Browse our catalog to
            find courses that interest you.
          </p>

          <Button>Browse Courses</Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course: Course) => (
            <CourseCard
              key={course.CourseID}
              course={course}
              sasURL={sasURLs[course.CourseID]}
              formatDate={formatDate}
              calculateProgress={calculateProgress}
              handleCourseClick={handleCourseClick}
            />
          ))}

          {/* If there are fewer than 4 recent courses, show a placeholder */}
          {courses.length < 4 && (
            <Card className="h-full overflow-hidden dark:bg-gray-800 dark:border-gray-700 border-dashed hover:border-primary/50 transition-colors duration-300">
              <div className="aspect-video relative">
                <Image
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000&auto=format&fit=crop"
                  alt="Explore more courses"
                  className="object-cover brightness-75 hover:brightness-100 transition-all duration-500"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg text-center">
                    <Bookmark className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Discover New Courses</h3>
                  </div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="dark:text-white text-center">
                  Explore More Courses
                </CardTitle>
                <CardDescription className="dark:text-gray-300 text-center">
                  Find your next learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="w-full dark:border-gray-600 dark:text-gray-300"
                  >
                    Browse Catalog
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Update the CourseCard component to handle progressive image loading
const CourseCard = memo(
  ({
    course,
    sasURL,
    formatDate,
    calculateProgress,
    handleCourseClick,
  }: {
    course: Course;
    sasURL?: string;
    formatDate: (dateString: string) => string;
    calculateProgress: (course: Course) => number;
    handleCourseClick: (courseId: number) => void;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const placeholderUrl = "/placeholder.svg?height=200&width=400";

    return (
      <div
        onClick={() => handleCourseClick(course.CourseID)}
        className="cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <Card className="h-full overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300">
          <div className="aspect-video relative bg-muted">
            {/* Show a shimmer effect while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
            )}

            <Image
              src={sasURL || placeholderUrl}
              alt={course.Title}
              className={`object-cover transition-transform duration-500 hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // Show something even if image fails
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
          <CardHeader className="p-4">
            <CardTitle className="text-base md:text-lg line-clamp-1 dark:text-white">
              {course.Title}
            </CardTitle>
            <CardDescription className="dark:text-gray-300">
              <div className="flex items-center justify-between text-sm">
                <span className="line-clamp-1">{course.Category}</span>
                <Badge
                  variant="secondary"
                  className="dark:bg-gray-700 dark:text-gray-200 whitespace-nowrap"
                >
                  {course.DifficultyLevel}
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(course.EnrollmentDate)}
                </span>
                <span className="text-primary dark:text-blue-400">
                  {calculateProgress(course)}% Complete
                </span>
              </div>
              <Progress
                value={calculateProgress(course)}
                className="h-1.5 dark:bg-gray-700"
              />
              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  className="text-xs h-8 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course.CourseID);
                  }}
                >
                  Continue <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
CourseCard.displayName = "CourseCard";

export default memo(ContinueLearningSection);
