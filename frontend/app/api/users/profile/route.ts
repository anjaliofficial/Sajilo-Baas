import { NextRequest, NextResponse } from "next/server";
import { toBearerAuthHeader } from "@/lib/auth-header";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function PUT(req: NextRequest) {
  try {
    const authHeader = toBearerAuthHeader(
      req.cookies.get("token")?.value,
      req.headers.get("authorization"),
    );
    const body = await req.json();

    if (!authHeader) {
      console.error("[PROFILE UPDATE] No authorization found");
      return NextResponse.json(
        { success: false, message: "Authorization required" },
        { status: 401 },
      );
    }

    const url = `${API_BASE}/api/auth/update`;
    console.log("[PROFILE UPDATE] PUT", url);
    console.log("[PROFILE UPDATE] Body:", body);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log("[PROFILE UPDATE] Response status:", response.status);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(
        "[PROFILE UPDATE] Non-JSON response:",
        text.substring(0, 500),
      );
      return NextResponse.json(
        { success: false, message: "Invalid response from server" },
        { status: response.status || 500 },
      );
    }

    const data = await response.json();
    console.log("[PROFILE UPDATE] Response data:", data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to update profile" },
        { status: response.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: data.user,
        message: "Profile updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PROFILE UPDATE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}
