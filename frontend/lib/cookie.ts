"use server";
import { cookies } from "next/headers";

export type Role = "customer" | "host" | "admin";

export interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber: string;
  address: string;
  profilePicture: string;
}

export const setUserData = async (user: UserData) => {
  const cookieStore = await cookies();
  cookieStore.set("user_data", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
};

export const getUserData = async (): Promise<UserData | null> => {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user_data");
  
  if (!userCookie) return null;
  
  try {
    return JSON.parse(userCookie.value);
  } catch {
    return null;
  }
};

export const clearAuthCookies = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("user_data");
};