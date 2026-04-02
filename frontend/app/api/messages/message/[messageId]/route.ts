import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await params;
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const backendUrl = `${API_BASE}/api/messages/${messageId}`;
    console.log("Calling backend PUT:", backendUrl, "with body:", body);

    const res = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", res.status);
    const contentType = res.headers.get("content-type");
    console.log("Backend response content-type:", contentType);

    // Check status first
    if (!res.ok) {
      let errorData: any;
      if (contentType?.includes("application/json")) {
        errorData = await res.json();
      } else {
        const text = await res.text();
        console.error(
          "Non-JSON error response from backend:",
          text.substring(0, 200),
        );
        return NextResponse.json(
          {
            message: "Server error: Invalid response from backend",
            details: `Expected JSON but got ${contentType || "unknown content-type"}`,
          },
          { status: res.status || 500 },
        );
      }
      return NextResponse.json(
        { message: errorData.message || "Failed to edit message" },
        { status: res.status },
      );
    }

    // Only try to parse as JSON if content-type indicates JSON
    if (!contentType?.includes("application/json")) {
      const text = await res.text();
      console.error(
        "Unexpected content-type from backend:",
        contentType,
        "body:",
        text.substring(0, 200),
      );
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error in PUT route:", error);
    return NextResponse.json(
      { message: "Failed to edit message", error: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await params;
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body might be empty, that's okay
      body = {};
    }

    const backendUrl = `${API_BASE}/api/messages/${messageId}`;
    console.log("Calling backend DELETE:", backendUrl, "with body:", body);

    const res = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", res.status);
    const contentType = res.headers.get("content-type");
    console.log("Backend response content-type:", contentType);

    // Check status first
    if (!res.ok) {
      let errorData: any;
      if (contentType?.includes("application/json")) {
        errorData = await res.json();
      } else {
        const text = await res.text();
        console.error(
          "Non-JSON error response from backend:",
          text.substring(0, 200),
        );
        return NextResponse.json(
          {
            message: "Server error: Invalid response from backend",
            details: `Expected JSON but got ${contentType || "unknown content-type"}`,
          },
          { status: res.status || 500 },
        );
      }
      return NextResponse.json(
        { message: errorData.message || "Failed to delete message" },
        { status: res.status },
      );
    }

    // Only try to parse as JSON if content-type indicates JSON
    if (!contentType?.includes("application/json")) {
      const text = await res.text();
      console.error(
        "Unexpected content-type from backend:",
        contentType,
        "body:",
        text.substring(0, 200),
      );
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error in DELETE route:", error);
    return NextResponse.json(
      { message: "Failed to delete message", error: String(error) },
      { status: 500 },
    );
  }
}
