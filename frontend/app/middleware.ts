import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDashboardPath } from "@/lib/auth/roles";

export function middleware(req: NextRequest) {
  const userData = req.cookies.get("user_data")?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!userData) return NextResponse.redirect(new URL("/login", req.url));

    let user: { role?: string } | null = null;
    try {
      user = JSON.parse(userData);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname === "/dashboard") {
      return NextResponse.redirect(
        new URL(getDashboardPath(user?.role), req.url),
      );
    }

    if (pathname.startsWith("/dashboard/admin") && user?.role !== "admin") {
      return NextResponse.redirect(
        new URL(getDashboardPath(user?.role), req.url),
      );
    }

    if (pathname.startsWith("/dashboard/host") && user?.role !== "host") {
      return NextResponse.redirect(
        new URL(getDashboardPath(user?.role), req.url),
      );
    }

    if (
      pathname.startsWith("/dashboard/customer") &&
      user?.role !== "customer"
    ) {
      return NextResponse.redirect(
        new URL(getDashboardPath(user?.role), req.url),
      );
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
