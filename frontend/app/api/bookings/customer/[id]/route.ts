import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("token")?.value;

    console.log(
      "🔍 [API ROUTE] GET /api/bookings/customer/[id] - Booking ID:",
      id,
      "Token:",
      !!token,
    );

    if (!token) {
      console.error("❌ [API ROUTE] No token in cookies");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = `${API_BASE}/api/bookings/customer/${id}`;
    console.log("🔍 [API ROUTE] Forwarding to backend:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("🔍 [API ROUTE] Backend response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ [API ROUTE] Backend error:", text);
      return NextResponse.json(
        { success: false, message: "Failed to fetch booking" },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("✅ [API ROUTE] Success - Booking:", data.booking?._id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ [API ROUTE] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("token")?.value;

    console.log(
      "🔍 [API ROUTE] PUT /api/bookings/customer/[id]/cancel - Booking ID:",
      id,
    );

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = `${API_BASE}/api/bookings/customer/${id}/cancel`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ [API ROUTE] Backend error:", text);
      return NextResponse.json(
        { success: false, message: "Failed to cancel booking" },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("✅ [API ROUTE] Booking cancelled successfully");
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ [API ROUTE] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
