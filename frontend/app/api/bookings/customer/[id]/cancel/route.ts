import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get("token")?.value;
  const { id } = await params;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = `${API_BASE}/api/bookings/customer/${id}/cancel`;
    console.log(`[CANCEL] PUT ${url}`);
    console.log(`[CANCEL] API_BASE: ${API_BASE}`);
    console.log(`[CANCEL] Booking ID: ${id}`);
    console.log(`[CANCEL] Has token: ${!!token}`);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`[CANCEL] Response status: ${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      console.error("[CANCEL] Error response:", text.substring(0, 500));
      return NextResponse.json(
        { message: `Failed to cancel booking (${res.status})` },
        { status: res.status },
      );
    }

    const contentType = res.headers.get("content-type");
    console.log(`[CANCEL] Response content-type: ${contentType}`);

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("[CANCEL] Non-JSON response:", text.substring(0, 500));
      return NextResponse.json(
        { message: `Server returned non-JSON response (status ${res.status})` },
        { status: 500 },
      );
    }

    const data = await res.json();
    console.log("[CANCEL] Response data:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[CANCEL] Error:", error);
    return NextResponse.json(
      {
        message:
          "Failed to cancel booking: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}
