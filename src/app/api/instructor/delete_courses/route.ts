import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";
import { deleteBlob } from "@/lib/azure-blob-storage";
import { headers } from "next/headers";
import { ratelimit } from "@/lib/rateLimiter";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("id");
  const InstructorID = searchParams.get("InstructorID");
  const ThumbnailPublicID = searchParams.get("ThumbnailPublicID");

  // Check authentication
  if (
    !session ||
    !session.user ||
    !session.user.id ||
    Number(InstructorID) !== Number(session.user.id)
  ) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let pool;
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

    pool = await connectToDatabase();
    const userId = parseInt(session.user.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid instructor ID" },
        { status: 400 }
      );
    }

    // Validate courseId
    if (!courseId || isNaN(Number(courseId))) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // Check course ownership
    const checkCourseQuery = `
      SELECT "CourseID" FROM "Courses"
      WHERE "CourseID" = $1 AND "InstructorID" = $2
    `;
    const checkCourseResult = await pool.query(checkCourseQuery, [
      Number(courseId),
      userId
    ]);

    if (checkCourseResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Course not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check for chapters
    const checkChaptersQuery = `
      SELECT "ChapterID" FROM "Courses_Chapters"
      WHERE "CourseID" = $1
    `;
    const checkChaptersResult = await pool.query(checkChaptersQuery, [
      Number(courseId)
    ]);

    if (checkChaptersResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Please delete all chapters before deleting the course." },
        { status: 400 }
      );
    }

    // Check for enrollments
    const checkEnrollmentsQuery = `
      SELECT "UserID" FROM "EnrolledCourses"
      WHERE "CourseID" = $1
      LIMIT 1
    `;
    const checkEnrollmentsResult = await pool.query(checkEnrollmentsQuery, [
      Number(courseId)
    ]);

    if (checkEnrollmentsResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with enrolled students." },
        { status: 400 }
      );
    }


    // Delete thumbnail if exists
    if (ThumbnailPublicID) {
      try {
        await deleteBlob(ThumbnailPublicID, false);
      } catch (blobError) {
        console.error("Error deleting thumbnail:", blobError);
        return NextResponse.json(
          { error: "Failed to delete course thumbnail image" },
          { status: 500 }
        );
      }
    }

    // Start transaction for atomic operations
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First delete all enrollments for this course
      const deleteEnrollmentsQuery = `
        DELETE FROM "EnrolledCourses"
        WHERE "CourseID" = $1
      `;
      await client.query(deleteEnrollmentsQuery, [Number(courseId)]);

      // Then delete the course
      const deleteCourseQuery = `
        DELETE FROM "Courses"
        WHERE "CourseID" = $1 AND "InstructorID" = $2
      `;
      const deleteResult = await client.query(deleteCourseQuery, [
        Number(courseId),
        userId
      ]);

      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: "Failed to delete course" },
          { status: 500 }
        );
      }

      await client.query('COMMIT');

      return NextResponse.json(
        { success: true, message: "Course deleted successfully" },
        { status: 200 }
      );
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error deleting course:", error);
    return NextResponse.json(
      {
        error: "Failed to delete course",
        details: message
      },
      { status: 500 }
    );
  }

}