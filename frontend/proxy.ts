import { NextRequest, NextResponse } from "next/server";
import { getDashboardPath } from "./lib/auth/roles";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const userData = request.cookies.get("user_data")?.value;
  if (!userData) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let user: { role?: string } | null = null;
  try {
    user = JSON.parse(userData);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(
      new URL(getDashboardPath(user?.role), request.url),
    );
  }

  if (pathname.startsWith("/dashboard/admin") && user?.role !== "admin") {
    return NextResponse.redirect(
      new URL(getDashboardPath(user?.role), request.url),
    );
  }

  if (pathname.startsWith("/dashboard/host") && user?.role !== "host") {
    return NextResponse.redirect(
      new URL(getDashboardPath(user?.role), request.url),
    );
  }

  if (pathname.startsWith("/dashboard/customer") && user?.role !== "customer") {
    return NextResponse.redirect(
      new URL(getDashboardPath(user?.role), request.url),
    );
  }

  return NextResponse.next();
}
