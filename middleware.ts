import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getBaseUrl } from "@/lib/utils";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") || // Allow auth routes including discord
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Get Session
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  console.log(`Middleware [${pathname}]: LoggedIn=${session.user?.isLoggedIn}, Role=${session.user?.role}`);


  const isLoggedIn = session.user?.isLoggedIn;
  const role = session.user?.role || 'admin'; // Default to admin for legacy sessions, but we should be careful

  // Admin Dashboard Protection
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", getBaseUrl(request.url)));
    }
    // If logged in as 'user', redirect them to their dashboard
    if (role === 'user') {
      return NextResponse.redirect(new URL("/user", getBaseUrl(request.url)));
    }
  }

  // User Dashboard Protection
  if (pathname.startsWith("/user")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", getBaseUrl(request.url)));
    }
    // If logged in as 'admin', possibly allow or redirect. Let's redirect to admin dashboard to keep strict separation
    if (role === 'admin') {
      return NextResponse.redirect(new URL("/dashboard", getBaseUrl(request.url)));
    }
  }

  // API Protection
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    // Add specific API role checks in the route handlers themselves, 
    // but we could enforce basic login here.
  }

  // Redirect root
  if (pathname === "/") {
    if (isLoggedIn) {
      if (role === 'user') {
        return NextResponse.redirect(new URL("/user", getBaseUrl(request.url)));
      }
      return NextResponse.redirect(new URL("/dashboard", getBaseUrl(request.url)));
    }
      return NextResponse.redirect(new URL("/login", getBaseUrl(request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
