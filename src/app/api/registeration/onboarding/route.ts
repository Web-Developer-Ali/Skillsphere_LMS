import { NextResponse } from "next/server"; 
import { z } from "zod";
import dbConnection from "@/lib/dbConnect";
import sql from "mssql";

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

type SQLParam = { name: string; type: sql.ISqlType; value: string | number | boolean | null };

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
    let updateFields = "";
    const params: SQLParam[] = [
      { name: "UserID", type: sql.Int(), value: parseInt(id, 10) },
      { name: "OnboardComplete", type: sql.Bit(), value: true },
    ];

    if (userType === "Student") {
      updateFields += "Age = @Age, DesireRole = @DesireRole, ";
      params.push(
        { name: "Age", type: sql.Int(), value: data.age },
        { name: "DesireRole", type: sql.NVarChar(255), value: data.desire_role }
      );
    } else if (userType === "Instructor") {
      updateFields += "Bio = @Bio, Expertise = @Expertise, UserType = @UserType, ";
      params.push(
        { name: "Bio", type: sql.NVarChar(sql.MAX), value: data.bio },
        { name: "Expertise", type: sql.NVarChar(255), value: data.expertise },
        { name: "UserType", type: sql.NVarChar(255), value: "Instructor" }
      );
    }

    // Finalize the update query
    const query = `
      UPDATE Users 
      SET ${updateFields} OnboardComplete = @OnboardComplete, UpdatedAt = GETDATE()
      WHERE UserID = @UserID;
    `;

    // Execute the query
    const request = pool.request();
    params.forEach((param) =>
      request.input(param.name, param.type, param.value)
    );

    const result = await request.query(query);

    // Check if the update was successful
    if (result.rowsAffected[0] > 0) {
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
