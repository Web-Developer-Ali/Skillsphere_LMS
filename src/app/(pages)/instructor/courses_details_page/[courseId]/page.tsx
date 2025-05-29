"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios, { type AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import CourseFormHeader from "@/components/courses_details/CourseFormHeader";
import CourseDetails from "@/components/courses_details/CourseDetails";
import CourseChapters from "@/components/courses_details/CourseChapters";
import CourseSkills from "@/components/courses_details/CourseSkills";
import CoursePrice from "@/components/courses_details/CoursePrice";
import "nprogress/nprogress.css";
import NProgress from "nprogress";
import type { CourseData } from "@/types/course";
import { Loader2 } from "lucide-react";

interface ApiError {
  error: string;
}

interface Chapter {
  ChapterID: number;
  ChapterCount: number;
  Title: string;
  Status: string;
}

interface UpdateQueue {
  [key: string]: string | number | File;
}

export default function CourseForm() {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [courseChapters, setCourseChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateQueue, setUpdateQueue] = useState<UpdateQueue>({});
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const params = useParams()
  const router = useRouter();
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch course data on mount
  useEffect(() => {
    const fetchCourseData = async () => {
      const courseId = params.courseId as string
      if (!courseId) {
        setError("Course ID not found in URL");
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `/api/instructor/update&get_courses?id=${courseId}`
        );
        if (response.data.success) {
          setCourseData(response.data.CourseDetails);
          setCourseChapters(response.data.Chapters);
        } else {
          throw new Error("Failed to fetch course data");
        }
      } catch {
        setError("Failed to load course data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [params.courseId]);

  // Update course field with debounce
  const updateCourseField = useCallback(
    async (field: string, value: string | number | File): Promise<void> => {
      // Allow deletion of the last skill
      if (field === "Skills" && typeof value === "string" && value.trim() === "") {
        // Update the local state immediately
        setCourseData((prevData) => ({
          ...prevData!,
          Skills: "",
        }));

        // Add the update to the queue
        setUpdateQueue((prevQueue) => ({ ...prevQueue, [field]: value }));

        return;
      }

      // Check if the value has actually changed
      if (courseData && courseData[field as keyof CourseData] !== value) {
        if (value instanceof File) {
          setFileUpload(value);
        } else {
          setUpdateQueue((prevQueue) => ({ ...prevQueue, [field]: value }));
        }
      }

      return Promise.resolve();
    },
    [courseData]
  );

  // Handle course deletion
  const handleDeleteCourse = useCallback(async () => {
    if (!courseData) return;

    // Check if there are any chapters
    if (courseChapters.length > 0) {
      toast({
        title: "Error",
        description: "Please delete all chapters before deleting the course.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      const response = await axios.delete(
        `/api/instructor/delete_courses?id=${courseData.CourseID}&InstructorID=${courseData.InstructorID}&ThumbnailPublicID=${courseData.ThumbnailPublicID}`
      );

      if (response.data.success) {
        toast({
          title: "Course deleted",
          description: "The course has been successfully deleted.",
        });

        // Redirect to the courses list page after deletion
        router.push("/instructor/courses");
      } else {
        throw new Error(response.data.error);
      }
    }  catch (error) {
      toast({
        title: "Fail to Submitting Ratings",
        description: axios.isAxiosError(error)
          ? error.response?.data.message || "Something went wrong!"
          : "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [courseData, courseChapters, router]);

  // Handle chapter deletion
  const handleChapterDelete = useCallback((deletedChapterId: number) => {
    setCourseChapters((prevChapters) =>
      prevChapters.filter((chapter) => chapter.ChapterID !== deletedChapterId)
    );
  }, []);

  // Handle updates with debounce
  useEffect(() => {
    if (
      (Object.keys(updateQueue).length === 0 && !fileUpload) ||
      !courseData ||
      isUpdatingRef.current
    )
      return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      isUpdatingRef.current = true;
      setIsUpdating(true);
      NProgress.start();

      try {
        let formData: FormData | null = null;
        const data: UpdateQueue = { ...updateQueue };

        if (fileUpload) {
          formData = new FormData();
          formData.append("ThumbnailPublicID", fileUpload);
        }

        if (formData) {
          Object.keys(data).forEach((key) => {
            const value = data[key];
            // Convert numbers to strings
            if (typeof value === "number") {
              formData!.append(key, value.toString());
            } else {
              formData!.append(key, value);
            }
          });
        }

        const response = await axios.put(
          `/api/instructor/update&get_courses?id=${courseData.CourseID}`,
          formData || data,
          {
            headers: formData
              ? { "Content-Type": "multipart/form-data" }
              : { "Content-Type": "application/json" },
          }
        );

        if (response.data.updates) {
          // Update local state only after successful API call
          setCourseData((prevData) => ({
            ...prevData!,
            ...response.data.updates,
          }));
          toast({
            title: "Success",
            description: "Course updated successfully",
          });
        } else {
          throw new Error(
            response.data.message || "Failed to update course data"
          );
        }
      } catch (error) {
        console.error("Error updating course:", error);
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ApiError>;
          toast({
            title: "Error",
            description:
              axiosError.response?.data?.error ||
              "Failed to update data. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description:
              "An unexpected error occurred while updating the course.",
            variant: "destructive",
          });
        }
      } finally {
        setUpdateQueue({});
        setFileUpload(null);
        isUpdatingRef.current = false;
        setIsUpdating(false);
        NProgress.done();
      }
    }, 1000);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateQueue, fileUpload, courseData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background dark:bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-gray-200 mb-4" />
      <p className="text-muted-foreground dark:text-gray-400">Loading your courses data...</p>
    </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  if (!courseData)
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 dark:text-white">
        No course data available
      </div>
    );

  return (
    <div className="min-h-screen min-w-full bg-gray-50 dark:bg-gray-900 dark:text-white relative">
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-500" />
            <span className="text-gray-900 dark:text-gray-100">
              Updating...
            </span>
          </div>
        </div>
      )}
      <CourseFormHeader
        courseStatus={courseData.Status}
        updateCourseField={updateCourseField}
        courseId={courseData.CourseID.toString()}
        onDeleteCourse={handleDeleteCourse}
      />
      <main className="container mx-auto py-8 px-4 min-w-full">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-8">
            {courseData && (
              <CourseDetails
                courseData={courseData}
                updateCourseField={updateCourseField}
              />
            )}
          </div>
          <div className="space-y-8">
            <CourseChapters
              courseId={courseData.CourseID.toString()}
              chapters={courseChapters}
              onChapterDelete={handleChapterDelete}
            />
            <CourseSkills
              skills={courseData.Skills}
              updateCourseField={updateCourseField}
            />
            <CoursePrice
              fees={courseData.Fees}
              updateCourseField={updateCourseField}
            />
          </div>
        </div>
      </main>
    </div>
  );
}