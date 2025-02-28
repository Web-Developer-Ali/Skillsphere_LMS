import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnection from "@/lib/dbConnect";
import sql from "mssql";
import { deleteBlob } from "@/lib/azure-blob-storage";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("id");
  const InstructorID = searchParams.get("InstructorID");
  const ThumbnailPublicID = searchParams.get("ThumbnailPublicID");
  // Check if the user is authenticated
  if (
    !session ||
    !session.user ||
    !session.user.id ||
    Number(InstructorID) !== session.user.id
  ) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    await dbConnection();

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

    // Check if the course belongs to the authenticated instructor
    const checkCourseQuery = `
      SELECT CourseID FROM Courses
      WHERE CourseID = @courseId AND InstructorID = @userId
    `;

    const checkCourseRequest = new sql.Request();
    checkCourseRequest.input("courseId", sql.Int, Number(courseId));
    checkCourseRequest.input("userId", sql.Int, userId);
    const checkCourseResult = await checkCourseRequest.query(checkCourseQuery);

    if (checkCourseResult.recordset.length === 0) {
      return NextResponse.json(
        { error: "Course not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if there are any chapters associated with the course
    const checkChaptersQuery = `
      SELECT ChapterID FROM Courses_Chapters
      WHERE CourseID = @courseId
    `;

    const checkChaptersRequest = new sql.Request();
    checkChaptersRequest.input("courseId", sql.Int, Number(courseId));
    const checkChaptersResult = await checkChaptersRequest.query(
      checkChaptersQuery
    );

    if (checkChaptersResult.recordset.length > 0) {
      return NextResponse.json(
        { error: "Please delete all chapters before deleting the course." },
        { status: 400 }
      );
    }

    if (ThumbnailPublicID) {
      await deleteBlob(ThumbnailPublicID, false);
    } else {
      return NextResponse.json(
        { error: "Failed to delete course Thumnail image.Try Again" },
        { status: 500 }
      );
    }

    // Delete the course
    const deleteQuery = `
      DELETE FROM Courses
      WHERE CourseID = @courseId AND InstructorID = @userId
    `;

    const deleteRequest = new sql.Request();
    deleteRequest.input("courseId", sql.Int, Number(courseId));
    deleteRequest.input("userId", sql.Int, userId);
    const deleteResult = await deleteRequest.query(deleteQuery);

    // Check if the course was deleted
    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { error: "Failed to delete course" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { success: true, message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
