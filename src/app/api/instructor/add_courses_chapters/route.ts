import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";
import { uploadToAzure } from "@/lib/azure-blob-storage";
import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";
import { ratelimit } from "@/lib/rateLimiter";

export async function PUT(request: Request) {
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

    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "Instructor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const courseId = formData.get("courseId") as string;
    const isFreePreview = formData.get("isFreePreview") === "true";
    const blobUrl = formData.get("videoUrl") as string | null;
    const duration = formData.get("duration") as string | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    if (!title || !description || !courseId || isNaN(Number(courseId)) || !blobUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!duration || isNaN(Number(duration))) {
      return NextResponse.json({ error: "Valid duration is required" }, { status: 400 });
    }

    let thumbnailUrl = null;
    if (thumbnailFile) {
      try {
        const fileBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
        const fileExtension = thumbnailFile.name.split(".").pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;

        thumbnailUrl = await uploadToAzure(fileBuffer, uniqueFilename, false);
      } catch (uploadError) {
        console.error("Error uploading thumbnail:", uploadError);
        return NextResponse.json({ message: "Error uploading thumbnail" }, { status: 500 });
      }
    }

    const pool = await connectToDatabase();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const chapterCountResult = await client.query(
        `SELECT MAX("ChapterCount") AS "maxChapterCount" FROM "Courses_Chapters" WHERE "CourseID" = $1`,
        [Number(courseId)]
      );
      const maxChapterCount = chapterCountResult.rows[0]?.maxChapterCount || 0;
      const newChapterCount = maxChapterCount + 1;

      const insertQuery = `
        INSERT INTO "Courses_Chapters" (
          "Title", 
          "Description", 
          "IsFreePreview", 
          "CourseID", 
          "ChapterCount",
          "Thumbnail",
          "Duration",
          "Video"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING "ChapterID"
      `;

      const result = await client.query(insertQuery, [
        title,
        description,
        isFreePreview,
        Number(courseId),
        newChapterCount,
        thumbnailUrl,
        duration,
        blobUrl,
      ]);

      await client.query("COMMIT");

      return NextResponse.json(
        { message: "Chapter created successfully", chapterId: result.rows[0].ChapterID },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Transaction error:", error);
      return NextResponse.json(
        { error: "Failed to create chapter", details: error },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("Error adding chapter:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


// get request to check vidro transcoding is complete or not
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching transcoding status:', error);
      return NextResponse.json(
        { message: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error', details: 'Unknown error' },
      { status: 500 }
    );
  }

}
