/**
 * @file Next.js Middleware for request proxying and authentication.
 *
 * @description
 * This middleware serves as the primary entry point for incoming requests. It is engineered for
 * performance and security, handling three main responsibilities:
 * 1.  **Routing**: Efficiently bypasses authentication for predefined public routes.
 * 2.  **Authentication**: Verifies the presence of a valid session token for all private routes.
 * 3.  **Request Enrichment**: Securely identifies the client's real IP address and forwards it
 *     in the request headers for consumption by API routes or backend services.
 *
 * This module should be imported and used within the primary `middleware.ts` file.
 */

// Development mode flag - only filter private IPs in production
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// --- Configuration Constants ---

/**
 * An array of route prefixes that are publicly accessible and do not require authentication.
 * Optimized for fast checking using a pre-compiled regular expression.
 * @see {@link publicPathRegex}
 */
const PUBLIC_ROUTES = [
  "/sign-in",
  "/_next",
  "/static",
  "/favicon.ico",
  "/images",
  "/api/auth",
];

/**
 * A prioritized list of HTTP headers used to determine the client's real IP address.
 * The middleware iterates through this list and uses the first valid, public IP it finds.
 * The order reflects a trust hierarchy, from custom/trusted headers to standard ones.
 */
const IP_FORWARDING_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "x-vercel-forwarded-for",
];

// --- Pre-compiled Patterns for Performance ---

/**
 * A pre-compiled regular expression for efficiently matching public routes.
 * This pattern is generated once at module load time to avoid repeated compilation on each request.
 * It ensures that only full path segments are matched (e.g., `/sign-in` matches but `/sign-in-again` does not).
 */
const publicPathRegex = new RegExp(`^(${PUBLIC_ROUTES.join("|")})($|/.*)`);

/**
 * A pre-compiled regular expression to validate IPv4 and IPv6 addresses.
 */
const ipAddressRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})$|^:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)$|^(?:fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,})$|^(?:(?:0{1,4}:){1,6})?:(?:[0-9a-fA-F]{1,4}|0)$|^(?:[0-9a-fA-F]{1,4}:){6}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * A pre-compiled regular expression that identifies private, loopback, and reserved IP ranges
 * for both IPv4 and IPv6 to find the first public-facing IP.
 */
const privateIpRegex =
  /^(::1|::ffff:127\.|fe80:|fc00:|fd00:|10\.|127\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/;

// --- Type Definitions ---

/**
 * Defines the expected structure of the NextAuth session token.
 */
interface AuthToken {
  accessToken?: unknown;
  user?: { id: string; email: string };
}

// --- Core Middleware Logic ---

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // 1. Bypass authentication for public routes for maximum performance.
  if (publicPathRegex.test(pathname)) {
    return NextResponse.next();
  }

  // 2. For all other routes, validate the session token.
  const token = (await getToken({ req })) as AuthToken | null;

  // Securely check for a valid token and a string accessToken.
  if (!token || typeof token.accessToken !== "string") {
    return redirectToSignIn(req);
  }

  // 3. Enrich request with the client's real IP and proceed.
  const headers = new Headers(req.headers);
  const clientIp = getClientIp(req);

  headers.set("X-Forwarded-For", clientIp); // Standard header for proxies
  headers.set("X-Real-IP", clientIp); // Common header for client IP

  return NextResponse.next({ request: { headers } });
}

// --- Helper Functions ---

/**
 * Securely extracts the client IP address from request headers.
 * In development mode: Allows private IPs for local development
 * In production mode: Only allows public IPs for security
 * @param req - The incoming `NextRequest`.
 * @returns The determined IP address or '127.0.0.1' as a fallback.
 */
function getClientIp(req: NextRequest): string {
  for (const headerName of IP_FORWARDING_HEADERS) {
    const headerValue = req.headers.get(headerName);
    if (headerValue) {
      // Headers like X-Forwarded-For can contain a list of IPs.
      // The client's IP is typically the first one in the list.
      const ips = headerValue.split(",").map((ip) => ip.trim());
      for (const ip of ips) {
        if (ipAddressRegex.test(ip)) {
          // In development, allow private IPs for local testing
          // In production, only allow public IPs for security
          if (IS_DEVELOPMENT || !privateIpRegex.test(ip)) {
            return ip;
          }
        }
      }
    }
  }
  // Fallback if no valid IP is found.
  return "127.0.0.1";
}

/**
 * Constructs a redirect response to the sign-in page, preserving the user's
 * originally intended destination as a callback URL. It also clears session
 * cookies to ensure a clean login flow.
 * @param req - The `NextRequest` that triggered the redirect.
 * @returns A `NextResponse` configured to redirect the user.
 */
function redirectToSignIn(req: NextRequest): NextResponse {
  const signInUrl = new URL("/sign-in", req.nextUrl.origin);
  const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;

  signInUrl.searchParams.set("callbackUrl", callbackUrl);

  const response = NextResponse.redirect(signInUrl);

  // Clean up session cookies on redirect.
  response.cookies.delete("__Secure-next-auth.session-token");
  response.cookies.delete("next-auth.session-token");

  return response;
}
