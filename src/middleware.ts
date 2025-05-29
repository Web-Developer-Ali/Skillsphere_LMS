import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt";

// interface AuthToken {
//   isNewUser?: boolean;
//   onboardComplete?: boolean;
//   _id?: string;
//   role?: "Instructor" | "Student";
// }

export async function middleware() {

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/onboarding",
    "/verify/:path*",
    "/student/:path*",
    "/instructor/:path*",
  ],
};
