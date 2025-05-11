import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWTPayload } from "./types/auth";
import { TOKEN_COOKIE } from "./lib/cookies";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/login",
    "/signup",
  ];
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.split(" ")[1] || request.cookies.get(TOKEN_COOKIE)?.value;

  // Check if token exists
  if (!token) {
    // For API routes, return JSON response
    if (path.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
    // For web routes, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verify token using jose library (Edge compatible)
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const decoded = payload as JWTPayload;

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("user", JSON.stringify(decoded));

    // Role-based access control
    if (path.startsWith("/api/admin") && decoded.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    if (path.startsWith("/api/agent") && decoded.role !== "AGENT") {
      return new NextResponse(
        JSON.stringify({ error: "Agent access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    // For web routes, check role-based access
    if (path.startsWith("/admin") && decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (path.startsWith("/agent") && decoded.role !== "AGENT") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If we're at the root path, redirect to the appropriate dashboard
    if (path === "/") {
      if (decoded.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/agent", request.url));
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);

    // For API routes, return JSON response
    if (path.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    // For web routes, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
