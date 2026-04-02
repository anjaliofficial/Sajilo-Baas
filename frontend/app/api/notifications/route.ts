import { NextRequest, NextResponse } from "next/server";
import { toBearerAuthHeader } from "@/lib/auth-header";

export async function GET(req: NextRequest) {
  // Forward the request to the backend API
  const backendUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://0.0.0.0:5050";
  const authHeader = toBearerAuthHeader(
    req.cookies.get("token")?.value,
    req.headers.get("authorization"),
  );

  const res = await fetch(`${backendUrl}/api/notifications`, {
    headers: {
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
