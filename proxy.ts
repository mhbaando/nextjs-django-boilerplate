import { NextRequest, NextResponse } from "next/server";
import { validateVerificationParams } from "@/lib/verification";

// --- Configuration ---

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

const PUBLIC_ROUTES = [
  "/sign-in",
  "/forget-password",
  "/_next",
  "/static",
  "/favicon.ico",
  "/images",
  "/api/auth",
];

const SEMI_PUBLIC_ROUTES = ["/verify-otp", "/change-password"];

const IP_FORWARDING_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "x-vercel-forwarded-for",
];

// --- Regex Helpers ---

const ipAddressRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})$|^:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)$|^(?:fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,})$|^(?:(?:0{1,4}:){1,6})?:(?:[0-9a-fA-F]{1,4}|0)$|^(?:[0-9a-fA-F]{1,4}:){6}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const privateIpRegex =
  /^(::1|::ffff:127\.|fe80:|fc00:|fd00:|10\.|127\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/;

/**
 * Middleware Matcher
 */
export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

// --- Core Logic ---

export default async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const tokenParam = searchParams.get("token");

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isSemiPublic = SEMI_PUBLIC_ROUTES.includes(pathname);
  const isAuthenticated = !!req.cookies.get("app_session")?.value;

  /**
   * 1. Handle Semi-Public Routes (Token Validation)
   */
  if (isSemiPublic) {
    if (!tokenParam) return redirectToSignIn(req, "token_missing");

    const result = await validateVerificationParams(
      tokenParam,
      pathname === "/verify-otp"
        ? "otp"
        : pathname === "/change-password"
          ? "password_change"
          : "password_reset",
    );

    if (!result.valid || !result.email) {
      return redirectToSignIn(req);
    }
  }

  /**
   * 2. Auth Guards
   */
  // Redirect unauthenticated users trying to access private pages
  if (!isAuthenticated && !isPublic && !isSemiPublic) {
    return redirectToSignIn(req);
  }

  // Redirect authenticated users away from public pages (like sign-in) to home
  if (isAuthenticated && isPublic && pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  /**
   * 3. IP Proxying & Header Enrichment
   */
  const clientIp = getClientIp(req);
  const requestHeaders = new Headers(req.headers);

  requestHeaders.set("X-Forwarded-For", clientIp);
  requestHeaders.set("X-Real-IP", clientIp);

  // Return next() with the enriched headers, but NO tenant rewrites
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// --- Helpers ---

function getClientIp(req: NextRequest): string {
  for (const headerName of IP_FORWARDING_HEADERS) {
    const headerValue = req.headers.get(headerName);
    if (headerValue) {
      const ips = headerValue.split(",").map((ip) => ip.trim());
      for (const ip of ips) {
        if (ipAddressRegex.test(ip)) {
          if (IS_DEVELOPMENT || !privateIpRegex.test(ip)) {
            return ip;
          }
        }
      }
    }
  }
  return "127.0.0.1";
}

function redirectToSignIn(req: NextRequest, error?: string): NextResponse {
  const signInUrl = new URL("/sign-in", req.nextUrl.origin);
  const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;

  signInUrl.searchParams.set("callbackUrl", callbackUrl);
  if (error) signInUrl.searchParams.set("error", error);

  const response = NextResponse.redirect(signInUrl);

  // Clear any stale session cookies on a forced redirect to sign-in
  response.cookies.delete("app_session");
  return response;
}
