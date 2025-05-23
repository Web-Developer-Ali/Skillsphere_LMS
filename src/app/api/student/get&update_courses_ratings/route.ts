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

    // Get average rating and total ratings for the course
    const avgQuery = await pool.query(
      `SELECT 
        COALESCE(AVG("Rating"), 0) as average,
        COUNT("Rating") as total_ratings
       FROM "Courses"
       WHERE "CourseID" = $1`,
      [courseId]
    );

    return NextResponse.json({
      average: parseFloat(avgQuery.rows[0].average),
      totalRatings: parseInt(avgQuery.rows[0].total_ratings),
      
    });
  } catch (error) {
    console.error("[GET_COURSE_RATINGS] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// api for update courses rating 
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse(JSON.stringify({ 
        message: "Unauthorized" 
      }), { status: 401 });
    }

    const { courseId, rating } = await req.json();
    if (!courseId || !rating) {
      return new NextResponse(JSON.stringify({ 
        message: "Missing courseId or rating" 
      }), { status: 400 });      
    }

    if (rating < 1 || rating > 5) {
      return new NextResponse("Rating must be between 1 and 5", { status: 400 });
    }

    const pool = await connectToDatabase();

    // Check if user has already rated this course
    const existingRating = await pool.query(
      `SELECT "RatingID" FROM "Courses" 
       WHERE "CourseID" = $1 AND "RatingID" = $2`,
      [courseId, userId]
    );

    if (existingRating.rows.length > 0) {
      return new NextResponse(JSON.stringify({
        message: "You've already rated this course" 
      }), { status: 400 });      
    }

    // First update the course with the user's rating reference
    await pool.query(
      `UPDATE "Courses"
       SET "RatingID" = $1
       WHERE "CourseID" = $2`,
      [userId, courseId]
    );

    // Calculate new average rating (this is simplified - in production you'd want a proper ratings table)
    const currentRatingQuery = await pool.query(
      `SELECT "Rating" FROM "Courses" WHERE "CourseID" = $1`,
      [courseId]
    );
    
    const currentRating = parseFloat(currentRatingQuery.rows[0].Rating) || 0;
    const newAverage = ((currentRating * 1) + rating) / 2; // Simplified average calculation

    // Update the course's average rating
    await pool.query(
      `UPDATE "Courses"
       SET "Rating" = $1
       WHERE "CourseID" = $2`,
      [newAverage.toFixed(1), courseId]
    );

    return NextResponse.json({ 
      success: true,
      averageRating: newAverage,
      userRating: rating 
    });
  } catch (error) {
    console.error("[POST_COURSE_RATING] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}