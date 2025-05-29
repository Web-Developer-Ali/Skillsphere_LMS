import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectToDatabase from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { headers } from "next/headers";
import { ratelimit } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

type Enrollment = {
  name: string;
  avatar: string | null;
  courses: string[];
};

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

    // Get session data
    const session = await getServerSession(authOptions);
    // Check if the user is authenticated and has the role of 'Instructor'
    if (!session || !session.user || session.user.role !== "Instructor") {
      return NextResponse.json(
        { error: "Unauthorized", message: "Access restricted to instructors only." },
        { status: 401 }
      );
    }

    const instructorId = parseInt(session.user.id, 10);
    if (isNaN(instructorId)) {
      return NextResponse.json(
        { error: "Invalid instructor ID" },
        { status: 400 }
      );
    }

    // Connect to the database
    const pool = await connectToDatabase();

    // Fetch all required data in parallel
    const [
      coursesResult,
      totalStudentsResult,
      totalCoursesResult,
      revenueAndRatingResult,
      revenueByMonthResult,
      revenueByCourseResult,
      coursesForStudentsResult,
    ] = await Promise.all([
      // Query for courses data
      pool.query(`
        SELECT 
          c."Title" AS title,
          COUNT(u."UserID") AS students,
          c."Fees" AS fees,
          c."Rating" AS rating
        FROM "Courses" c
        LEFT JOIN "EnrolledCourses" e ON e."CourseID" = c."CourseID"
        LEFT JOIN "Users" u ON u."UserID" = e."UserID" AND u."UserType" = 'Student'
        WHERE c."InstructorID" = $1
        GROUP BY c."Title", c."Fees", c."Rating"
      `, [instructorId]),

      // Query for total students count
      pool.query(`
        SELECT COUNT(DISTINCT u."UserID") AS total_students
        FROM "Users" u
        JOIN "EnrolledCourses" e ON e."UserID" = u."UserID"
        WHERE u."UserType" = 'Student' AND e."CourseID" IN (
          SELECT "CourseID" FROM "Courses" WHERE "InstructorID" = $1
        )
      `, [instructorId]),

      // Query for total courses count
      pool.query(`
        SELECT COUNT(*) AS total_courses
        FROM "Courses"
        WHERE "InstructorID" = $1
      `, [instructorId]),

      // Query for total revenue and average rating
      pool.query(`
        SELECT 
          c."Fees" AS fees, 
          c."Rating" AS rating, 
          COUNT(u."UserID") AS students_count
        FROM "Courses" c
        LEFT JOIN "EnrolledCourses" e ON e."CourseID" = c."CourseID"
        LEFT JOIN "Users" u ON u."UserID" = e."UserID"
        WHERE c."InstructorID" = $1
        GROUP BY c."Fees", c."Rating"
      `, [instructorId]),

      // Query for revenue by month
      pool.query(`
        SELECT 
          c."Title" AS title,
          c."Fees" AS fees,
          COUNT(u."UserID") AS students_count,
          TO_CHAR(c."CreatedAt", 'YYYY-MM') AS month_year
        FROM "Courses" c
        LEFT JOIN "EnrolledCourses" e ON e."CourseID" = c."CourseID"
        LEFT JOIN "Users" u ON u."UserID" = e."UserID" AND u."UserType" = 'Student'
        WHERE c."InstructorID" = $1
        GROUP BY c."Title", c."Fees", TO_CHAR(c."CreatedAt", 'YYYY-MM')
      `, [instructorId]),

      // Query for revenue by course name
      pool.query(`
        SELECT 
          c."Title" AS title,
          c."Fees" AS fees,
          COUNT(u."UserID") AS students_count
        FROM "Courses" c
        LEFT JOIN "EnrolledCourses" e ON e."CourseID" = c."CourseID"
        LEFT JOIN "Users" u ON u."UserID" = e."UserID" AND u."UserType" = 'Student'
        WHERE c."InstructorID" = $1
        GROUP BY c."Title", c."Fees"
      `, [instructorId]),

      // Query for courses for students
      pool.query(`
        SELECT "CourseID", "Title" FROM "Courses"
        WHERE "InstructorID" = $1
      `, [instructorId]),
    ]);

    // Process courses data
    const courses = coursesResult.rows.map((course) => ({
      name: course.title,
      students: parseInt(course.students, 10),
      revenue: parseFloat(course.fees) * parseInt(course.students, 10),
      rating: parseFloat(course.rating),
    }));

    // Process overview data
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.total_students || 0, 10);
    const totalCourses = parseInt(totalCoursesResult.rows[0]?.total_courses || 0, 10);

    let totalRevenue = 0;
    let totalRating = 0;
    let totalCoursesCount = 0;

    revenueAndRatingResult.rows.forEach((course) => {
      totalRevenue += parseFloat(course.fees) * parseInt(course.students_count, 10);
      totalRating += parseFloat(course.rating);
      totalCoursesCount++;
    });

    const averageRating = totalCoursesCount > 0 ? totalRating / totalCoursesCount : 0;

    // Process revenue data
    const revenueByMonth: Record<string, number> = {};

    revenueByMonthResult.rows.forEach((course) => {
      const monthYear = course.month_year;
      const revenue = parseFloat(course.fees) * parseInt(course.students_count, 10);
      revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + revenue;
    });

    const revenueOverTime = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    const revenueByCourseName = revenueByCourseResult.rows.map((course) => ({
      name: course.title,
      revenue: parseFloat(course.fees) * parseInt(course.students_count, 10),
    }));

    // Process students data
    const courseIds = coursesForStudentsResult.rows.map((course) => course.CourseID);

    let enrollmentData: Enrollment[] = [];
    if (courseIds.length > 0) {
      // Using ANY with array parameter for IN-like queries
      const recentEnrollmentsResult = await pool.query(`
        SELECT u."FullName", u."AvatarSecureURL", ec."CourseID"
        FROM "Users" u
        INNER JOIN "EnrolledCourses" ec ON u."UserID" = ec."UserID"
        WHERE u."UserType" = 'Student' 
        AND ec."CourseID" = ANY($1::int[])
        ORDER BY u."CreatedAt" DESC
        LIMIT 5
      `, [courseIds]);

      enrollmentData = await Promise.all(
        recentEnrollmentsResult.rows.map(async (student) => {
          const enrolledCourseResult = await pool.query(`
            SELECT "Title" FROM "Courses"
            WHERE "CourseID" = $1
          `, [student.CourseID]);

          const courseName = enrolledCourseResult.rows.length
            ? enrolledCourseResult.rows[0].Title
            : "Unknown Course";

          return {
            name: student.FullName,
            avatar: student.AvatarSecureURL || null,
            courses: [courseName],
          };
        })
      );
    }

    // Return the combined data
    return NextResponse.json({
      courses,
      overview: {
        totalStudents,
        totalCourses,
        totalRevenue,
        averageRating,
      },
      revenue: {
        revenueOverTime,
        revenueByCourse: revenueByCourseName,
      },
      students: enrollmentData,
    });
  } catch (error: unknown) {
    console.error("Error in instructor dashboard API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch dashboard data.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }

}