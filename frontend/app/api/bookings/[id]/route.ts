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
  const { id } = await params;
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const responseText = await res.text();
      console.error(`Backend error - Status: ${res.status}, Response: ${responseText}`);
      return NextResponse.json(
        { message: "Failed to fetch booking from backend" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { message: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);

    // Handle cancel booking
    if (url.pathname.includes("/cancel")) {
      const res = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const responseText = await res.text();
        console.error(`Backend error - Status: ${res.status}, Response: ${responseText}`);
        return NextResponse.json(
          { message: "Failed to cancel booking from backend" },
          { status: res.status },
        );
      }

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Generic POST handler
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const responseText = await res.text();
      console.error(`Backend error - Status: ${res.status}, Response: ${responseText}`);
      return NextResponse.json(
        { message: "Failed to update booking from backend" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { message: "Failed to update booking" },
      { status: 500 },
    );
  }
}
