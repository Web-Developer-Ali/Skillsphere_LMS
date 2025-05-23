"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Heart,
  Star,
  Users,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Course } from "@/types/browse-courses"

type CourseCardProps = {
  course: Course;
  onFavorite?: (courseId: number) => void;
  isFavorite?: boolean;
};

export default function CourseCard({
  course,
  onFavorite,
  isFavorite = false,
}: CourseCardProps) {
  // Function to get category color
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      Development:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
      Design:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Business: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Marketing:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      Photography:
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      Music:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      "Data Science":
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    };

    return (
      categoryColors[category] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    );
  };

  // Function to get difficulty level color
  const getDifficultyColor = (level: string) => {
    const levelColors: Record<string, string> = {
      Beginner:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
      Intermediate:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
      Advanced:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
    };

    return (
      levelColors[level] ||
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    );
  };

  // Function to format price
  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price}`;
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim(); // Remove all HTML tags
  };

  const router = useRouter();

  return (
    <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700 w-full">
      <div className="aspect-video relative group">
        <Image
          src={course.sasURL || "/placeholder.svg?height=200&width=400"}
          alt={course.Title}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          fill
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button onClick={()=>router.push(`/student/enrollcourse/${course.CourseID}`)} variant="secondary" size="sm" className="gap-1 shadow-md">
            <ExternalLink className="h-4 w-4" />
            Preview
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 ${
            isFavorite ? "text-rose-500" : "text-gray-500"
          } hover:bg-white hover:text-rose-600 shadow-md dark:bg-gray-900/90 dark:hover:bg-gray-900 dark:hover:text-rose-500`}
          onClick={() => onFavorite?.(course.CourseID)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500" : ""}`} />
        </Button>
        {course.Fees === 0 && (
          <Badge className="absolute left-2 top-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md">
            Free
          </Badge>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-wrap gap-2 mb-1.5">
          <Badge
            variant="secondary"
            className={getCategoryColor(course.Category)}
          >
            {course.Category}
          </Badge>
          <Badge
            variant="outline"
            className={getDifficultyColor(course.DifficultyLevel)}
          >
            {course.DifficultyLevel}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1 text-lg font-bold dark:text-white hover:text-primary dark:hover:text-primary transition-colors">
          {course.Title}
        </CardTitle>
        <CardDescription className="dark:text-gray-300 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {course.InstructorName}
            </span>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-900/30">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {course.Rating}
              </span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <p className="line-clamp-2 text-sm text-muted-foreground dark:text-gray-400 min-h-[40px]">
          {stripHtml(course.Description) ||
            "Learn valuable skills with this comprehensive course."}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{course.DurationWeeks} weeks</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{course.StudentCount?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{course.ChapterCount}</span>
          </div>
        </div>
        <div className="font-bold text-lg text-primary dark:text-primary-foreground">
          {formatPrice(course.Fees)}
        </div>
      </CardFooter>
    </Card>
  );
}
