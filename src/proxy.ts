import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Ariel's private "Ariel" tasks section — only this email may see or reach it.
const ARIEL_EMAIL = "ariel1w@gmail.com";

export async function proxy(request: NextRequest) {
  const session = await auth();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isAuthRoute = pathname.startsWith("/api/auth");

  // Allow auth routes and login page
  if (isAuthRoute || isLoginPage) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Private "Ariel" section: page + API are reachable only by Ariel.
  const isArielArea =
    pathname === "/tasks" ||
    pathname.startsWith("/tasks/") ||
    pathname === "/api/tasks" ||
    pathname.startsWith("/api/tasks/");
  if (isArielArea && session.user?.email?.toLowerCase() !== ARIEL_EMAIL) {
    // API → 403 JSON; page → bounce to the CRM.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not found" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/contacts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.jpg|bg-contacts.png|.*\\.svg).*)"],
};
