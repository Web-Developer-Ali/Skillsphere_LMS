import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import sql from "mssql";
import connectToDatabase from "@/lib/dbConnect";
import { uploadToAzure } from "@/lib/azure-blob-storage";

export async function PUT(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "Instructor") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const courseId = formData.get("courseId") as string;
    const isFreePreview = formData.get("isFreePreview") === "true";
    const videoFile = formData.get("video") as File | null;

    // Validate required fields
    if (!title || !description || !courseId || isNaN(Number(courseId))) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate video file
    if (!videoFile || videoFile.size === 0) {
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 }
      );
    }

    // Convert the video file to a Buffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    // Connect to the database
    const pool = await connectToDatabase();

    try {
      // Start a transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Fetch the current maximum ChapterCount for the given CourseID
        const chapterCountResult = await pool
          .request()
          .input("courseId", sql.Int, Number(courseId))
          .query(`
            SELECT MAX(ChapterCount) AS MaxChapterCount
            FROM Courses_Chapters
            WHERE CourseID = @courseId
          `);

        const maxChapterCount = chapterCountResult.recordset[0].MaxChapterCount || 0;
        const newChapterCount = maxChapterCount + 1;

        // Insert the new chapter into the Courses_Chapters table
        const result = await pool
          .request()
          .input("title", sql.NVarChar, title)
          .input("description", sql.NVarChar, description)
          .input("isFreePreview", sql.Bit, isFreePreview)
          .input("courseId", sql.Int, Number(courseId))
          .input("chapterCount", sql.Int, newChapterCount)
          .query(`
            INSERT INTO Courses_Chapters (Title, Description, IsFreePreview, CourseID, ChapterCount)
            VALUES (@title, @description, @isFreePreview, @courseId, @chapterCount)
            SELECT SCOPE_IDENTITY() AS ChapterID
          `);

        const chapterId = result.recordset[0].ChapterID;

        // Upload the video to Azure Blob Storage
        const fileName = `${courseId}_${Date.now()}_${videoFile.name}`;
        await uploadToAzure(videoBuffer, fileName, true, {
          chapterId: chapterId.toString(),
          isFreePreview: isFreePreview.toString(),
        });

        // If we reach here, both database insert and video upload were successful
        await transaction.commit();

        return NextResponse.json(
          { 
            message: "Chapter and video uploaded successfully",
            chapterId: chapterId
          },
          { status: 201 }
        );

      } catch (error) {
        // If anything fails, roll back the transaction
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error("Transaction error:", error);
      return NextResponse.json(
        { error: "Failed to create chapter and upload video" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error adding chapter:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


// get request to inform user transcodig is in progress or commpleted

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const chapterId = searchParams.get("chapterId");

  if (!courseId || !chapterId) {
    return NextResponse.json(
      { message: 'Course ID and Chapter ID are required' },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    const pool = await connectToDatabase();

    // Query to fetch TranscodingStatus and TranscodingError
    const query = `
      SELECT TranscodingStatus, TranscodingError
      FROM Courses_Chapters
      WHERE CourseID = @courseId AND ChapterID = @chapterId
    `;

    const request = new sql.Request(pool);
    request.input('courseId', sql.Int, courseId);
    request.input('chapterId', sql.Int, chapterId);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { message: 'Chapter not found' },
        { status: 404 }
      );
    }

    const { TranscodingStatus, TranscodingError } = result.recordset[0];
    return NextResponse.json({ TranscodingStatus, TranscodingError });
  } catch (error) {
    console.error('Error fetching transcoding status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}