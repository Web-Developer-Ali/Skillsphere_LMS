"use client";
import { useRef, useState, useEffect, lazy, Suspense } from "react";
import type React from "react";
import Image from "next/image";
import { PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  Course,
  VideoPlayerHandle,
  VideoPlayerProps,
} from "@/types/enrolleCourses";

// Lazy loaded VideoPlayer with proper typing
const HLSPlayer = lazy<React.FC<VideoPlayerProps>>(
  () => import("@/components/students_components/watch-courses/video-player")
);

// Course Header Component
export function CourseHeader({ course }: { course: Course }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {course.title}
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        By <span itemProp="instructor">{course.instructor}</span>
      </p>
    </div>
  );
}

// Course Video Preview Component
export function CourseVideoPreview({
  videoUrl,
  thumbnailUrl,
  title,
  instructor,
}: {
  videoUrl?: string;
  thumbnailUrl: string | null;
  title: string;
  instructor: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const playerRef = useRef<VideoPlayerHandle | null>(null);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      const player = playerRef.current;
      if (player) {
        try {
          player.dispose();
        } catch (e) {
          console.error("Error disposing player:", e);
        }
      }
      playerRef.current = null;
    };
  }, []);

  // Handle dialog open/close effects
  useEffect(() => {
    if (!dialogOpen) {
      const player = playerRef.current;
      if (player) {
        try {
          player.pause();
        } catch (e) {
          console.error("Error pausing player:", e);
        }
      }
    }
  }, [dialogOpen]);

  if (!videoUrl) return null;

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="absolute inset-0 flex items-center justify-center group w-full h-full"
            aria-label={`Play preview of ${title}`}
          >
            <div className="relative w-full h-full">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl || "/placeholder.svg"}
                  alt={`Preview thumbnail for ${title}`}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity"
                  fill
                  priority={false}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                />
              ) : (
                <div className="w-full h-full bg-gray-700" />
              )}
              <PlayCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent
          className="max-w-[80vw] w-full p-0 bg-black overflow-hidden opacity-100 no-close-button"
          style={{ aspectRatio: "16/9", opacity: 1 }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setDialogOpen(false)}
        >
          <style jsx global>{`
            .no-close-button [data-radix-collection-item] {
              display: none !important;
            }
          `}</style>

          <div className="relative w-full h-full">
            <DialogTitle className="sr-only">
              Course Preview Video: {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preview video for {title} course by {instructor}
            </DialogDescription>

            {/* Custom close button */}
            <button
              onClick={() => setDialogOpen(false)}
              className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-all"
              aria-label="Close video"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="w-full h-full video-player-container">
              {videoError ? (
                <div className="flex items-center justify-center h-full bg-black text-white p-4">
                  <div className="text-center">
                    <p className="mb-4">{videoError}</p>
                    <Button
                      onClick={() => {
                        setVideoError(null);
                        setDialogOpen(true);
                      }}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  }
                >
                  <HLSPlayer
                    src={videoUrl}
                    poster={thumbnailUrl || undefined}
                    title={title}
                    autoPlay={true}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Course Content Component
export function CourseContent({ course }: { course: Course }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold dark:text-white mb-4">
        About This Course
      </h2>
      <div
        className="prose dark:text-white max-w-none"
        dangerouslySetInnerHTML={{ __html: course.description }}
        itemProp="description"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
          <p className="font-medium dark:text-white" itemProp="timeRequired">
            {course.duration}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
          <p
            className="font-medium dark:text-white"
            itemProp="educationalLevel"
          >
            {course.level}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
          <p
            className="font-medium dark:text-white"
            itemProp="numberOfStudents"
          >
            {course.studentsEnrolled.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Course Enrollment Sidebar Component
export function CourseEnrollmentSidebar({
  course,
  enrolling,
  onEnroll,
}: {
  course: Course;
  enrolling: boolean;
  onEnroll: () => void;
}) {
  return (
    <aside className="md:w-1/3 bg-gray-50 dark:bg-gray-700 p-6 md:p-8 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-600">
      <div className="sticky top-8">
        <div className="mb-6">
          <div
            className="flex items-center mb-2"
            itemProp="aggregateRating"
            itemScope
            itemType="https://schema.org/AggregateRating"
          >
            <div
              className="flex items-center"
              aria-label={`Rating: ${course.rating} out of 5`}
            >
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(course.rating)
                      ? "text-yellow-400 dark:text-yellow-500"
                      : "text-gray-300 dark:text-gray-500"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">
              <span itemProp="ratingValue">{course.rating || 0}</span> (
              <span itemProp="ratingCount">{course.studentsEnrolled}</span>{" "}
              students)
            </span>
          </div>
        </div>

        <Button
          onClick={onEnroll}
          className="w-full py-6 text-lg font-semibold mb-6"
          disabled={enrolling || course.isEnrolled}
          aria-disabled={enrolling || course.isEnrolled}
        >
          {course.isEnrolled
            ? "Already Enrolled"
            : enrolling
            ? "Enrolling..."
            : "Enroll Now"}
        </Button>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6">
          <h3 className="font-medium dark:text-white mb-4">
            What You&apos;ll Learn
          </h3>

          <ul className="space-y-3">
            {course.skills.map((skill, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="dark:text-gray-300" itemProp="teaches">
                  {skill}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="font-medium dark:text-white mb-4">Course Content</h3>
          <div className="space-y-4">
            {course.content.slice(0, 3).map((chapter) => (
              <div
                key={chapter.id}
                itemProp="hasPart"
                itemScope
                itemType="https://schema.org/CreativeWork"
              >
                <h4
                  className="text-sm font-semibold dark:text-gray-300 mb-2"
                  itemProp="name"
                >
                  {chapter.title}
                </h4>
                <Progress
                  value={chapter.isCompleted ? 100 : 0}
                  className="h-2"
                  aria-label={`Progress for ${chapter.title}`}
                />
              </div>
            ))}
            {course.totalChapters > 3 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                + {course.totalChapters - 3} more chapters
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Course Structured Data Component
export function CourseStructuredData({ course }: { course: Course }) {
  // Generate structured data for SEO
  const courseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description.replace(/<[^>]*>?/gm, "").substring(0, 160),
    provider: {
      "@type": "Organization",
      name: "Your Platform Name",
      sameAs: "https://yourplatform.com",
    },
    instructor: {
      "@type": "Person",
      name: course.instructor,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: course.rating,
      ratingCount: course.studentsEnrolled,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(courseStructuredData) }}
    />
  );
}
