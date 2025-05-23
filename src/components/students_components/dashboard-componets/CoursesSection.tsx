import { BookMarked, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseCard from "./CourseCard";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Course } from "@/types/dashboard";


interface CoursesSectionProps {
  title: string;
  courses: Array<Course & { Fees?: string }>;
  emptyMessage: string;
  icon: "book" | "star";
  isRecommended?: boolean;
  sasURLs: Record<number, string>;
}

export default function CoursesSection({
  title,
  courses,
  emptyMessage,
  icon,
  isRecommended = false,
  sasURLs,
}: CoursesSectionProps) {
  const router = useRouter();
  const IconComponent = icon === "book" ? BookMarked : Star;

  const handleRedirect = useCallback(() => {
    router.push("/student/browse-courses");
  }, [router]);

  const gridClasses = useCallback(
    () =>
      isRecommended
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    [isRecommended]
  );

  if (courses.length === 0) {
    return (
      <section 
        className="flex flex-col items-center justify-center py-12 text-center"
        aria-label={emptyMessage}
      >
        <IconComponent
          className="h-12 w-12 text-muted-foreground mb-4"
          aria-hidden="true"
        />
        <h3 className="text-lg dark:text-white font-medium mb-2">
          {emptyMessage}
        </h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          {isRecommended
            ? "Complete more courses to get personalized recommendations based on your interests."
            : "You haven't enrolled in any courses yet. Browse our catalog to find courses that interest you."}
        </p>
        <Button
          onClick={handleRedirect}
          className="bg-blue-600 hover:bg-blue-700 transition-colors"
          aria-label="Browse courses"
        >
          Browse Courses
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-4" aria-labelledby="courses-section-title">
      <div className="flex items-center justify-between">
        <h2
          id="courses-section-title"
          className="text-xl md:text-2xl font-bold tracking-tight dark:text-white flex items-center gap-2"
        >
          <IconComponent
            className="h-5 w-5 text-primary hidden md:inline-block"
            aria-hidden="true"
          />
          {title}
        </h2>
      </div>

      <div
        className={`grid gap-4 ${gridClasses()}`}
        role="list"
        aria-label={`List of ${title.toLowerCase()}`}
      >
        {courses.map((course) => (
          <div key={course.CourseID} role="listitem">
            <CourseCard
              course={course}
              isRecommended={isRecommended}
              sasURL={sasURLs[course.CourseID]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}