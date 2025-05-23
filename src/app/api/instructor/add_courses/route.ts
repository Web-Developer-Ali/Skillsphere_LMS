import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";
import { uploadToAzure } from "@/lib/azure-blob-storage";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const instructor_id = parseInt(session.user.id, 10);

    if (isNaN(instructor_id)) {
      return NextResponse.json(
        { error: "Invalid instructor ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const skillLevel = formData.get("skillLevel") as string;
    const skills = formData.get("skills") as string;
    const price = formData.get("price") as string;
    const courseThumbnail = formData.get("courseThumbnail") as File | null;

    if (
      !title ||
      !description ||
      !category ||
      !skillLevel ||
      !skills ||
      !price
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = await connectToDatabase();

    let thumbnailUrl = null;
    if (courseThumbnail) {
      try {
        const fileBuffer = Buffer.from(await courseThumbnail.arrayBuffer());
        const fileExtension = courseThumbnail.name.split(".").pop();
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

    // PostgreSQL query with parameterized values matching your schema
    const insertQuery = `
      INSERT INTO "Courses" (
        "Title", 
        "Description", 
        "Category", 
        "DifficultyLevel", 
        "Skills", 
        "Fees", 
        "InstructorID", 
        "ThumbnailPublicID",
        "Status"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING "CourseID"
    `;

    const values = [
      title,
      description,
      category,
      skillLevel,
      skills.split(",").map((skill: string) => skill.trim()).join(","),
      parseFloat(price),
      instructor_id,
      thumbnailUrl,
      'draft' // Default status from your schema
    ];

    const result = await pool.query(insertQuery, values);

    return NextResponse.json(
      { 
        message: "Course created successfully",
        courseId: result.rows[0].CourseID 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { message: "Error creating course", error: error.message },
      { status: 500 }
    );
  }
}