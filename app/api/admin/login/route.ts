import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
} from "@/lib/admin-auth";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`admin-login:${ip}`)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Admin login is not configured on the server." },
      { status: 500 }
    );
  }

  if (!body.password || !timingSafeStringEqual(body.password, adminPassword)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createAdminSessionToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  return response;
}
