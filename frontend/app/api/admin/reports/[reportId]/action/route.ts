import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const { reportId } = await params;
    const body = await req.json();

    const cookieToken = req.cookies.get("token")?.value;
    const headerAuth = req.headers.get("authorization");
    const authHeader = cookieToken ? `Bearer ${cookieToken}` : headerAuth;

    const response = await fetch(
      `${API_BASE}/api/moderation/reports/${reportId}/action`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin report action API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
