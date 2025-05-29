export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redis } from "@/lib/redis";
import { DashboardResponse } from "@/types/dashboard";
import { Pool } from 'pg';
import { ratelimit } from "@/lib/rateLimiter";
import { headers } from "next/headers";

// Constants
const CACHE_TTL = 60 * 30; // 30 minutes cache TTL
const CACHE_VERSION = 2; // Cache version for schema changes
const RECOMMENDATIONS_LIMIT = 6;

// Predefined queries
const QUERIES = {
  STATS: `
    SELECT 
      COUNT(*) AS "enrolledCourseCount",
      COALESCE(SUM("TotalLearningHours"), 0) AS "totalLearningHours"
    FROM "EnrolledCourses"
    WHERE "UserID" = $1
  `,
  RECENT_COURSES: `
    SELECT
      c."CourseID",
      c."Title",
      c."ThumbnailPublicID",
      ec."EnrollmentDate",
      (
        SELECT COUNT(*) 
        FROM "Courses_Chapters" cc 
        WHERE cc."CourseID" = c."CourseID"
      ) AS "totalChapters"
    FROM "EnrolledCourses" ec
    JOIN "Courses" c ON ec."CourseID" = c."CourseID"
    WHERE ec."UserID" = $1
    ORDER BY ec."EnrollmentDate" DESC
  `,
  CERTIFICATIONS: `
    SELECT COUNT(*) AS "certificationCount"
    FROM "Certifications"
    WHERE "UserID" = $1
  `,
  USER_DETAILS: `
    SELECT "DesireRole" FROM "Users" WHERE "UserID" = $1
  `,
  ENROLLED_COURSES: `
    SELECT "CourseID" FROM "EnrolledCourses" WHERE "UserID" = $1
  `,
  COURSE_PROGRESS: `
    SELECT 
      cp."CourseID",
      COUNT(DISTINCT cp."ChapterID") FILTER (WHERE cp."IsCompleted" = true) AS "completedChapters"
    FROM "CourseProgress" cp
    WHERE cp."UserID" = $1 AND cp."CourseID" = ANY($2::int[])
    GROUP BY cp."CourseID"
  `,
  CHAPTER_DETAILS: `
    SELECT
      cc."ChapterID",
      cc."Title" as "chapterTitle",
      cc."ChapterCount" as "position",
      COALESCE(cp."IsCompleted", false) as "isCompleted",
      cp."LastAccessed"
    FROM "Courses_Chapters" cc
    LEFT JOIN "CourseProgress" cp ON 
      cc."ChapterID" = cp."ChapterID" AND
      cp."UserID" = $1 AND
      cp."CourseID" = $2
    WHERE cc."CourseID" = $2
    ORDER BY cc."ChapterCount" ASC
  `,
  RECOMMENDATIONS_BY_ROLE: (hasEnrolledCourses: boolean) => `
    SELECT 
      c."CourseID", c."Title", c."Category", 
      c."DifficultyLevel", c."Fees", c."Rating", c."ThumbnailPublicID"
    FROM "Courses" c
    WHERE c."Status" = 'published'
      AND (LOWER(c."Title") LIKE LOWER($1))
      ${hasEnrolledCourses ? 'AND NOT (c."CourseID" = ANY($2::int[]))' : ''}
    ORDER BY c."Rating" DESC
    LIMIT ${RECOMMENDATIONS_LIMIT}
  `,
  FALLBACK_RECOMMENDATIONS: (hasEnrolledCourses: boolean) => `
    SELECT 
      c."CourseID", c."Title", c."Category", 
      c."DifficultyLevel", c."Fees", c."Rating", c."ThumbnailPublicID"
    FROM "Courses" c
    WHERE c."Status" = 'published'
      ${hasEnrolledCourses ? 'AND NOT (c."CourseID" = ANY($1::int[]))' : ''}
    ORDER BY c."Rating" DESC
    LIMIT ${RECOMMENDATIONS_LIMIT}
  `
};

// Enhanced cache validation
function isValidDashboardResponse(data: unknown): data is DashboardResponse {
  if (!data || typeof data !== 'object') return false;

  return (
    typeof (data as DashboardResponse).enrolledCourseCount === 'number' &&
    typeof (data as DashboardResponse).totalLearningHours === 'number' &&
    typeof (data as DashboardResponse).certificationCount === 'number' &&
    Array.isArray((data as DashboardResponse).recentEnrolledCourses) &&
    (!(data as DashboardResponse).recommendedCourses || Array.isArray((data as DashboardResponse).recommendedCourses)) &&
    (!(data as DashboardResponse).recommendationsBasedOn || typeof (data as DashboardResponse).recommendationsBasedOn === 'string')
  );
}

