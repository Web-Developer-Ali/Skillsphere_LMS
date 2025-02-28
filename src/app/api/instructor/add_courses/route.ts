import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import sql, { ConnectionPool } from "mssql";
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

    const pool: ConnectionPool = await connectToDatabase();

    let thumbnailUrl = null;
    if (courseThumbnail) {
      try {
        const fileBuffer = Buffer.from(await courseThumbnail.arrayBuffer());
        const fileExtension = courseThumbnail.name.split(".").pop(); // Get file extension
        const uniqueFilename = `${uuidv4()}.${fileExtension}`; // Generate unique filename

        thumbnailUrl = await uploadToAzure(fileBuffer, uniqueFilename , false);
      } catch (uploadError) {
        console.error("Error uploading to Azure Blob Storage:", uploadError);
        return NextResponse.json(
          { message: "Error uploading thumbnail" },
          { status: 500 }
        );
      }
    }

    const insertQuery = `
      INSERT INTO Courses (Title, Description, Category, DifficultyLevel, Skills, Fees, InstructorID, ThumbnailPublicID)
      VALUES (@title, @description, @category, @skillLevel, @skills, @price, @instructor_id, @ThumbnailPublicID)
    `;

    const request = pool.request();
    request.input("title", sql.NVarChar, title);
    request.input("description", sql.NVarChar, description);
    request.input("category", sql.NVarChar, category);
    request.input("skillLevel", sql.NVarChar, skillLevel);
    request.input("skills", sql.NVarChar, skills.split(",").map((skill: string) => skill.trim()).join(","));
    request.input("price", sql.Decimal, parseFloat(price));
    request.input("instructor_id", sql.Int, instructor_id);
    request.input("ThumbnailPublicID", sql.NVarChar, thumbnailUrl);

    await request.query(insertQuery);

    return NextResponse.json(
      { message: "Course created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { message: "Error creating course" },
      { status: 500 }
    );
  }
}
