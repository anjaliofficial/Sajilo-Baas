import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await req.json();

  if (!id) {
    return NextResponse.json(
      { message: "Review ID is required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_BASE}/api/reviews/${id}/replies`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const responseText = await res.text();
      console.error(
        `Invalid content type: ${contentType}, Response body: ${responseText}`,
      );
      return NextResponse.json(
        { message: "Invalid response from backend" },
        { status: 500 },
      );
    }

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error adding reply:", error);
    return NextResponse.json(
      { message: "Failed to add reply" },
      { status: 500 },
    );
  }
}
