import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./admin/context/AuthContext";

export const metadata: Metadata = {
  title: "Sajilo Baas",
  description: "Property rental platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}