"use client";

import { PlayCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HLSPlayer from "@/components/students_components/watch-courses/video-player";
import {
  CoursePlayerContentProps,
  VideoDetailsProps,
} from "@/types/watch-courses-api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

function CourseRating({
  currentRating,
  averageRating,
  onRate,
  isLoading,
}: {
  currentRating: number | null;
  averageRating: number;
  onRate: (rating: number) => void;
  isLoading: boolean;
}) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const renderStars = () => {
    const stars = [];
    const ratingValue = hoverRating || currentRating || averageRating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onRate(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(null)}
          disabled={isLoading}
          className="focus:outline-none"
        >
          {i <= ratingValue ? (
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ) : (
            <Star className="w-5 h-5 text-gray-300 dark:text-gray-500" />
          )}
        </button>
      );
    }

    return stars;
  };

  return (
    <div className="mt-4 border-t pt-4 dark:border-gray-700">
      <h3 className="text-sm font-medium mb-2 dark:text-white">
        Rate this course
      </h3>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">{renderStars()}</div>
        {averageRating > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Average: {averageRating.toFixed(1)}/5
          </span>
        )}
      </div>
    </div>
  );
}

function VideoDetails({
  video,
  instructorName,
  chapters,
  onRateCourse,
  courseId,
}: VideoDetailsProps) {
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadRatings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "/api/student/get&update_courses_ratings",
          {
            params: { courseId },
          }
        );

        setCurrentRating(null);
        setAverageRating(response.data.average);
      } catch (error) {
        toast({
          title: "Fail to fetching Ratings",
          description: axios.isAxiosError(error)
            ? error.response?.data.message || "Something went wrong!"
            : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      loadRatings();
    }
  }, [courseId, toast]);

  const handleRate = async (rating: number) => {
    if (rating < 1 || rating > 5) {
      toast({
        title: "Error",
        description: "Rating must be between 1 and 5",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await onRateCourse(rating);
      setCurrentRating(rating);

      // Fetch updated average rating
      const response = await axios.get(
        `/api/student/get&update_courses_ratings`,
        {
          params: { courseId },
        }
      );
      setAverageRating(response.data.average);

      toast({
        title: "Success",
        description: "Thank you for rating this course!",
      });
    } catch (error) {
      toast({
        title: "Fail to Submitting Ratings",
        description: axios.isAxiosError(error)
          ? error.response?.data.message || "Something went wrong!"
          : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 flex-1">
      <div className="border-b dark:border-gray-700 pb-3 mb-3">
        <h2 className="text-xl font-bold mb-1 dark:text-white">
          {video.title}
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground dark:text-gray-400">
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
            {video.isFreePreview && (
              <Badge className="bg-red-600 dark:bg-red-700">Free Preview</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4 border-b dark:border-gray-700 pb-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="font-bold text-gray-500 dark:text-gray-300">
            {instructorName.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="font-medium dark:text-white">{instructorName}</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Instructor
          </p>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <h3 className="font-medium mb-2 dark:text-white">About this video</h3>
        <p className="text-sm dark:text-gray-300">{video.description}</p>
      </div>

      <CourseRating
        currentRating={currentRating}
        averageRating={averageRating}
        onRate={handleRate}
        isLoading={isLoading}
      />

      {video.isCompleted ? (
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md mt-6 flex items-center">
          <div className="bg-green-100 dark:bg-green-800/40 p-2 rounded-full mr-3">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">
              You&apos;ve completed this video!
            </p>

            {chapters.length > 1 &&
              chapters[chapters.length - 1].chapterId !== video.chapterId && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Continue to the next video to keep learning.
                </p>
              )}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mt-6">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Watch the complete video to mark it as completed.
          </p>
        </div>
      )}
    </div>
  );
}

export function CoursePlayerContent({
  courseId,
  currentVideo,
  instructorName,
  chapters,
  onMarkComplete,
}: CoursePlayerContentProps) {
  const { toast } = useToast();

  const handleCourseRating = async (rating: number) => {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      const response = await axios.post(
        "/api/student/get&update_courses_ratings",
        { courseId, rating }
      );

      toast({
        title: "Success",
        description: "Thank you for rating this course!",
      });
      return response.data;
    } catch (error) {
      toast({
        title: "Fail to Submitting Ratings",
        description: axios.isAxiosError(error)
          ? error.response?.data.message || "Something went wrong!"
          : "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (!currentVideo?.videoUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="bg-muted dark:bg-gray-800 p-4 rounded-full inline-flex items-center justify-center mb-6">
            <PlayCircle className="h-8 w-8 text-muted-foreground dark:text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">
            No Video Selected
          </h2>
          <p className="text-muted-foreground dark:text-gray-400">
            Select a video from the sidebar to start learning.
          </p>
        </div>
      </div>
    );
  }
  return (
    <main className="flex-1 overflow-y-auto flex flex-col bg-background dark:bg-gray-900">
      <div className="bg-black w-full p-0 md:p-4">
        <HLSPlayer
          src={currentVideo.videoUrl}
          title={currentVideo.title}
          poster={
            currentVideo.thumbnailUrl ||
            "/placeholder.svg?height=720&width=1280"
          }
          className="w-full aspect-video"
          autoPlay={true}
          onVideoComplete={() => onMarkComplete(currentVideo.chapterId)}
        />
      </div>
      <VideoDetails
        video={currentVideo}
        instructorName={instructorName}
        chapters={chapters}
        onRateCourse={handleCourseRating}
        courseId={courseId}
      />
    </main>
  );
}
