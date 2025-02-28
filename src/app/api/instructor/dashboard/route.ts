import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import sql from "mssql";
import connectToDatabase from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get session data
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated and has the role of 'Instructor'
    if (!session || !session.user || session.user.role !== "Instructor") {
      return NextResponse.json(
        { error: "Unauthorized", message: "Access restricted to instructors only." },
        { status: 401 }
      );
    }

    const instructorId = session.user.id;

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
      pool.request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT 
            c.Title AS title,
            COUNT(u.UserID) AS students,
            c.Fees AS fees,
            c.Rating AS rating
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID AND u.UserType = 'Student'
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Title, c.Fees, c.Rating
        `),

      // Query for total students count
      pool.request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT COUNT(DISTINCT u.UserID) AS total_students
          FROM Users u
          JOIN EnrolledCourses e ON e.UserID = u.UserID
          WHERE u.UserType = 'Student' AND e.CourseID IN (
            SELECT CourseID FROM Courses WHERE InstructorID = @instructorId
          )
        `),

      // Query for total courses count
      pool.request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT COUNT(*) AS total_courses
          FROM Courses
          WHERE InstructorID = @instructorId
        `),

      // Query for total revenue and average rating
      pool.request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT 
            c.Fees, 
            c.Rating, 
            COUNT(u.UserID) AS students_count
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Fees, c.Rating
        `),

      // Query for revenue by month
      pool.request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT 
            c.Title AS title,
            c.Fees AS fees,
            COUNT(u.UserID) AS students_count,
            FORMAT(c.CreatedAt, 'yyyy-MM') AS month_year
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID AND u.UserType = 'Student'
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Title, c.Fees, FORMAT(c.CreatedAt, 'yyyy-MM')
        `),

      // Query for revenue by course name
      pool.request()
        .input("instructorId", sql.Int, instructorId)
        .query(`
          SELECT 
            c.Title AS title,
            c.Fees AS fees,
            COUNT(u.UserID) AS students_count
          FROM Courses c
          LEFT JOIN EnrolledCourses e ON e.CourseID = c.CourseID
          LEFT JOIN Users u ON u.UserID = e.UserID AND u.UserType = 'Student'
          WHERE c.InstructorID = @instructorId
          GROUP BY c.Title, c.Fees
        `),

      // Query for courses for students
      pool.request()
        .input("InstructorID", sql.Int, instructorId)
        .query(`
          SELECT CourseID, Title FROM Courses
          WHERE InstructorID = @InstructorID
        `),
    ]);

    // Process courses data
    const courses = coursesResult.recordset.map((course) => ({
      name: course.title,
      students: course.students,
      revenue: course.fees * course.students,
      rating: course.rating,
    }));

    // Process overview data
    const totalStudents = totalStudentsResult.recordset[0].total_students;
    const totalCourses = totalCoursesResult.recordset[0].total_courses;

    let totalRevenue = 0;
    let totalRating = 0;
    let totalCoursesCount = 0;

    revenueAndRatingResult.recordset.forEach((course) => {
      totalRevenue += course.Fees * course.students_count;
      totalRating += course.Rating;
      totalCoursesCount++;
    });

    const averageRating = totalCoursesCount > 0 ? totalRating / totalCoursesCount : 0;

    // Process revenue data
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

    // Process students data
    const courseIds = coursesForStudentsResult.recordset
      .map((course) => course.CourseID)
      .join(",");

    const recentEnrollmentsQuery = `
      DECLARE @CourseIds NVARCHAR(MAX) = '${courseIds}';
      EXEC('
        SELECT u.FullName, u.AvatarSecureURL, ec.CourseID
        FROM Users u
        INNER JOIN EnrolledCourses ec ON u.UserID = ec.UserID
        WHERE u.UserType = ''Student'' AND ec.CourseID IN (' + @CourseIds + ')
        ORDER BY u.CreatedAt DESC
        OFFSET 0 ROWS
        FETCH NEXT 5 ROWS ONLY
      ');
    `;

    const recentEnrollmentsResult = await pool.request().query(recentEnrollmentsQuery);

    const enrollmentData = await Promise.all(
      recentEnrollmentsResult.recordset.map(async (student) => {
        const enrolledCourseResult = await pool
          .request()
          .input("CourseID", sql.Int, student.CourseID)
          .query(`
            SELECT Title FROM Courses
            WHERE CourseID = @CourseID
          `);

        const courseName = enrolledCourseResult.recordset.length
          ? enrolledCourseResult.recordset[0].Title
          : "Unknown Course";

        return {
          name: student.FullName,
          avatar: student.AvatarSecureURL || null,
          courses: [courseName],
        };
      })
    );

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
  } catch (error) {
    console.error("Error in merged API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch data." },
      { status: 500 }
    );
  }
}