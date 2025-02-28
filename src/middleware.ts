import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface AuthToken {
  isNewUser?: boolean;
  onboardComplete?: boolean;
  _id?: string;
  role?: "Instructor" | "Student";
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Get the NextAuth.js token
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as AuthToken | null;
  console.log(token);

  // Allow access to the onboarding page without further redirection
  if (url.pathname === "/onboarding") {
    return NextResponse.next();
  }

  if (token) {
    const { isNewUser, onboardComplete, _id: userId, role } = token;

    // Redirect to onboarding if the user is new and hasn't completed onboarding
    if (isNewUser && onboardComplete === false) {
      url.pathname = `/onboarding`;

      // Add the user's _id to the query parameters if it exists
      if (typeof userId === "string") {
        url.searchParams.set("userId", userId);
      }

      return NextResponse.redirect(url);
    }

    console.log(
      url.pathname === "/sign-in" ||
      url.pathname === "/sign-up" ||
      url.pathname.startsWith("/verify/") ||
      url.pathname === "/onboarding"
    );

    // If authenticated, redirect away from auth pages
    if (
      url.pathname === "/sign-in" ||
      url.pathname === "/sign-up" ||
      url.pathname.startsWith("/verify/") ||
      url.pathname === "/onboarding"
    ) {
      url.pathname = role === "Instructor" ? "/instructor/dashboard" : "/student/dashboard";
      return NextResponse.redirect(url);
    }
  } else {
    // If no token and not on allowed pages (sign-in, sign-up, onboarding)
    if (
      url.pathname === "/sign-in" ||
      url.pathname === "/sign-up" ||
      url.pathname === "/onboarding" ||
      url.pathname.startsWith("/verify")
    ) {
      return NextResponse.next();
    }

    // Redirect to sign-in if unauthenticated
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // If all conditions are passed, continue to the next middleware or route
  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-in", "/sign-up", "/onboarding", "/verify/:path*"], // Pages to check for middleware
};
