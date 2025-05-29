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

  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as AuthToken | null;

  // Allow access to onboarding without checks
  if (url.pathname === "/onboarding") {
    return NextResponse.next();
  }

  if (token) {
    const { isNewUser, onboardComplete, _id: userId, role } = token;

    // Redirect if user is new and not onboarded
    if (isNewUser && onboardComplete === false) {
      url.pathname = `/onboarding`;
      if (typeof userId === "string") {
        url.searchParams.set("userId", userId);
      }
      return NextResponse.redirect(url);
    }

    // Redirect if onboard incomplete but trying to access restricted routes
    if (
      isNewUser &&
      onboardComplete === false &&
      (url.pathname.startsWith("/student/") ||
        url.pathname.startsWith("/instructor/"))
    ) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (
      url.pathname === "/sign-in" ||
      url.pathname === "/sign-up" ||
      url.pathname === "/onboarding" ||
      url.pathname.startsWith("/verify")
    ) {
      url.pathname =
        role === "Instructor"
          ? "/instructor/dashboard"
          : "/student/dashboard";
      return NextResponse.redirect(url);
    }

    // Role-based redirection
    if (role === "Instructor" && url.pathname.startsWith("/student/")) {
      url.pathname = "/instructor/dashboard";
      return NextResponse.redirect(url);
    }

    if (role === "Student" && url.pathname.startsWith("/instructor/")) {
      url.pathname = "/student/dashboard";
      return NextResponse.redirect(url);
    }
  } else {
    // Publicly accessible pages
    if (
      url.pathname === "/sign-in" ||
      url.pathname === "/sign-up" ||
      url.pathname === "/onboarding" ||
      url.pathname.startsWith("/verify")
    ) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

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
