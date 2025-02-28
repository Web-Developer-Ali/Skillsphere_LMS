import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnection from '@/lib/dbConnect';
import sql from 'mssql';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    await dbConnection();
    const userId = parseInt(session.user.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid instructor ID" },
        { status: 400 }
      );
    }

    const query = `
      SELECT * FROM Courses
      WHERE InstructorID = @userId
    `;

    // Correct way to pass parameters in mssql
    const requestQuery = new sql.Request();
    requestQuery.input('userId', sql.Int, userId);
    // Execute the query
    const result = await requestQuery.query(query);

    const courses = result.recordset;

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ message: 'Error fetching courses' }, { status: 500 });
  }
}
