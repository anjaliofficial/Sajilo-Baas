const TOKEN_KEY = "token";
const USER_KEY = "user_data";

const isBrowser = () => typeof window !== "undefined";

export const setToken = (token: string) => {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
};

export const setUserData = (user: unknown) => {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserData = <T = unknown>() => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const clearUserData = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(USER_KEY);
};
