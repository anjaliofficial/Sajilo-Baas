import { NextRequest, NextResponse } from "next/server";
import { toBearerAuthHeader } from "@/lib/auth-header";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = new URL(
      `${API_BASE}/api/admin/users${queryString ? `?${queryString}` : ""}`,
    );

    const authHeader = toBearerAuthHeader(
      req.cookies.get("token")?.value,
      req.headers.get("authorization"),
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Admin error - Status: ${response.status}, Response: ${text}`,
      );
      return NextResponse.json(
        { success: false, message: "Failed to fetch users from backend" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("id");

    const authHeader = toBearerAuthHeader(
      req.cookies.get("token")?.value,
      req.headers.get("authorization"),
    );
    const body = await req.json();

    let url = `${API_BASE}/api/admin/users`;
    if (userId && action) {
      url = `${API_BASE}/api/admin/users/${userId}/${action}`;
    } else if (userId) {
      url = `${API_BASE}/api/admin/users/${userId}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Admin error - Status: ${response.status}, Response: ${text}`,
      );
      return NextResponse.json(
        { success: false, message: "Failed to update user from backend" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 },
      );
    }

    const authHeader = toBearerAuthHeader(
      req.cookies.get("token")?.value,
      req.headers.get("authorization"),
    );

    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Admin error - Status: ${response.status}, Response: ${text}`,
      );
      return NextResponse.json(
        { success: false, message: "Failed to delete user from backend" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
