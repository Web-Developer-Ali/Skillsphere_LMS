import dbConnection from "@/lib/dbConnect";

export async function POST(request: Request) {
  const pool = await dbConnection();
  try {
    const { id, code } = await request.json();
    
    // Fetch user details from the database
    const userResult = await pool.query(`
      SELECT "VerifyCode", "ExpireVerifyCode", "IsVerified" 
      FROM "Users" 
      WHERE "UserID" = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Check if the user is already verified
    if (user.IsVerified) {
      return Response.json(
        {
          success: false,
          message: "User is already verified.",
        },
        { status: 400 }
      );
    }

    const isValidCode = user.VerifyCode === code;
    const isCodeExpired = user.ExpireVerifyCode && new Date(user.ExpireVerifyCode) < new Date();

    if (isValidCode && !isCodeExpired) {
      // Update user verification status
      await pool.query(`
        UPDATE "Users" 
        SET "IsVerified" = true, "UpdatedAt" = NOW() 
        WHERE "UserID" = $1
      `, [id]);

      return Response.json(
        {
          success: true,
          message: "User successfully verified.",
        },
        { status: 200 }
      );
    } else if (isCodeExpired) {
      return Response.json(
        {
          success: false,
          message: "Verification code expired.",
        },
        { status: 400 }
      );
    } else {
      return Response.json(
        {
          success: false,
          message: "Incorrect verification code.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in verification:", error);
    return Response.json(
      {
        success: false,
        message: "Error in verification.",
      },
      { status: 500 }
    );
  }
}