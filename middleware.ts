import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/admin/booking/:path*",
    "/admin/slots/:path*",
    "/admin/bookings/:path*",
    "/admin/results/:path*",
  ],
};
