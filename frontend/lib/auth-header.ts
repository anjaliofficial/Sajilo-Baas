export function toBearerAuthHeader(
  cookieToken?: string | null,
  headerAuth?: string | null,
) {
  const token = cookieToken || headerAuth;
  if (!token) return undefined;

  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}