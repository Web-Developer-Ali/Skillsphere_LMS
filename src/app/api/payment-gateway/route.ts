// app/api/payment-gateway/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/dbConnect';
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const pool = await connectToDatabase();
  
  try {
    const courseId = request.nextUrl.searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT "Fees", "Students" FROM "Courses" WHERE "CourseID" = $1',
      [parsedCourseId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const price = parseFloat(result.rows[0].Fees);
    let enrolledCount = 0;
    
    // Handle both string and number formats for Students field
    const studentsData = result.rows[0].Students;
    if (typeof studentsData === 'number') {
      enrolledCount = studentsData;
    } else if (typeof studentsData === 'string') {
      // Try to parse as number if it's a string
      enrolledCount = parseInt(studentsData) || 0;
    }

    return NextResponse.json({ 
      success: true,
      price,
      courseId: parsedCourseId,
      enrolledStudents: enrolledCount
    });
    
  } catch (error) {
    console.error('Error fetching course price:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const pool = await connectToDatabase();
  
  try {
    const { userId, courseId } = await request.json();

    // Validate input
    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields (userId, courseId)' },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId.toString());
    const parsedCourseId = parseInt(courseId.toString());
    
    if (isNaN(parsedUserId) || isNaN(parsedCourseId)) {
      return NextResponse.json(
        { error: 'Invalid user ID or course ID format' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Check if course exists and is published
      const courseCheck = await client.query(
        `SELECT "Fees", "Status", "Students" 
         FROM "Courses" 
         WHERE "CourseID" = $1 FOR UPDATE`,
        [parsedCourseId]
      );

      if (courseCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      if (courseCheck.rows[0].Status !== 'published') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Course is not available for enrollment' },
          { status: 400 }
        );
      }

      // 2. Check if already enrolled
      const enrollmentCheck = await client.query(
        'SELECT 1 FROM "EnrolledCourses" WHERE "UserID" = $1 AND "CourseID" = $2',
        [parsedUserId, parsedCourseId]
      );

      if (enrollmentCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'User is already enrolled in this course' },
          { status: 400 }
        );
      }

      // 3. Create enrollment record
      const enrollmentResult = await client.query(
        `INSERT INTO "EnrolledCourses" 
         ("UserID", "CourseID", "EnrollmentDate") 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         RETURNING "EnrollmentDate"`,
        [parsedUserId, parsedCourseId]
      );

      // 4. Update Students count (treat as integer)
      await client.query(
        `UPDATE "Courses" 
         SET "Students" = COALESCE(NULLIF("Students", '')::integer, 0) + 1
         WHERE "CourseID" = $1`,
        [parsedCourseId]
      );

      await client.query('COMMIT');

      // Clear only this user's dashboard cache
      try {
        const cacheKey = `dashboard:v2:${parsedUserId}`;
        await redis.del(cacheKey);
        console.log(`Cleared dashboard cache for user ${parsedUserId}`);
      } catch (cacheError) {
        console.error('Error clearing dashboard cache:', cacheError);
      }

      // Get updated enrollment count
      const updatedCountResult = await client.query(
        'SELECT "Students" FROM "Courses" WHERE "CourseID" = $1',
        [parsedCourseId]
      );
      const updatedCount = parseInt(updatedCountResult.rows[0]?.Students) || 0;

      return NextResponse.json({
        success: true,
        message: 'Successfully enrolled in course',
        courseId: parsedCourseId,
        userId: parsedUserId,
        enrollmentDate: enrollmentResult.rows[0].EnrollmentDate,
        coursePrice: courseCheck.rows[0].Fees,
        enrolledStudents: updatedCount
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}