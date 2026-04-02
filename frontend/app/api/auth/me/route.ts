// filepath: app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userDataCookie = req.cookies.get("user_data")?.value;

    if (!userDataCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = JSON.parse(userDataCookie);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}