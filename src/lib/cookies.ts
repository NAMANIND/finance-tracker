import Cookies from "js-cookie";

// Cookie names
export const TOKEN_COOKIE = "auth_token";
export const USER_COOKIE = "user_data";

// Cookie options
const cookieOptions = {
  expires: 365, // 1 year
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Set auth cookies
export const setAuthCookies = (token: string, user: User) => {
  Cookies.set(TOKEN_COOKIE, token, cookieOptions);
  Cookies.set(USER_COOKIE, JSON.stringify(user), cookieOptions);
};

// Get auth cookies
export function getAuthCookies(): { token: string | null; user: User | null } {
  const token = Cookies.get(TOKEN_COOKIE) || null;
  const userStr = Cookies.get(USER_COOKIE);
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
}

// Remove auth cookies
export const removeAuthCookies = () => {
  Cookies.remove(TOKEN_COOKIE);
  Cookies.remove(USER_COOKIE);
};
