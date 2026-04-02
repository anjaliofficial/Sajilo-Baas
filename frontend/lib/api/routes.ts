// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("accessToken")?.value;

  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "1";
  const size = url.searchParams.get("size") || "10";

  const res = await fetch(`http://localhost:3000/api/users?page=${page}&size=${size}`, {
    headers: { cookie: `accessToken=${cookie}` },
  });

  if (!res.ok) return NextResponse.json({ data: [], total: 0, page: 1, size: 10 }, { status: 500 });

  const data = await res.json();
  return NextResponse.json(data);
  
}