export async function GET() {
  try {

    // Rate limiting check
    const ip = headers().get('x-forwarded-for') ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "Student") {
      return NextResponse.json(
        { error: "Unauthorized", message: "Access restricted to students only." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const cacheKey = `dashboard:v${CACHE_VERSION}:${userId}`;

    // Improved cache handling
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try {
          const parsedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
          if (isValidDashboardResponse(parsedData)) {
            return NextResponse.json(parsedData);
          }
          console.warn("Invalid cached data structure - purging");
          await redis.del(cacheKey).catch(() => { });
        } catch (parseError) {
          console.error("Cache parse error:", parseError);
          await redis.del(cacheKey).catch(() => { });
        }
      }
    } catch (cacheError) {
      console.error("Cache access error:", cacheError);
    }

    const pool = await connectToDatabase();

    // Execute all parallel queries
    const [
      statsResult,
      recentCoursesResult,
      certificationResult,
      userResult,
      enrolledCoursesResult
    ] = await Promise.all([
      pool.query(QUERIES.STATS, [userId]),
      pool.query(QUERIES.RECENT_COURSES, [userId]),
      pool.query(QUERIES.CERTIFICATIONS, [userId]),
      pool.query(QUERIES.USER_DETAILS, [userId]),
      pool.query(QUERIES.ENROLLED_COURSES, [userId])
    ]);

    // Process data
    const recentCourseIds = recentCoursesResult.rows.map((c) => c.CourseID);
    const enrolledCourseIds = enrolledCoursesResult.rows.map((row) => row.CourseID);
    const desireRole = userResult.rows[0]?.DesireRole;

    const [courseProgressResult, recommendations] = await Promise.all([
      recentCourseIds.length > 0
        ? pool.query(QUERIES.COURSE_PROGRESS, [userId, recentCourseIds])
        : { rows: [] },
      getRecommendations(pool, desireRole, enrolledCourseIds)
    ]);

    // Build course progress map
    const courseProgressMap: Record<number, { completedChapters: number }> = {};
    for (const row of courseProgressResult.rows) {
      courseProgressMap[row.CourseID] = {
        completedChapters: parseInt(row.completedChapters),
      };
    }

    // Get detailed chapter progress for each course
    const coursesWithDetails = await Promise.all(
      recentCoursesResult.rows.map(async (course) => {
        const { rows: chapterDetails } = await pool.query(
          QUERIES.CHAPTER_DETAILS,
          [userId, course.CourseID]
        );

        const completed = courseProgressMap[course.CourseID]?.completedChapters || 0;
        const total = parseInt(course.totalChapters) || 1;
        const progressPercent = Math.min(Math.round((completed / total) * 100), 100);

        return {
          ...course,
          Progress: progressPercent,
          CompletedChapters: completed,
          TotalChapters: total,
          ChapterDetails: chapterDetails.map(chapter => ({
            chapterId: chapter.ChapterID,
            title: chapter.chapterTitle,
            position: chapter.position,
            isCompleted: chapter.isCompleted,
            lastAccessed: chapter.LastAccessed ? new Date(chapter.LastAccessed).toISOString() : null
          }))
        };
      })
    );

    // Build response
    const responseData: DashboardResponse = {
      enrolledCourseCount: parseInt(statsResult.rows[0]?.enrolledCourseCount || "0"),
      totalLearningHours: parseInt(statsResult.rows[0]?.totalLearningHours || "0"),
      recentEnrolledCourses: coursesWithDetails,
      certificationCount: parseInt(certificationResult.rows[0]?.certificationCount || "0"),
      ...recommendations
    };

    // Cache the response
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), { ex: CACHE_TTL });
    } catch (cacheError) {
      console.error("Cache write error:", cacheError);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function getRecommendations(
  pool: Pool,
  desireRole: string | undefined,
  enrolledCourseIds: number[]
): Promise<Pick<DashboardResponse, "recommendedCourses" | "recommendationsBasedOn">> {
  if (!desireRole) return {};

  try {
    const hasEnrolledCourses = enrolledCourseIds.length > 0;
    const params: (string | number | number[])[] = [`%${desireRole}%`];
    if (hasEnrolledCourses) params.push(enrolledCourseIds);

    const recommendationsResult = await pool.query(
      QUERIES.RECOMMENDATIONS_BY_ROLE(hasEnrolledCourses),
      params
    );

    if (recommendationsResult.rows.length > 0) {
      return {
        recommendedCourses: recommendationsResult.rows,
        recommendationsBasedOn: `your desired role: ${desireRole}`
      };
    }

    // Fallback to popular courses
    const fallbackParams = hasEnrolledCourses ? [enrolledCourseIds] : [];
    const fallbackResult = await pool.query(
      QUERIES.FALLBACK_RECOMMENDATIONS(hasEnrolledCourses),
      fallbackParams
    );

    if (fallbackResult.rows.length > 0) {
      return {
        recommendedCourses: fallbackResult.rows,
        recommendationsBasedOn: "popular courses"
      };
    }
  } catch (error) {
    console.error("Error fetching recommendations:", error);
  }

  return {};
}