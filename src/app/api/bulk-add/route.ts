import { NextResponse } from "next/server";
import { Pool } from "pg";
import connectToDatabase from "@/lib/dbConnect";

export async function POST() {
  try {
    const instructor_id = 2;

    const courseTemplates = [
      {
        title: "Startup Fundamentals: From Idea to Launch",
        description: "Learn how to turn a business idea into a successful startup.",
        category: "Business",
        skillLevel: "Beginner",
        skills: "Entrepreneurship,Lean Startup,Business Planning",
        price: 34.99,
        Status:"draft"
      },
      {
        title: "Digital Marketing Mastery",
        description: "Master SEO, social media, email marketing, and Google Ads.",
        category: "Business",
        skillLevel: "Intermediate",
        skills: "SEO,Email Marketing,Google Ads,Social Media",
        price: 49.99,
        Status:"draft"
      },
      {
        title: "Business Analytics with Excel",
        description: "Analyze business data effectively using Excel tools.",
        category: "Business",
        skillLevel: "Beginner",
        skills: "Excel,Data Analysis,Reporting,Charts",
        price: 24.99,
        Status:"draft"
      },
      {
        title: "Finance for Non-Financial Managers",
        description: "Understand key financial concepts and reports for better decisions.",
        category: "Business",
        skillLevel: "Intermediate",
        skills: "Finance,Balance Sheet,Budgeting,Forecasting",
        price: 44.99,
        Status:"draft"
      },
      {
        title: "Strategic Management and Planning",
        description: "Build and execute successful business strategies.",
        category: "Business",
        skillLevel: "Advanced",
        skills: "Strategic Thinking,SWOT,Business Models",
        price: 59.99,
        Status:"draft"
      },
      {
        title: "Leadership & Team Management",
        description: "Develop leadership skills and manage high-performing teams.",
        category: "Business",
        skillLevel: "Intermediate",
        skills: "Leadership,Teamwork,Communication,Delegation",
        price: 39.99,
        Status:"draft"
      },
      {
        title: "Business Communication Skills",
        description: "Improve your business writing and presentation skills.",
        category: "Business",
        skillLevel: "Beginner",
        skills: "Writing,Presentation,Negotiation,Professional Emailing",
        price: 22.99,
        Status:"draft"
      },
      {
        title: "Advanced Project Management",
        description: "Manage complex projects using modern PM frameworks.",
        category: "Business",
        skillLevel: "Advanced",
        skills: "Project Planning,Agile,Kanban,Scope Management",
        price: 64.99,
        Status:"draft"
      },
      {
        title: "E-Commerce Business Blueprint",
        description: "Set up and scale your online business with real strategies.",
        category: "Business",
        skillLevel: "Intermediate",
        skills: "Shopify,Dropshipping,E-commerce Strategy",
        price: 45.00,
        Status:"draft"
      },
      {
        title: "Pitching and Raising Venture Capital",
        description: "Create powerful pitch decks and raise capital effectively.",
        category: "Business",
        skillLevel: "Advanced",
        skills: "Pitching,Fundraising,VC,Investor Relations",
        price: 55.00,
        Status:"draft"
      }
    ];
    const pool: Pool = await connectToDatabase();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < 20; i++) {
        const course = courseTemplates[i % courseTemplates.length];
        const uniqueTitle = `${course.title} #${i + 1}`;

        const query = `
          INSERT INTO "Courses" 
            ("Title", "Description", "Category", "DifficultyLevel", "Skills", 
             "Fees", "InstructorID", "ThumbnailPublicID", "Status")
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING "CourseID"
        `;

        const values = [
          uniqueTitle,
          course.description,
          course.category,
          course.skillLevel,
          course.skills,
          course.price,
          instructor_id,
          null, // ThumbnailPublicID
          course.Status
        ];

        const result = await client.query(query, values);
        console.log(`Created course with ID: ${result.rows[0].CourseID}`);
      }

      await client.query('COMMIT');

      return NextResponse.json(
        { 
          message: "20 courses created successfully",
          instructorId: instructor_id
        }, 
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Transaction error:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Course creation error:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Failed to create courses"
      }, 
      { status: 500 }
    );
  }
}