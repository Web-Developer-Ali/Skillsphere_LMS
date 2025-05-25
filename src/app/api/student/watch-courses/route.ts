export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ChapterRow, CourseResponse, ErrorResponse } from "@/types/watch-courses-api";


export async function GET(request: Request): Promise<NextResponse<CourseResponse | ErrorResponse>> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Student') {
            return NextResponse.json(
                { error: "Unauthorized", message: "Access restricted to students only." },
                { status: 401 }
            );
        }

        // Extract courseId from query parameters
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json(
                { error: "Bad Request", message: "Course ID is required" },
                { status: 400 }
            );
        }

        const pool = connectToDatabase();
        const client = await pool.connect();

        try {
            // First query to get course details with instructor name and enrollment status
            const courseQuery = `
                SELECT 
                    c."CourseID" as "courseId",
                    c."Title" as "title",
                    u."FullName" as "instructorName",
                    ec."CompletionStatus" as "completionStatus",
                    CASE WHEN ec."UserID" IS NOT NULL THEN TRUE ELSE FALSE END as "isEnrolled"
                FROM "Courses" c
                JOIN "Users" u ON c."InstructorID" = u."UserID"
                LEFT JOIN "EnrolledCourses" ec ON c."CourseID" = ec."CourseID" 
                    AND ec."UserID" = $2
                WHERE c."CourseID" = $1 AND u."UserType" = 'Instructor'
            `;

            const courseResult = await client.query(courseQuery, [courseId, session.user.id]);
            
            if (courseResult.rows.length === 0) {
                return NextResponse.json(
                    { error: "Not Found", message: "Course not found or not taught by an instructor" },
                    { status: 404 }
                );
            }

            const courseDetails = courseResult.rows[0];
            const responseData: CourseResponse = {
                courseId: Number(courseDetails.courseId),
                title: String(courseDetails.title),
                instructorName: String(courseDetails.instructorName),
                isEnrolled: Boolean(courseDetails.isEnrolled),
                completionStatus: Boolean(courseDetails.completionStatus)
            };

            // If student is enrolled, fetch course chapters/videos with descriptions
            if (responseData.isEnrolled) {
                const chaptersQuery = `
                    SELECT 
                        "ChapterID" as "chapterId",
                        "Title" as "title",
                        "Description" as "description",
                        "Video" as "videoUrl",
                        "IsFreePreview" as "isFreePreview",
                        "ChapterCount" as "chapterNumber",
                        "TranscodingStatus" as "transcodingStatus",
                        "Thumbnail" as "thumbnailUrl",
                        "Duration" as "duration",
                        "CreatedAt" as "createdAt",
                        "UpdatedAt" as "updatedAt"
                    FROM "Courses_Chapters"
                    WHERE "CourseID" = $1
                    ORDER BY "ChapterCount" ASC
                `;

                const chaptersResult = await client.query(chaptersQuery, [courseId]);
                
                // Format chapters with all details including description
                responseData.chapters = chaptersResult.rows.map((chapter: ChapterRow) => ({
                    chapterId: Number(chapter.chapterId),
                    title: String(chapter.title),
                    description: String(chapter.description),
                    thumbnailUrl: String(chapter.thumbnailUrl),
                    duration: String(chapter.duration),
                    videoUrl: chapter.videoUrl ? String(chapter.videoUrl) : null,
                    isFreePreview: Boolean(chapter.isFreePreview),
                    chapterNumber: Number(chapter.chapterNumber),
                    isReady: String(chapter.transcodingStatus) === 'Completed',
                    createdAt: new Date(chapter.createdAt).toISOString(),
                    updatedAt: new Date(chapter.updatedAt).toISOString()
                }));
            }

            return NextResponse.json(responseData, { status: 200 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching course details:", error);
        return NextResponse.json(
            { 
                error: "Internal Server Error", 
                message: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}