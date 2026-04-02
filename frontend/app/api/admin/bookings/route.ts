import { NextRequest, NextResponse } from "next/server";

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
      `${API_BASE}/api/admin/bookings${queryString ? `?${queryString}` : ""}`,
    );

    const cookieToken = req.cookies.get("token")?.value;
    const headerAuth = req.headers.get("authorization");
    const authHeader = cookieToken ? `Bearer ${cookieToken}` : headerAuth;

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
        `Admin bookings error - Status: ${response.status}, Response: ${text}`,
      );
      return NextResponse.json(
        { success: false, message: "Failed to fetch bookings from backend" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin bookings API error:", error);
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
    const bookingId = searchParams.get("id");

    const cookieToken = req.cookies.get("token")?.value;
    const headerAuth = req.headers.get("authorization");
    const authHeader = cookieToken ? `Bearer ${cookieToken}` : headerAuth;
    const body = await req.json();

    let url = `${API_BASE}/admin/bookings`;
    if (bookingId && action) {
      url = `${API_BASE}/admin/bookings/${bookingId}/${action}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin bookings API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
