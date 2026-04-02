import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();

  try {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Check if response is ok before parsing JSON
    if (!res.ok) {
      const responseText = await res.text();
      console.error(
        `Backend error - Status: ${res.status}, Response: ${responseText}`,
      );
      return NextResponse.json(
        { message: "Failed to create review from backend" },
        { status: res.status },
      );
    }

    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error(
        `Invalid content type: ${contentType}, Response body: ${await res.text()}`,
      );
      return NextResponse.json(
        { message: "Invalid response from backend" },
        { status: 500 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { message: "Failed to create review" },
      { status: 500 },
    );
  }
}
