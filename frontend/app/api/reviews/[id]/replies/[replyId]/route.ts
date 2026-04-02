import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; replyId: string }> },
) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, replyId } = await context.params;
  const payload = await req.json();

  if (!id || !replyId) {
    return NextResponse.json(
      { message: "Review ID and Reply ID are required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/reviews/${id}/replies/${replyId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

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
    console.error("Error updating reply:", error);
    return NextResponse.json(
      { message: "Failed to update reply" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; replyId: string }> },
) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, replyId } = await context.params;

  if (!id || !replyId) {
    return NextResponse.json(
      { message: "Review ID and Reply ID are required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/reviews/${id}/replies/${replyId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(data, { status: res.status });
      }
      return NextResponse.json(data, { status: res.status });
    } else {
      if (!res.ok) {
        return NextResponse.json(
          { message: `Delete failed with status ${res.status}` },
          { status: res.status },
        );
      }
      return NextResponse.json(
        { message: "Reply deleted successfully" },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json(
      { message: "Failed to delete reply" },
      { status: 500 },
    );
  }
}
