"use server";
import { cookies } from "next/headers";

const API_BASE = "http://127.0.0.1:5050/api";

export async function registerUser(form: {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
  confirmPassword: string;
  role: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Registration failed",
        user: null,
      };
    }

    // Set cookie on server
    const cookieStore = await cookies();
    if (data.user) {
      cookieStore.set("user_data", JSON.stringify(data.user), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (data.token) {
      cookieStore.set("token", data.token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // Return user data to client so it can store in localStorage
    return { success: true, user: data.user, token: data.token };
  } catch (error) {
    return { success: false, message: "Connection failed", user: null };
  }
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok || !data.user) {
      return {
        success: false,
        message: data.message || "Login failed",
        user: null,
        token: null,
      };
    }

    // Set cookie on server
    const cookieStore = await cookies();
    cookieStore.set("user_data", JSON.stringify(data.user), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (data.token) {
      cookieStore.set("token", data.token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // Return user data to client so it can store in localStorage
    return { success: true, user: data.user, token: data.token };
  } catch (error) {
    return {
      success: false,
      message: "Connection failed",
      user: null,
      token: null,
    };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("user_data");
  cookieStore.delete("token");
  return { success: true };
}
