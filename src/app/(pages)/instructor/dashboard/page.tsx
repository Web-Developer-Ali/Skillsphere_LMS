// app/(pages)/instructor/dashboard/page.tsx
import { DashboardData } from "@/types/dashboard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import InstructorDashboard from "./InstructorDashboard";
import connectToDatabase from "@/lib/dbConnect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RetryButton from "./RetryButton";

export const dynamic = "force-dynamic";

async function getDashboardData(): Promise<DashboardData | { error: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "Instructor") {
      return { error: "Unauthorized access. Please log in as an instructor." };
    }

    const instructorId = session.user.id;
    const pool = await connectToDatabase();

    const [
      coursesResult,
      totalStudentsResult,
      totalCoursesResult,
      revenueAndRatingResult,
      revenueByMonthResult,
      revenueByCourseResult,
      coursesForStudentsResult,
    ] = await Promise.all([
      pool.query(`
        SELECT c."Title" AS title, COUNT(u."UserID") AS students, c."Fees" AS fees, c."Rating" AS rating
        FROM "Courses" c
        LEFT JOIN "EnrolledCourses" e ON e."CourseID" = c."CourseID"
        LEFT JOIN "Users" u ON u."UserID" = e."UserID" AND u."UserType" = 'Student'
        WHERE c."InstructorID" = $1
        GROUP BY c."Title", c."Fees", c."Rating"
      `, [instructorId]),

      pool.query(`
        SELECT COUNT(DISTINCT u."UserID") AS total_students
        FROM "Users" u
        JOIN "EnrolledCourses" e ON e."UserID" = u."UserID"
        WHERE u."UserType" = 'Student' AND e."CourseID" IN 
        (SELECT "CourseID" FROM "Courses" WHERE "InstructorID" = $1)
      `, [instructorId]),

      pool.query(
        `SELECT COUNT(*) AS total_courses FROM "Courses" WHERE "InstructorID" = $1`,
        [instructorId]
      ),

      pool.query(`
        SELECT c."Fees", c."Rating", COUNT(u."UserID") AS students_count
        FROM "Courses" c
        LEFT JOIN "EnrolledCourses" e ON e."CourseID" = c."CourseID"
        LEFT JOIN "Users" u ON u."UserID" = e."UserID"
        WHERE c."InstructorID" = $1
        GROUP BY c."Fees", c."Rating"
      `, [instructorId]),

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

      pool.query(
        `SELECT "CourseID", "Title" FROM "Courses" WHERE "InstructorID" = $1`,
        [instructorId]
      ),
    ]);

    const courses = coursesResult.rows.map((course) => ({
      name: course.title,
      students: course.students,
      revenue: course.fees * course.students,
      rating: course.rating,
    }));

    const totalStudents = totalStudentsResult.rows[0]?.total_students || 0;
    const totalCourses = totalCoursesResult.rows[0]?.total_courses || 0;

    let totalRevenue = 0,
      totalRating = 0,
      totalCoursesCount = 0;

    revenueAndRatingResult.rows.forEach((course) => {
      totalRevenue += course.Fees * course.students_count;
      totalRating += course.Rating;
      totalCoursesCount++;
    });

    const averageRating = totalCoursesCount > 0 ? totalRating / totalCoursesCount : 0;

    const revenueByMonth: Record<string, number> = {};

    revenueByMonthResult.rows.forEach((course) => {
      const monthYear = course.month_year;
      const revenue = course.fees * course.students_count;
      revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + revenue;
    });

    const revenueOverTime = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    const revenueByCourseName = revenueByCourseResult.rows.map((course) => ({
      name: course.title,
      revenue: course.fees * course.students_count,
    }));

    const courseIds = coursesForStudentsResult.rows.map((course) => course.CourseID);

    if (courseIds.length === 0) {
      return {
        courses,
        overview: { totalStudents, totalCourses, totalRevenue, averageRating },
        revenue: { revenueOverTime, revenueByCourse: revenueByCourseName },
        students: [],
      };
    }

    const recentEnrollmentsResult = await pool.query(`
      SELECT u."FullName", u."AvatarSecureURL", ec."CourseID", c."Title" AS "CourseTitle"
      FROM "Users" u
      INNER JOIN "EnrolledCourses" ec ON u."UserID" = ec."UserID"
      INNER JOIN "Courses" c ON ec."CourseID" = c."CourseID"
      WHERE u."UserType" = 'Student' AND ec."CourseID" IN (${courseIds.join(",")})
      ORDER BY u."CreatedAt" DESC
      LIMIT 5
    `);

    const enrollmentData = recentEnrollmentsResult.rows.map((student) => ({
      name: student.FullName,
      avatar: student.AvatarSecureURL || null,
      courseName: student.CourseTitle,
    }));

    return {
      courses,
      overview: { totalStudents, totalCourses, totalRevenue, averageRating },
      revenue: { revenueOverTime, revenueByCourse: revenueByCourseName },
      students: enrollmentData,
    };
  } catch (error) {
    console.error("Error in fetching dashboard data:", error);
    return { error: "Failed to fetch dashboard data. Please try again later." };
  }
}

function ErrorCard({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 bg-card dark:bg-gray-800 rounded-lg shadow-lg text-center">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-2 dark:text-white">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground dark:text-gray-300 mb-6">{error}</p>
          {onRetry && <RetryButton onClick={onRetry} />}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function Page() {
  const initialData = await getDashboardData();

  if ("error" in initialData) {
    return <ErrorCard error={initialData.error} />;
  }

  return <InstructorDashboard initialData={initialData} />;
}