export async function getUserDataClient() {
  try {
    const res = await fetch("/api/auth/me");
    const json = await res.json();
    return json.user || null;
  } catch {
    return null;
  }
}
