import { NextResponse } from "next/server"; 
import { z } from "zod";
import dbConnection from "@/lib/dbConnect";

const studentSchema = z.object({
  age: z.number().min(13, "You must be at least 13 years old").max(120, "Please enter a valid age"),
  desire_role: z.string().min(2, "Please enter your desired role"),
});

const instructorSchema = z.object({
  bio: z.string().min(10, "Please provide a brief bio (at least 10 characters)"),
  expertise: z.string().min(2, "Please enter your area of expertise"),
});

const commonSchema = z.object({
  userType: z.enum(["Student", "Instructor"]),
  id: z.string(),
});

const studentFormSchema = commonSchema.merge(studentSchema);
const instructorFormSchema = commonSchema.merge(instructorSchema);

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, userType, ...data } = body;

    // Validate input data based on user type
    if (userType === "Student") {
      studentFormSchema.parse(body);
    } else if (userType === "Instructor") {
      instructorFormSchema.parse(body);
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    // Connect to the database
    const pool = await dbConnection();

    // Start constructing the SQL update query
    const updateFields: string[] = [];
    const values: (string | number | boolean)[] = [];
    const paramIndex = 1;

    // Common parameters
    values.push(parseInt(id, 10)); // $1 - UserID
    values.push(true); // $2 - OnboardComplete

    if (userType === "Student") {
      updateFields.push(`"Age" = $${paramIndex + 2}`);
      updateFields.push(`"DesireRole" = $${paramIndex + 3}`);
      values.push(data.age); // $3 - Age
      values.push(data.desire_role); // $4 - DesireRole
    } else if (userType === "Instructor") {
      updateFields.push(`"Bio" = $${paramIndex + 2}`);
      updateFields.push(`"Expertise" = $${paramIndex + 3}`);
      updateFields.push(`"UserType" = $${paramIndex + 4}`);
      values.push(data.bio); // $3 - Bio
      values.push(data.expertise); // $4 - Expertise
      values.push("Instructor"); // $5 - UserType
    }

    // Add common fields
    updateFields.push(`"OnboardComplete" = $2`);
    updateFields.push(`"UpdatedAt" = NOW()`);

    // Finalize the update query
    const query = `
      UPDATE "Users" 
      SET ${updateFields.join(", ")}
      WHERE "UserID" = $1
    `;

    // Execute the query
    const result = await pool.query(query, values);

    // Check if the update was successful
    if (result.rowCount != 0) {
      return NextResponse.json(
        { success: true, message: "Profile updated successfully!" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Unable to update the profile or user not found" },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error in onboarding API:", error);
    return NextResponse.json(
      { error: "Something went wrong during the onboarding process" },
      { status: 500 }
    );
  }
}