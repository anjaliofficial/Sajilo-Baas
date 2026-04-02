import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  console.log("GET /api/listings/my - Token present:", !!token);

  if (!token) {
    console.log("GET /api/listings/my - No token found");
    return NextResponse.json(
      { message: "Unauthorized", listings: [] },
      { status: 401 },
    );
  }

  try {
    const url = `${API_BASE}/api/listings/my`;
    console.log("GET /api/listings/my - Fetching from:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("GET /api/listings/my - Backend response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("GET /api/listings/my - Error response:", text.substring(0, 500));
      return NextResponse.json(
        { message: "Failed to fetch listings", listings: [] },
        { status: res.status },
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      console.log("GET /api/listings/my - Response data:", data);
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    console.log("GET /api/listings/my - Non-JSON response:", text);
    return NextResponse.json(
      {
        message: "Upstream response was not JSON",
        details: text,
        listings: [],
      },
      { status: 500 },
    );
  } catch (error) {
    console.error("GET /api/listings/my - Error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch listings",
        listings: [],
        error: String(error),
      },
      { status: 500 },
    );
  }
}
