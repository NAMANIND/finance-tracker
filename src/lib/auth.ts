import { NextRequest } from "next/server";
import { JWTPayload } from "@/types/auth";

export function getAuthUser(request: NextRequest): JWTPayload | null {
  try {
    const userStr = request.headers.get("user");
    if (!userStr) return null;
    return JSON.parse(userStr) as JWTPayload;
  } catch {
    return null;
  }
}

export function requireAuth(request: NextRequest): JWTPayload {
  const user = getAuthUser(request);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function requireAdmin(request: NextRequest): JWTPayload {
  const user = requireAuth(request);
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return user;
}

export function requireAgent(request: NextRequest): JWTPayload {
  const user = requireAuth(request);
  if (user.role !== "AGENT") {
    throw new Error("Agent access required");
  }
  return user;
}
