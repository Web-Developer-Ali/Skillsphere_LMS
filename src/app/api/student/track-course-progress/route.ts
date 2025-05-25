import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { courseId, chapterId } = body;
    
    if (!courseId || !chapterId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const pool = await connectToDatabase();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get chapter data and current progress (all in minutes)
      const { rows: [chapterData] } = await client.query(
        `SELECT 
           ch."Duration" as "chapterSeconds",
           (SELECT COUNT(*) FROM "Courses_Chapters" WHERE "CourseID" = $2) as "totalChapters",
           (SELECT COUNT(*) FROM "CourseProgress" 
            WHERE "UserID" = $3 AND "CourseID" = $2 AND "IsCompleted" = TRUE) as "completedCount",
           (SELECT COALESCE("TotalLearningHours", 0) FROM "EnrolledCourses" 
            WHERE "UserID" = $3 AND "CourseID" = $2) as "currentMinutes"
         FROM "Courses_Chapters" ch
         WHERE ch."ChapterID" = $1 AND ch."CourseID" = $2`,
        [chapterId, courseId, userId]
      );

      if (!chapterData) {
        await client.query('ROLLBACK');
        return new NextResponse("Chapter not found in this course", { status: 404 });
      }

      const chapterSeconds = parseInt(chapterData.chapterSeconds) || 0;
      const chapterMinutes = Math.round(chapterSeconds / 60);
      const totalChapters = parseInt(chapterData.totalChapters, 10) || 0;
      const completedCount = parseInt(chapterData.completedCount, 10) || 0;
      const currentMinutes = parseInt(chapterData.currentMinutes, 10) || 0;
        // 2. Mark chapter as completed
      await client.query(
        `INSERT INTO "CourseProgress" ("UserID", "CourseID", "ChapterID", "IsCompleted", "LastAccessed")
         VALUES ($1, $2, $3, TRUE, NOW())
         ON CONFLICT ("UserID", "CourseID", "ChapterID")
         DO UPDATE SET "IsCompleted" = TRUE, "LastAccessed" = NOW()`,
        [userId, courseId, chapterId]
      );

      // 3. Calculate new values - all in minutes
      const newTotalMinutes = currentMinutes + chapterMinutes;
      const newCompletedCount = completedCount + 1;
      const isComplete = newCompletedCount >= totalChapters;
      // 4. Update enrollment record (storing total minutes)
      await client.query(
        `UPDATE "EnrolledCourses"
         SET "TotalLearningHours" = $1
         ${isComplete ? `, "CompletionStatus" = TRUE, "CompletionDate" = NOW()` : ''}
         WHERE "UserID" = $2 AND "CourseID" = $3`,
        [newTotalMinutes, userId, courseId]
      );

      await client.query('COMMIT');

      // Convert to hours for response (optional)
      const durationHours = (newTotalMinutes / 60).toFixed(1);

      return NextResponse.json({ 
        message: "Progress updated", 
        completedChapters: newCompletedCount, 
        totalChapters,
        durationMinutes: newTotalMinutes,
        durationHours, // Optional: for display purposes
        isComplete 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("[POST_COURSE_PROGRESS] error:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}