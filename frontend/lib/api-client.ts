import { getUserData } from "@/lib/cookie";
import { NextRequest, NextResponse } from "next/server";

// Optional: restrict route to certain roles
type Role = "admin" | "host" | "customer";
const allowedRoles: Role[] = ["admin"]; // Change roles per route if needed

export async function GET(_req: NextRequest) {
  try {
    const user = await getUserData();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // If you want, fetch data from backend API
    // const res = await fetch("http://localhost:5050/api/users", {
    //   headers: { Authorization: `Bearer ${user.token}` },
    // });
    // const data = await res.json();

    return NextResponse.json({ user }); // Return user info only
  } catch (err) {
    return NextResponse.json({ message: "Error fetching user" }, { status: 500 });
  }
}
