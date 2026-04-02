import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ otherUserId: string; listingId: string }> },
) {
  const token = _req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { otherUserId, listingId } = await params;
  const query = new URL(_req.url).searchParams.toString();

  try {
    const res = await fetch(
      `${API_BASE}/api/messages/${otherUserId}/${listingId}${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    console.error(`Backend error - Status: ${res.status}, Response: ${text}`);
    return NextResponse.json(
      { message: "Failed to fetch messages from backend" },
      { status: res.status || 500 },
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
