import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { success: false, message: "Invalid course ID" },
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

    const pool = await connectToDatabase();

    // Fetch course details
    const courseResult = await pool.query(`
      SELECT 
        "CourseID", 
        "Title", 
        "Description", 
        "Skills", 
        "Status", 
        "Fees", 
        "InstructorID", 
        "ThumbnailPublicID"
      FROM "Courses" 
      WHERE "CourseID" = $1
    `, [Number(id)]);

    if (courseResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 }
      );
    }

    // Fetch chapters for the course
    const chaptersResult = await pool.query(`
      SELECT 
        "ChapterCount", 
        "Title", 
        "ChapterID"
      FROM "Courses_Chapters"
      WHERE "CourseID" = $1
      ORDER BY "ChapterCount" ASC
    `, [Number(id)]);

    const courseDetails = courseResult.rows[0];
    const chapters = chaptersResult.rows;

    return NextResponse.json(
      {
        success: true,
        CourseDetails: courseDetails,
        Chapters: chapters,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}


import { deleteBlob, uploadToAzure } from "@/lib/azure-blob-storage";
import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";
import { ratelimit } from "@/lib/rateLimiter";

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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // Course ID
    const session = await getServerSession(authOptions);

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const pool = await connectToDatabase();

    // Fetch course details (Instructor ID & existing thumbnail)
    const courseCheck = await pool.query(
      `SELECT "InstructorID", "ThumbnailPublicID" FROM "Courses" WHERE "CourseID" = $1`,
      [Number(id)]
    );

    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    if (Number(courseCheck.rows[0].InstructorID) !== Number(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const oldThumbnailPublicID = courseCheck.rows[0].ThumbnailPublicID;
    const updates: Record<string, string | number | boolean | null> = {};

    const allowedFields = [
      "Title",
      "Description",
      "Skills",
      "Status",
      "Fees",
      "ThumbnailPublicID",
    ];

    // Detect Content-Type
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("ThumbnailPublicID") as File | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const newThumbnailPublicID = `${uuidv4()}.${file.name}`;

        await Promise.all([
          oldThumbnailPublicID ? deleteBlob(oldThumbnailPublicID, false) : Promise.resolve(),
          uploadToAzure(fileBuffer, newThumbnailPublicID, false),
        ]);

        updates["ThumbnailPublicID"] = newThumbnailPublicID;
      }

      allowedFields.forEach((key) => {
        const value = formData.get(key);
        if (value !== null && key !== "ThumbnailPublicID") {
          updates[key] = value.toString();
        }
      });
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      allowedFields.forEach((key) => {
        if (body[key] !== undefined) {
          updates[key] = body[key];
        }
      });
    } else {
      return NextResponse.json(
        { message: "Unsupported Content-Type" },
        { status: 415 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided" },
        { status: 400 }
      );
    }


    // Dynamically build update query for Courses table
    let query = 'UPDATE "Courses" SET ';
    const updateClauses: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      updateClauses.push(`"${key}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    query += updateClauses.join(", ") + ' WHERE "CourseID" = $' + paramIndex;
    values.push(Number(id));


    await pool.query(query, values);

    return NextResponse.json(
      { message: "Course updated successfully", updates },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { message: "Server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}