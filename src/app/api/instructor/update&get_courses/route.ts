import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";
import { deleteBlob, uploadToAzure } from "@/lib/azure-blob-storage";
import { v4 as uuidv4 } from "uuid";

// GET method to retrieve a course by ID along with its chapters
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
    const pool = await connectToDatabase();

    // Fetch course details
    const courseResult = await pool
      .request()
      .input("CourseID", sql.Int, Number(id))
      .query(`
        SELECT CourseID, Title, Description, Skills, Status, Fees, InstructorID, ThumbnailPublicID
        FROM Courses 
        WHERE CourseID = @CourseID
      `);

    if (courseResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 }
      );
    }

    // Fetch chapters for the course
    const chaptersResult = await pool
      .request()
      .input("CourseID", sql.Int, Number(id))
      .query(`
        SELECT ChapterCount, Title, ChapterID
        FROM Courses_Chapters
        WHERE CourseID = @CourseID
        ORDER BY ChapterCount ASC
      `);

    const courseDetails = courseResult.recordset[0];
    const chapters = chaptersResult.recordset;

    return NextResponse.json(
      {
        success: true,
        CourseDetails: courseDetails,
        Chapters: chapters, // Include chapters in the response
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

// API for updating course details
export async function PUT(req: NextRequest) {
  try {
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
    const { recordset: courseCheck } = await pool
      .request()
      .input("CourseID", sql.Int, Number(id))
      .query(
        "SELECT InstructorID, ThumbnailPublicID FROM Courses WHERE CourseID = @CourseID"
      );

    if (courseCheck.length === 0) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    if (courseCheck[0].InstructorID !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const oldThumbnailPublicID = courseCheck[0].ThumbnailPublicID;
    const updates: Record<string, string | number | boolean | null> = {}; // Store updates

    const allowedFields = [
      "Title",
      "Description",
      "Skills",
      "Status",
      "Fees",
      "ThumbnailPublicID",
      // Removed "ChapterCount" from allowed fields
    ];

    // Detect Content-Type
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("ThumbnailPublicID") as File | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer(); // Convert to ArrayBuffer
        const fileBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
        const newThumbnailPublicID = `${uuidv4()}.${file.name}`;

        // Upload new file & delete the old one in parallel
        await Promise.all([
          oldThumbnailPublicID ? deleteBlob(oldThumbnailPublicID, false) : Promise.resolve(),
          uploadToAzure(fileBuffer, newThumbnailPublicID, false),
        ]);

        updates["ThumbnailPublicID"] = newThumbnailPublicID;
      }

      // Handle other form fields
      allowedFields.forEach((key) => {
        const value = formData.get(key);
        if (value !== null && key !== "ThumbnailPublicID") {
          updates[key] = value.toString(); // Ensure the value is converted to string
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
    let query = "UPDATE Courses SET ";
    const updateClauses: string[] = [];
    const request = pool.request();

    Object.entries(updates).forEach(([key, value], index) => {
      const paramName = `param${index}`;
      updateClauses.push(`${key} = @${paramName}`);
      request.input(paramName, value);
    });

    query += updateClauses.join(", ") + " WHERE CourseID = @CourseID";
    request.input("CourseID", sql.Int, Number(id));

    await request.query(query);

    // Removed the logic for updating ChapterCount in Courses_Chapters table

    return NextResponse.json(
      { message: "Course updated successfully", updates }, // Updated success message
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
