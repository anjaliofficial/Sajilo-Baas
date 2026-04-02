import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    // Get form data from request
    const formData = await req.formData();

    console.log(
      "[UPLOAD PROXY] Forwarding to backend:",
      `${API_BASE}/api/files/upload`,
    );

    // Forward to backend
    const response = await fetch(`${API_BASE}/api/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log("[UPLOAD PROXY] Backend response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("[UPLOAD PROXY] Error response:", text);
      return NextResponse.json(
        { success: false, message: `Upload failed (${response.status})` },
        { status: response.status },
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("[UPLOAD PROXY] Non-JSON response:", text);
      return NextResponse.json(
        { success: false, message: "Invalid response from server" },
        { status: 500 },
      );
    }

    const data = await response.json();
    console.log("[UPLOAD PROXY] Backend response data:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 },
    );
  }
}
