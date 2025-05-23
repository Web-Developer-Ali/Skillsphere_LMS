import Image from "next/image";
import { Calendar, ArrowRight, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

interface Course {
  CourseID: number;
  Title: string;
  Category: string;
  DifficultyLevel: string;
  Rating?: number | string;
  Fees?: string;
  EnrollmentDate?: string;
  Progress?: number;
}

interface CourseCardProps {
  course: Course;
  isRecommended: boolean;
  sasURL?: string;
}

export default function CourseCard({
  course,
  isRecommended,
  sasURL,
}: CourseCardProps) {
  const router = useRouter();

  const formatDate = useCallback((dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  const handleRedirect = useCallback(
    (CourseID: number, isRecommended: boolean) => {
      const path = isRecommended
        ? `/student/enrollcourse/${CourseID}`
        : `/student/watch-course/${CourseID}`;
      router.push(path);
    },
    [router]
  );

  const imageUrl = useMemo(
    () => sasURL || "/placeholder-course-thumbnail.jpg",
    [sasURL]
  );

  const imageSizes = useMemo(
    () =>
      isRecommended
        ? "(max-width: 640px) 280px, (max-width: 1024px) 33vw, 25vw"
        : "100vw",
    [isRecommended]
  );

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement;
      target.src = "/placeholder-course-thumbnail.jpg";
    },
    []
  );

  return (
    <Card
      className="h-full overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-lg"
      role="article"
      aria-label={`Course: ${course.Title}`}
    >
      <div className="aspect-video relative">
        <Image
          src={imageUrl}
          alt={course.Title}
          className="object-cover transition-transform duration-500 hover:scale-105"
          fill
          sizes={imageSizes}
          priority={!isRecommended}
          onError={handleImageError}
          quality={85}
          loading={isRecommended ? "lazy" : "eager"}
        />
        {isRecommended && (
          <Badge
            className="absolute top-2 right-2 dark:bg-gray-800/90 dark:text-gray-200 backdrop-blur-sm"
            variant="secondary"
            aria-label={`Difficulty level: ${course.DifficultyLevel}`}
          >
            {course.DifficultyLevel}
          </Badge>
        )}
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-base md:text-lg line-clamp-1 dark:text-white">
          {course.Title}
        </CardTitle>
        <CardDescription className="dark:text-gray-300">
          <div className="flex items-center justify-between">
            <span className="line-clamp-1">{course.Category}</span>
            {isRecommended ? (
              <div className="flex items-center gap-1" aria-label={`Rating: ${course.Rating || "New"}`}>
                <Star className="h-4 w-4 fill-yellow-500 stroke-yellow-500" />
                <span>{course.Rating || "New"}</span>
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="dark:bg-gray-700 dark:text-gray-200 whitespace-nowrap"
                aria-label={`Difficulty level: ${course.DifficultyLevel}`}
              >
                {course.DifficultyLevel}
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isRecommended ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground dark:text-gray-400 font-medium">
              ${course.Fees}
            </span>
            <Button
              onClick={() => handleRedirect(course.CourseID, true)}
              variant="outline"
              size="sm"
              className="bg-blue-500 text-white dark:hover:bg-gray-700 dark:hover:text-white text-xs h-8"
              aria-label={`View course ${course.Title}`}
            >
              View Course
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {course.EnrollmentDate && formatDate(course.EnrollmentDate)}
              </span>
              <span className="text-primary dark:text-blue-400">
                {course.Progress}% Complete
              </span>
            </div>
            <Progress
              value={course.Progress}
              className="h-1.5 dark:bg-gray-700"
              aria-label={`Progress: ${course.Progress}% complete`}
            />
            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => handleRedirect(course.CourseID, false)}
                size="sm"
                className="text-xs h-8 gap-1"
                aria-label={`Continue course ${course.Title}`}
              >
                Continue <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}