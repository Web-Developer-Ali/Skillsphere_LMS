import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const pool = await connectToDatabase();
    const userId = parseInt(session.user.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid instructor ID" },
        { status: 400 }
      );
    }

    // Updated query with proper case-sensitive table and column names
    const query = `
      SELECT 
        "CourseID",
        "Title",
        "Description",
        "Category",
        "DifficultyLevel",
        "Skills",
        "Status",
        "Fees",
        "InstructorID",
        "Rating",
        "ThumbnailPublicID",
        "CreatedAt"
      FROM "Courses"
      WHERE "InstructorID" = $1
    `;

    const result = await pool.query(query, [userId]);
    const courses = result.rows;

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { 
        message: "Error fetching courses",
        error: error.message 
      },
      { status: 500 }
    );
  }
}