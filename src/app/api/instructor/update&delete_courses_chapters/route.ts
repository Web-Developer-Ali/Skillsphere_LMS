import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { deleteBlob } from "@/lib/azure-blob-storage";
import { ratelimit } from "@/lib/rateLimiter";
import { headers } from "next/headers";

export async function DELETE(req: NextRequest) {
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

    // Step 1: Check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Step 2: Get the chapterId from the query parameters
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");

    if (!chapterId) {
      return NextResponse.json(
        { success: false, message: "Chapter ID is required" },
        { status: 400 }
      );
    }

    // Step 3: Connect to the database
    const pool = await connectToDatabase();

    // Step 4: Check if the authenticated user is the instructor of the course
    const checkInstructorQuery = `
      SELECT c."InstructorID"
      FROM "Courses_Chapters" cc
      INNER JOIN "Courses" c ON cc."CourseID" = c."CourseID"
      WHERE cc."ChapterID" = $1
    `;
    const instructorResult = await pool.query(checkInstructorQuery, [parseInt(chapterId)]);

    if (instructorResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Chapter not found" },
        { status: 404 }
      );
    }

    const instructorId = instructorResult.rows[0].InstructorID;

    // Step 5: Compare session user ID with the instructor ID
    if (Number(session.user.id) !== instructorId) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to delete this chapter" },
        { status: 403 }
      );
    }

    // Step 6: Get the list of blobs associated with the chapter
    const getBlobsQuery = `
      SELECT "BlobName"
      FROM "ChapterFiles"
      WHERE "ChapterID" = $1
    `;
    const blobsResult = await pool.query(getBlobsQuery, [parseInt(chapterId)]);
    const blobNames = blobsResult.rows.map((row) => row.BlobName);

    // Step 7: Delete the blobs from Azure Storage
    if (blobNames.length > 0) {
      await deleteBlob(blobNames, true); // true indicates video deletion
    }

    // Step 8: Delete associated files from the ChapterFiles table FIRST
    const deleteFilesQuery = `
      DELETE FROM "ChapterFiles"
      WHERE "ChapterID" = $1
    `;
    await pool.query(deleteFilesQuery, [parseInt(chapterId)]);

    // Step 9: Delete the chapter thumbnail from blob container
    const checkCourseQuery = `
  SELECT "Thumbnail" 
  FROM "Courses_Chapters"
  WHERE "ChapterID" = $1
`;
    const checkCourseResult = await pool.query(checkCourseQuery, [chapterId]);
    if (checkCourseResult.rows[0]?.Thumbnail) {
      await deleteBlob(checkCourseResult.rows[0].Thumbnail, false);
    }

    // Step 10: Delete the chapter from the Courses_Chapters table
    const deleteChapterQuery = `
      DELETE FROM "Courses_Chapters"
      WHERE "ChapterID" = $1
    `;
    await pool.query(deleteChapterQuery, [parseInt(chapterId)]);

    return NextResponse.json(
      { success: true, message: "Chapter, associated files, and blobs deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE API:", error);
    return NextResponse.json(
      { success: false, message: error || "Internal Server Error" },
      { status: 500 }
    );
  }
}



export async function PUT(req: NextRequest) {
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
    // Step 1: Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Step 2: Get request data
    const data = await req.json();
    const { courseId, chapters } = data;

    if (!courseId || !chapters || !Array.isArray(chapters)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Step 3: Connect to database
    const pool = await connectToDatabase();

    // Step 4: Verify instructor ownership
    const checkInstructorQuery = `
      SELECT "InstructorID"
      FROM "Courses"
      WHERE "CourseID" = $1
    `;
    const instructorResult = await pool.query(checkInstructorQuery, [parseInt(courseId)]);

    if (instructorResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 }
      );
    }

    if (instructorResult.rows[0].InstructorID !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Not authorized to modify this course" },
        { status: 403 }
      );
    }

    // Step 5: Start transaction for updating chapter positions
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update each chapter's position
      for (const chapter of chapters) {
        const updateQuery = `
          UPDATE "Courses_Chapters" 
          SET 
            "ChapterCount" = $1,
            "UpdatedAt" = NOW()
          WHERE 
            "ChapterID" = $2 
            AND "CourseID" = $3
        `;
        await client.query(updateQuery, [
          chapter.ChapterCount,
          chapter.ChapterID,
          parseInt(courseId)
        ]);
      }

      // Commit the transaction
      await client.query('COMMIT');

      // Fetch updated chapters
      const getUpdatedChaptersQuery = `
        SELECT 
          "ChapterID",
          "Title",
          "ChapterCount",
          "TranscodingStatus" as "Status"
        FROM "Courses_Chapters" 
        WHERE "CourseID" = $1
        ORDER BY "ChapterCount" ASC
      `;
      const updatedChapters = await pool.query(getUpdatedChaptersQuery, [parseInt(courseId)]);

      return NextResponse.json({
        success: true,
        message: "Chapter positions updated successfully",
        chapters: updatedChapters.rows
      });

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error in UPDATE_CHAPTER_POSITION API:", error);
    return NextResponse.json(
      { success: false, message: error || "Internal Server Error" },
      { status: 500 }
    );
  }
}