import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { cookies } from "next/headers";

export async function POST() {
  const session = await getSession();
  const cookieStore = await cookies();

  session.destroy();
  cookieStore.delete("trusted_device");

  return NextResponse.json({ success: true });
}
