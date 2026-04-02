import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const token = req.cookies.get("token")?.value;

  try {
    // Check if this is for "my" bookings endpoint (supports both /bookings/my and /bookings/customer/my)
    if (
      url.pathname.endsWith("/bookings/my") ||
      url.pathname.endsWith("/bookings/customer/my")
    ) {
      if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      const query = searchParams.toString();
      const res = await fetch(
        `${API_BASE}/api/bookings/customer/my${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) {
        const responseText = await res.text();
        console.error(
          `Backend error - Status: ${res.status}, Response: ${responseText}`,
        );
        return NextResponse.json(
          { message: "Failed to fetch bookings from backend" },
          { status: res.status },
        );
      }
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Check availability (public endpoint)
    if (searchParams.has("checkInDate")) {
      const res = await fetch(
        `${API_BASE}/api/bookings/customer/availability${url.search}`,
      );

      if (!res.ok) {
        const responseText = await res.text();
        console.error(
          `Backend error - Status: ${res.status}, Response: ${responseText}`,
        );
        return NextResponse.json(
          { message: "Failed to check availability from backend" },
          { status: res.status },
        );
      }
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Default GET - requires auth
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const query = searchParams.toString();
    const res = await fetch(
      `${API_BASE}/api/bookings${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      const responseText = await res.text();
      console.error(
        `Backend error - Status: ${res.status}, Response: ${responseText}`,
      );
      return NextResponse.json(
        { message: "Failed to fetch bookings from backend" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/bookings/customer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const responseText = await res.text();
      console.error(
        `Backend error - Status: ${res.status}, Response: ${responseText}`,
      );
      console.error(
        `Backend error - Status: ${res.status}, Response: ${responseText}`,
      );
      if (res.status === 409) {
        return NextResponse.json(
          {
            message:
              "The selected dates are already booked. Please choose different dates.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { message: "Failed to create booking from backend" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { message: "Failed to create booking" },
      { status: 500 },
    );
  }
}
