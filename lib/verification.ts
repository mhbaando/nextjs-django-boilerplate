// lib/verification.ts
"use server";

import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-key",
);

// Define all verification types
type VerificationType = "otp" | "password_reset" | "password_change";

/**
 * Generate a secure verification token for programmatic navigation (server-side only)
 */
export async function generateVerificationToken(
  type: VerificationType, // Changed from "otp" to VerificationType
  email: string,
  callbackUrl?: string,
): Promise<string> {
  const payload: {
    type: VerificationType;
    email?: string;
    callbackUrl?: string;
    iat: number;
    exp: number;
  } = {
    type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes expiry
  };

  // Conditionally include email
  if (type === "otp" || type === "password_change") {
    payload.email = email;
  }

  if (callbackUrl) {
    payload.callbackUrl = callbackUrl;
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a verification token (server-side only)
 */
export async function verifyVerificationToken(
  token: string,
  expectedType: VerificationType, // Changed from string to VerificationType
): Promise<{
  valid: boolean;
  email?: string;
  callbackUrl?: string;
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== expectedType) {
      return {
        valid: false,
        error: "Invalid verification type",
      };
    }

    return {
      valid: true,
      email: payload.email as string,
      callbackUrl: payload.callbackUrl as string | undefined,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
}

/**
 * Create verification URL with secure token (server-side only)
 */
export async function createVerificationUrl(
  type: VerificationType, // Changed from "otp" to VerificationType
  email: string,
  basePath: string,
  callbackUrl?: string,
): Promise<string> {
  const token = await generateVerificationToken(type, email, callbackUrl);

  // Get the proper base URL for the environment
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_BASE_URL
      : "http://localhost:3000");

  const url = new URL(basePath, baseUrl);
  url.searchParams.set("token", token);

  console.log(
    `[Verification] Created secure verification URL for ${type}: ${url.toString()}`,
  );
  return url.toString();
}

/**
 * Create verification redirect with secure token (server-side only)
 */
export async function createVerificationRedirect(
  type: VerificationType, // Changed from "otp" to VerificationType
  email: string,
  fallbackPath: string,
  callbackUrl?: string,
): Promise<{
  success: boolean;
  redirectUrl: string;
  method: "secure_token";
}> {
  console.log(
    `[Verification] Creating secure ${type} verification URL for ${email}`,
  );

  const redirectUrl = await createVerificationUrl(
    type,
    email,
    fallbackPath,
    callbackUrl,
  );

  return {
    success: true,
    redirectUrl,
    method: "secure_token",
  };
}

/**
 * Validate verification token from URL parameters (server-side only)
 */
export async function validateVerificationParams(
  token: string | null,
  expectedType: VerificationType, // Changed from string to VerificationType
): Promise<{
  valid: boolean;
  email?: string;
  callbackUrl?: string;
  error?: string;
}> {
  if (!token) {
    return {
      valid: false,
      error: "Missing verification token",
    };
  }

  return await verifyVerificationToken(token, expectedType);
}

/**
 * Client-side validation action wrapper
 */
export async function validateVerificationParamsAction(
  token: string | null,
  expectedType: VerificationType, // Changed from string to VerificationType
): Promise<{
  valid: boolean;
  email?: string;
  callbackUrl?: string;
  error?: string;
}> {
  "use server";
  return await validateVerificationParams(token, expectedType);
}
