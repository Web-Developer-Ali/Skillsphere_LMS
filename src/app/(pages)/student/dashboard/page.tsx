"use client";

import { useEffect, useState, useCallback } from "react";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";
import Head from "next/head";

import { Course, UserInfo } from "@/types/dashboardTypes";
import LoadingSkeleton from "@/components/students_components/dashboard-componets/LoadingSkeleton";
import ErrorState from "@/components/students_components/dashboard-componets/ErrorState";
import StatsOverview from "@/components/students_components/dashboard-componets/StatsOverview";
import CoursesSection from "@/components/students_components/dashboard-componets/CoursesSection";

const BATCH_SIZE = 6; // Optimal batch size for SAS token requests

// Utility function to format course data
const formatCourseData = (courses: Course[]) =>
  courses.map((c) => ({
    ...c,
    Fees: c.Fees?.toString() ?? "",
  }));

export default function StudentDashboard() {
  const [user, setUser] = useState<Session | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [sasURLs, setSasURLs] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSasToken = useCallback(
    async (blobName: string): Promise<string | null> => {
      try {
        const response = await fetch(
          `/api/generate-sas-token?blobName=${encodeURIComponent(blobName)}`,
          { next: { revalidate: 3600 } }
        );
        if (!response.ok) throw new Error("Failed to generate SAS token");
        const { sasURL } = await response.json();
        return sasURL;
      } catch (error) {
        console.error("Error generating SAS token:", error);
        return null;
      }
    },
    []
  );

  const processThumbnails = useCallback(
    async (courses: Course[]) => {
      const thumbnailPromises = courses
        .filter((course) => course.ThumbnailPublicID)
        .map(async (course) => {
          const sasURL = await fetchSasToken(course.ThumbnailPublicID!);
          return sasURL ? { courseId: course.CourseID, sasURL } : null;
        });

      const results: ({ courseId: number; sasURL: string } | null)[] = [];
      for (let i = 0; i < thumbnailPromises.length; i += BATCH_SIZE) {
        const batch = thumbnailPromises.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch);
        results.push(...batchResults.filter(Boolean));
      }

      setSasURLs((prev) => ({
        ...prev,
        ...Object.fromEntries(
          results
            .filter(
              (result): result is { courseId: number; sasURL: string } =>
                result !== null
            )
            .map(({ courseId, sasURL }) => [courseId, sasURL])
        ),
      }));
    },
    [fetchSasToken]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [session, dashboardRes] = await Promise.all([
        getSession(),
        fetch("/api/student/dashboard", { next: { tags: ["dashboard"] } }),
      ]);

      if (!dashboardRes.ok) throw new Error("Failed to fetch dashboard data");

      const userInfoData = await dashboardRes.json();
      setUser(session);
      setUserInfo(userInfoData);
      setRecommendedCourses(userInfoData.recommendedCourses || []);

      await processThumbnails([
        ...(userInfoData.recentEnrolledCourses || []),
        ...(userInfoData.recommendedCourses || []),
      ]);
    } catch (error) {
      console.error("Dashboard error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [processThumbnails]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <>
      <Head>
        <title>Student Dashboard | Your Learning Platform</title>
        <meta
          name="description"
          content="Access your courses, track progress, and discover new learning opportunities"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="My Learning Dashboard" />
        <meta
          property="og:description"
          content="Track your learning progress and discover new courses"
        />
        <meta property="og:type" content="website" />
        <link
          rel="canonical"
          href={`${process.env.NEXTAUTH_URL}/student/dashboard`}
        />
      </Head>
      <div className="flex min-h-screen bg-background dark:bg-gray-900">
        <main className="flex-1 pb-8">
          <h1 className="px-4 md:px-6 py-3 md:py-4 text-lg md:text-xl font-semibold text-foreground dark:text-gray-100">
            Welcome back, {user?.user?.name || "Guest"}!
          </h1>
          <div className="px-4 md:px-6 pt-2">
            <StatsOverview userInfo={userInfo} />

            <CoursesSection
              title="Continue Learning"
              courses={formatCourseData(userInfo?.recentEnrolledCourses || [])}
              emptyMessage="No courses in progress"
              icon="book"
              sasURLs={sasURLs}
            />

            <CoursesSection
              title="Recommended for You"
              courses={formatCourseData(recommendedCourses || [])}
              emptyMessage="No Recommendations Yet"
              icon="star"
              isRecommended={true}
              sasURLs={sasURLs}
            />
          </div>
        </main>
      </div>
    </>
  );
}
