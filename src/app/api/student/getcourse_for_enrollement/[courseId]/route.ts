import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user.id;

    const pool = await connectToDatabase();

    // Run all DB queries in parallel
    const [
      { rows: [course] },
      { rows: [previewChapter] },
      { rows: chapters }
    ] = await Promise.all([
      pool.query(
        `SELECT 
          c."CourseID" as "id",
          c."Title" as "title",
          c."Description" as "description",
          c."Category" as "category",
          c."DifficultyLevel" as "level",
          c."Skills" as "skills",
          c."Fees" as "fees",
          c."Rating" as "rating",
          c."ThumbnailPublicID" as "thumbnailUrl",
          u."FullName" as "instructor",
          COUNT(ec."CourseID") as "studentsEnrolled",
          EXISTS(
            SELECT 1 FROM "EnrolledCourses" 
            WHERE "UserID" = $2 AND "CourseID" = c."CourseID"
          ) as "isEnrolled"
        FROM "Courses" c
        JOIN "Users" u ON c."InstructorID" = u."UserID"
        LEFT JOIN "EnrolledCourses" ec ON c."CourseID" = ec."CourseID"
        WHERE c."CourseID" = $1 AND c."Status" = 'published'
        GROUP BY c."CourseID", u."FullName"`,
        [params.courseId, userId]
      ),

      pool.query(
        `SELECT 
          "Video" as "videoUrl",
          "Title" as "chapterTitle",
          "Duration",
          "Thumbnail" as "chapterThumbnail"
        FROM "Courses_Chapters"
        WHERE "CourseID" = $1 AND "IsFreePreview" = TRUE
        ORDER BY "ChapterCount" ASC
        LIMIT 1`,
        [params.courseId]
      ),

      pool.query(
        `SELECT 
          "ChapterID" as "id",
          "Title" as "title",
          "Description" as "description",
          "Video" as "videoUrl",
          "IsFreePreview" as "isFree",
          "ChapterCount" as "position",
          "Duration",
          "Thumbnail" as "thumbnailUrl",
          EXISTS(
            SELECT 1 FROM "CourseProgress" 
            WHERE "UserID" = $2 
              AND "CourseID" = $1 
              AND "ChapterID" = "Courses_Chapters"."ChapterID"
              AND "IsCompleted" = TRUE
          ) as "isCompleted"
        FROM "Courses_Chapters"
        WHERE "CourseID" = $1
        ORDER BY "ChapterCount" ASC`,
        [params.courseId, userId]
      )
    ]);

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Format duration utility
    const formatDuration = (seconds: number) => {
      if (!seconds) return "N/A";
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const totalDuration = chapters.reduce(
      (sum, chapter) => sum + (chapter.Duration || 0),
      0
    );

    return NextResponse.json({
      ...course,
      duration: formatDuration(totalDuration),
      videoUrl: previewChapter?.videoUrl || null,
      chapterTitle: previewChapter?.chapterTitle || null,
      chapterThumbnail: previewChapter?.chapterThumbnail || null,
      skills: course.skills?.split(",").map((s: string) => s.trim()) || [],
      isEnrolled: userId ? course.isEnrolled : false,
      content: chapters.map((chapter) => ({
        ...chapter,
        duration: formatDuration(chapter.Duration),
        isCompleted: userId ? chapter.isCompleted : false
      })),
      totalChapters: chapters.length
    });
  } catch (error) {
    console.error("[GET_COURSE_DETAILS] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
