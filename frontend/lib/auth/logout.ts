
import { clearToken } from "@/lib/auth/storage";

export const logout = (router: any) => {
  clearToken();
  router.push("/login");
};
