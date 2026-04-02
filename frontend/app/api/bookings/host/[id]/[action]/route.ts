import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const token = req.cookies.get("token")?.value;
  const { id, action } = await params;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = `${API_BASE}/api/bookings/host/${id}/${action}`;
    console.log(`PUT ${url}`);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    console.log(`Response status: ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: res.status || 500 },
      );
    }

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { message: "Failed to update booking" },
      { status: 500 },
    );
  }
}
