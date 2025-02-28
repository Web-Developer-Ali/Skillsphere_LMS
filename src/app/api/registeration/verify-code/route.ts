import sql from "mssql";
import dbConnection from "@/lib/dbConnect"; // Ensure this sets up your SQL Server connection

export async function POST(request: Request) {
  const pool = await dbConnection(); // Get the database connection
  try {
    const { id, code } = await request.json();
console.log(id)
    // Fetch user details from the database
    const userResult = await pool
      .request()
      .input("UserID", sql.Int, id)
      .query(`
        SELECT VerifyCode, ExpireVerifyCode, IsVerified 
        FROM Users 
        WHERE UserID = @UserID
      `);

    if (userResult.recordset.length === 0) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const user = userResult.recordset[0];

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
    const isCodeExpire =
      user.ExpireVerifyCode && new Date(user.ExpireVerifyCode) > new Date();

    if (isValidCode && isCodeExpire) {
      // Update user verification status
      await pool
        .request()
        .input("UserID", sql.Int, id)
        .query(`
          UPDATE Users 
          SET IsVerified = 1, UpdatedAt = GETDATE() 
          WHERE UserID = @UserID
        `);

      return Response.json(
        {
          success: true,
          message: "User successfully verified.",
        },
        { status: 200 }
      );
    } else if (!isCodeExpire) {
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
