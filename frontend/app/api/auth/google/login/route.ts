import { NextRequest, NextResponse } from "next/server";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Google token is required" },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/api/auth/google/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok || !data?.success || !data?.user || !data?.token) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Google login failed",
        },
        { status: response.status || 401 },
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        message: data.message || "Google login successful",
        user: data.user,
        token: data.token,
      },
      { status: 200 },
    );

    res.cookies.set("user_data", JSON.stringify(data.user), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set("token", data.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Google login request failed" },
      { status: 500 },
    );
  }
}