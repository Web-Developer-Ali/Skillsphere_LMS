import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";
import { uploadToAzure } from "@/lib/azure-blob-storage";
import { v4 as uuidv4 } from "uuid";
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
    const duration = formData.get("duration") as string | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;

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

      // Validate duration
      if (!duration || isNaN(Number(duration))) {
        return NextResponse.json(
          { error: "Valid duration is required" },
          { status: 400 }
        );
      }

    // Convert the video file to a Buffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    let thumbnailUrl = null;
    if (thumbnailFile) {
      try {
        const fileBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
        const fileExtension = thumbnailFile.name.split(".").pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;

        thumbnailUrl = await uploadToAzure(fileBuffer, uniqueFilename, false);
      } catch (uploadError) {
        console.error("Error uploading to Azure Blob Storage:", uploadError);
        return NextResponse.json(
          { message: "Error uploading thumbnail" },
          { status: 500 }
        );
      }
    }

    // Connect to the database
    const pool = await connectToDatabase();
    const client = await pool.connect();

    try {
      // Start a transaction
      await client.query('BEGIN');

      try {
        // Fetch the current maximum ChapterCount for the given CourseID
        const chapterCountResult = await client.query(`
          SELECT MAX("ChapterCount") AS "maxChapterCount"
          FROM "Courses_Chapters"
          WHERE "CourseID" = $1
        `, [Number(courseId)]);

        const maxChapterCount = chapterCountResult.rows[0]?.maxChapterCount || 0;
        const newChapterCount = maxChapterCount + 1;
const Thumbnail = thumbnailUrl
        // Insert the new chapter into the Courses_Chapters table
        const insertQuery = `
          INSERT INTO "Courses_Chapters" (
            "Title", 
            "Description", 
            "IsFreePreview", 
            "CourseID", 
            "ChapterCount",
            "Thumbnail",
            "Duration"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING "ChapterID"
        `;

        const result = await client.query(insertQuery, [
          title,
          description,
          isFreePreview,
          Number(courseId),
          newChapterCount,
          Thumbnail,
          duration
        ]);

        const chapterId = result.rows[0].ChapterID;

        // Upload the video to Azure Blob Storage
        const fileName = `${courseId}_${Date.now()}_${videoFile.name}`;
        await uploadToAzure(videoBuffer, fileName, true, {
          chapterId: chapterId.toString(),
          isFreePreview: isFreePreview.toString(),
        });

        // If we reach here, both database insert and video upload were successful
        await client.query('COMMIT');

        return NextResponse.json(
          { 
            message: "Chapter and video uploaded successfully",
            chapterId: chapterId
          },
          { status: 201 }
        );

      } catch (error) {
        // If anything fails, roll back the transaction
        await client.query('ROLLBACK');
        throw error;
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      return NextResponse.json(
        { error: "Failed to create chapter and upload video", details: error.message },
        { status: 500 }
      );
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("Error adding chapter:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const chapterId = searchParams.get("chapterId");

  if (!courseId || !chapterId || isNaN(Number(courseId)) || isNaN(Number(chapterId))) {
    return NextResponse.json(
      { message: 'Valid Course ID and Chapter ID are required' },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    const pool = await connectToDatabase();

    // Query to fetch TranscodingStatus and TranscodingError
    const query = `
      SELECT "TranscodingStatus", "TranscodingError"
      FROM "Courses_Chapters"
      WHERE "CourseID" = $1 AND "ChapterID" = $2
    `;

    const result = await pool.query(query, [Number(courseId), Number(chapterId)]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Chapter not found' },
        { status: 404 }
      );
    }

    const { TranscodingStatus, TranscodingError } = result.rows[0];
    return NextResponse.json({ 
      TranscodingStatus, 
      TranscodingError 
    });
  } catch (error: any) {
    console.error('Error fetching transcoding status:', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}