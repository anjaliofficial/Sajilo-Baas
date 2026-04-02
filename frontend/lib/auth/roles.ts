export type Role = "admin" | "host" | "customer";

export function getDashboardPath(role?: string) {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "host":
      return "/dashboard/host";
    case "customer":
    default:
      return "/dashboard/customer";
  }
}
