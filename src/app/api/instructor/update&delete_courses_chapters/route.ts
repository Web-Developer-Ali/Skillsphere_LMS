import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { deleteBlob } from "@/lib/azure-blob-storage";
import sql from "mssql";

export async function DELETE(req: NextRequest) {
  try {
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
    const checkInstructorRequest = new sql.Request(pool);
    const checkInstructorQuery = `
      SELECT c.InstructorID
      FROM Courses_Chapters cc
      INNER JOIN Courses c ON cc.CourseID = c.CourseID
      WHERE cc.ChapterID = @chapterId
    `;
    checkInstructorRequest.input("chapterId", sql.Int, parseInt(chapterId));
    const instructorResult = await checkInstructorRequest.query(checkInstructorQuery);

    if (instructorResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: "Chapter not found" },
        { status: 404 }
      );
    }

    const instructorId = instructorResult.recordset[0].InstructorID;

    // Step 5: Compare session user ID with the instructor ID
    if (session.user.id !== instructorId) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to delete this chapter" },
        { status: 403 }
      );
    }

    // Step 6: Get the list of blobs associated with the chapter
    const getBlobsRequest = new sql.Request(pool);
    const getBlobsQuery = `
      SELECT BlobName
      FROM ChapterFiles
      WHERE ChapterID = @chapterId
    `;
    getBlobsRequest.input("chapterId", sql.Int, parseInt(chapterId));
    const blobsResult = await getBlobsRequest.query(getBlobsQuery);
    const blobNames = blobsResult.recordset.map((row) => row.BlobName);

    // Step 7: Delete the blobs from Azure Storage
    if (blobNames.length > 0) {
      await deleteBlob(blobNames, true); // true indicates video deletion
    }

    // Step 8: Delete associated files from the ChapterFiles table FIRST
    const deleteFilesRequest = new sql.Request(pool);
    const deleteFilesQuery = `
      DELETE FROM ChapterFiles
      WHERE ChapterID = @chapterId
    `;
    deleteFilesRequest.input("chapterId", sql.Int, parseInt(chapterId));
    await deleteFilesRequest.query(deleteFilesQuery);
   
    // Step 9: Delete the chapter from the Courses_Chapters table
    const deleteChapterRequest = new sql.Request(pool);
    const deleteChapterQuery = `
      DELETE FROM Courses_Chapters
      WHERE ChapterID = @chapterId
    `;
    deleteChapterRequest.input("chapterId", sql.Int, parseInt(chapterId));
    await deleteChapterRequest.query(deleteChapterQuery);
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



// api to change chapter positions.
export async function PUT(req: NextRequest) {
  try {
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
    const checkInstructorRequest = new sql.Request(pool);
    const checkInstructorQuery = `
      SELECT InstructorID
      FROM Courses
      WHERE CourseID = @courseId
    `;
    checkInstructorRequest.input("courseId", sql.Int, parseInt(courseId));
    const instructorResult = await checkInstructorRequest.query(checkInstructorQuery);

    if (instructorResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 }
      );
    }

    if (instructorResult.recordset[0].InstructorID !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Not authorized to modify this course" },
        { status: 403 }
      );
    }

    // Step 5: Start transaction for updating chapter positions
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update each chapter's position
      for (const chapter of chapters) {
        const updateRequest = new sql.Request(transaction);
        const updateQuery = `
          UPDATE Courses_Chapters 
          SET 
            ChapterCount = @newPosition,
            UpdatedAt = GETDATE()
          WHERE 
            ChapterID = @chapterId 
            AND CourseID = @courseId
        `;
        
        updateRequest.input("newPosition", sql.Int, chapter.ChapterCount);
        updateRequest.input("chapterId", sql.Int, chapter.ChapterID);
        updateRequest.input("courseId", sql.Int, parseInt(courseId));
        
        await updateRequest.query(updateQuery);
      }

      // Commit the transaction
      await transaction.commit();

      // Fetch updated chapters
      const getUpdatedChaptersRequest = new sql.Request(pool);
      const getUpdatedChaptersQuery = `
        SELECT 
          ChapterID,
          Title,
          ChapterCount,
          TranscodingStatus as Status
        FROM Courses_Chapters 
        WHERE CourseID = @courseId
        ORDER BY ChapterCount ASC
      `;
      getUpdatedChaptersRequest.input("courseId", sql.Int, parseInt(courseId));
      const updatedChapters = await getUpdatedChaptersRequest.query(getUpdatedChaptersQuery);

      return NextResponse.json({
        success: true,
        message: "Chapter positions updated successfully",
        chapters: updatedChapters.recordset
      });

    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Error in UPDATE_CHAPTER_POSITION API:", error);
    return NextResponse.json(
      { success: false, message: error || "Internal Server Error" },
      { status: 500 }
    );
  }
}



