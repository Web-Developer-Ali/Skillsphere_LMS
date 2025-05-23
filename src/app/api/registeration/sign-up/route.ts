import connectToDatabase from "@/lib/dbConnect";
import bcrypt from "bcrypt";
import { sendEmail } from "@/helper/sendVerificationEmail";

export async function POST(request: Request): Promise<Response> {
  const pool = await connectToDatabase();
  const { full_Name, email, password } = await request.json();
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expireTime = new Date();
  expireTime.setMinutes(expireTime.getMinutes() + 10);

  try {
    // Check if the user already exists with the provided email
    const existingUserResult = await pool.query(
      `SELECT "Email" FROM "Users" WHERE "Email" = $1`,
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "A user with this email already exists. Please log in.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database and get the new UserID
    const insertResult = await pool.query(
      `
        INSERT INTO "Users" (
          "FullName", 
          "Email", 
          "Password", 
          "VerifyCode", 
          "ExpireVerifyCode", 
          "IsVerified", 
          "UserType", 
          "CreatedAt", 
          "UpdatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING "UserID"
      `,
      [
        full_Name,
        email,
        Buffer.from(hashedPassword),
        verifyCode,
        expireTime,
        false,
        "Student"
      ]
    );

    const newUserId = insertResult.rows[0].UserID;

    // Send OTP email to the user
    await sendEmail({
      type: "verification",
      userEmail: email,
      username: full_Name,
      otp: verifyCode,
    });

    // Return success response with the new userId
    return new Response(
      JSON.stringify({
        success: true,
        message: "User registered successfully. Please verify your email.",
        userId: newUserId,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error registering user.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}