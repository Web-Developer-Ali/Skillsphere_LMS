// app/(pages)/instructor/dashboard/page.tsx
import { DashboardData } from "@/types/dashboard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import sql from "mssql";
import InstructorDashboard from "./InstructorDashboard";
import connectToDatabase from "@/lib/dbConnect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RetryButton from "./RetryButton";

export const dynamic = "force-dynamic";

// Server-side function to fetch dashboard data
async function getDashboardData(): Promise<DashboardData | { error: string }> {
  try {
    // Get session data
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
      pool
        .request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT c.Title AS title, COUNT(u.UserID) AS students, c.Fees AS fees, c.Rating AS rating
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID AND u.UserType = 'Student'
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Title, c.Fees, c.Rating
        `),

      pool
        .request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT COUNT(DISTINCT u.UserID) AS total_students
          FROM Users u
          JOIN EnrolledCourses e ON e.UserID = u.UserID
          WHERE u.UserType = 'Student' AND e.CourseID IN 
          (SELECT CourseID FROM Courses WHERE InstructorID = @instructorId)
        `),

      pool
        .request()
        .input("instructorId", sql.Int, instructorId)
        .query(`SELECT COUNT(*) AS total_courses FROM Courses WHERE InstructorID = @instructorId`),

      pool
        .request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT c.Fees, c.Rating, COUNT(u.UserID) AS students_count
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Fees, c.Rating
        `),

      pool
        .request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT c.Title AS title, c.Fees AS fees, COUNT(u.UserID) AS students_count, 
          FORMAT(c.CreatedAt, 'yyyy-MM') AS month_year
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID AND u.UserType = 'Student'
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Title, c.Fees, FORMAT(c.CreatedAt, 'yyyy-MM')
        `),

      pool
        .request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT c.Title AS title, c.Fees AS fees, COUNT(u.UserID) AS students_count
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID AND u.UserType = 'Student'
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Title, c.Fees
        `),

      pool
        .request()
        .input("instructorId", sql.Int, instructorId)
        .query(`SELECT CourseID, Title FROM Courses WHERE InstructorID = @instructorId`),
    ]);

    const courses = coursesResult.recordset.map((course) => ({
      name: course.title,
      students: course.students,
      revenue: course.fees * course.students,
      rating: course.rating,
    }));

    const totalStudents = totalStudentsResult.recordset[0]?.total_students || 0;
    const totalCourses = totalCoursesResult.recordset[0]?.total_courses || 0;

    let totalRevenue = 0,
      totalRating = 0,
      totalCoursesCount = 0;

    revenueAndRatingResult.recordset.forEach((course) => {
      totalRevenue += course.Fees * course.students_count;
      totalRating += course.Rating;
      totalCoursesCount++;
    });

    const averageRating = totalCoursesCount > 0 ? totalRating / totalCoursesCount : 0;

    const revenueByMonth: Record<string, number> = {};

    revenueByMonthResult.recordset.forEach((course) => {
      const monthYear = course.month_year;
      const revenue = course.fees * course.students_count;
      revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + revenue;
    });

    const revenueOverTime = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    const revenueByCourseName = revenueByCourseResult.recordset.map((course) => ({
      name: course.title,
      revenue: course.fees * course.students_count,
    }));

    const courseIds = coursesForStudentsResult.recordset.map((course) => course.CourseID);

    if (courseIds.length === 0) {
      return {
        courses,
        overview: { totalStudents, totalCourses, totalRevenue, averageRating },
        revenue: { revenueOverTime, revenueByCourse: revenueByCourseName },
        students: [],
      };
    }

    const recentEnrollmentsResult = await pool
      .request()
      .query(`
        SELECT u.FullName, u.AvatarSecureURL, ec.CourseID, c.Title AS CourseTitle
        FROM Users u
        INNER JOIN EnrolledCourses ec ON u.UserID = ec.UserID
        INNER JOIN Courses c ON ec.CourseID = c.CourseID
        WHERE u.UserType = 'Student' AND ec.CourseID IN (${courseIds.join(",")})
        ORDER BY u.CreatedAt DESC
        OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
      `);

    const enrollmentData = recentEnrollmentsResult.recordset.map((student) => ({
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

// Error Card Component
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