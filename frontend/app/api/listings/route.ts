import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.toString();
  const res = await fetch(
    `${API_BASE}/api/listings${query ? `?${query}` : ""}`,
  );

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text();
  return NextResponse.json(
    { message: "Upstream response was not JSON", details: text },
    { status: res.status || 500 },
  );
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const res = await fetch(`${API_BASE}/api/listings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text();
  return NextResponse.json(
    { message: "Upstream response was not JSON", details: text },
    { status: res.status || 500 },
  );
}
