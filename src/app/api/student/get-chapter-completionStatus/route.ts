import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return new NextResponse("Missing courseId", { status: 400 });
    }

    const pool = await connectToDatabase();

    const { rows } = await pool.query(
      `SELECT "ChapterID"
       FROM "CourseProgress"
       WHERE "UserID" = $1 
         AND "CourseID" = $2 
         AND "IsCompleted" = TRUE`,
      [userId, courseId]
    );

    const completedChapterIds = rows.map((row) => row.ChapterID);

    return NextResponse.json({ completedChapterIds });
  } catch (error) {
    console.error("[GET_COURSE_COMPLETION] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}