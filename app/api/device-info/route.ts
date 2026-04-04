import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  let city = "Unknown";
  let country = "Unknown";

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await res.json();

    city = geo.city || "Unknown";
    country = geo.country_name || "Unknown";
  } catch {}

  return NextResponse.json({
    ip_address: ip,
    city,
    country,
  });
}
