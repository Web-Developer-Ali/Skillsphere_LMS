import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import connectToDatabase from "@/lib/dbConnect";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        if (!credentials) throw new Error("No credentials provided");

        const pool = await connectToDatabase();

        try {
          const { email, password } = credentials;
          // Fetch user from PostgreSQL database
          const result = await pool.query(`
            SELECT 
              "UserID", 
              "FullName", 
              "Email", 
              "Password", 
              "IsVerified", 
              "OnboardComplete", 
              "AvatarSecureURL", 
              "UserType" 
            FROM "Users" 
            WHERE "Email" = $1
          `, [email]);

          const userRecord = result.rows[0];
          if (!userRecord) {
            throw new Error("Invalid email or password");
          }

          // Check if the user is verified
          if (!userRecord.IsVerified) {
            console.warn("Error: User not verified for email:", email);
            throw new Error("Please verify your account first");
          }

          // Validate the password
          const hashedPassword = userRecord.Password.toString();
          const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);
          if (!isPasswordCorrect) {
            throw new Error("Invalid email or password");
          }

          // Return user object on successful authentication
          return {
            id: userRecord.UserID,
            email: userRecord.Email,
            full_Name: userRecord.FullName,
            isVerified: !!userRecord.IsVerified,
            onboardComplete: !!userRecord.OnboardComplete,
            avatar: userRecord.AvatarSecureURL,
            role: userRecord.UserType,
          };
        } catch (error) {
          console.error("Error authorizing user:", error);
          throw new Error("Error during authentication, Invalid email or password");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile, session, trigger }) {
      const pool = await connectToDatabase();

      if (trigger === "update" && session?.onboardComplete) {
        token.onboardComplete = session.onboardComplete;
        token.role = session.role;
      }

      // Handle Google login
      if (account?.provider === "google") {
        try {
          const email = profile?.email;

          // Check if user exists
          const existingUserResult = await pool.query(
            `SELECT * FROM "Users" WHERE "Email" = $1`,
            [email]
          );

          const existingUser = existingUserResult.rows[0];
          let newUserId = null;

          if (!existingUser) {
            // Create new user in PostgreSQL database with default UserType 'Student'
            const insertResult = await pool.query(
              `INSERT INTO "Users" (
                "FullName", 
                "Email", 
                "IsVerified", 
                "OnboardComplete", 
                "AvatarSecureURL", 
                "UserType"
              ) 
              VALUES ($1, $2, $3, $4, $5, $6) 
              RETURNING "UserID"`,
              [
                profile?.name,
                profile?.email,
                true, // IsVerified
                false, // OnboardComplete
                (profile as { picture?: string })?.picture || "",
                "Student" // Default value
              ]
            );

            newUserId = insertResult.rows[0].UserID;
            token.isNewUser = true;
            token.onboardComplete = false;
          } else {
            // If user exists, fetch their data
            token.isNewUser = false;
            token.onboardComplete = !!existingUser.OnboardComplete;
            token.picture = existingUser.AvatarSecureURL;
            token.role = existingUser.UserType;
          }

          // Add user info to token
          token._id = existingUser?.UserID?.toString() ?? newUserId?.toString();
          token.isVerified = existingUser?.IsVerified ?? true;

          return token;
        } catch (error) {
          console.error("Error handling Google login:", error);
          throw new Error("Error during Google authentication");
        }
      }

      // Handle Credentials login
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.full_Name;
        token.isVerified = user.isVerified;
        token.onboardComplete = user.onboardComplete;
        token.role = user.role;
        token.avatar = user.avatar;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id ?? token._id,
        email: token.email,
        name: token.name,
        isVerified: token.isVerified,
        onboardComplete: token.onboardComplete,
        role: token.role,
        avatar: token.avatar ?? token.picture,
      };
      return session;
    },
  },

  pages: {
    signIn: "/auth/sign-in",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};