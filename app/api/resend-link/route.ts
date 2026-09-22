import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils";
import { sendResendLinkEmail } from "@/lib/resend/emails";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim();

  // Always return the same success response regardless of outcome, so we
  // never reveal whether an email address has a session on file.
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = supabaseServer();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("student_email", email);

    const bookingIds = (bookings ?? []).map((b) => b.id);

    if (bookingIds.length > 0) {
      const { data: session } = await supabase
        .from("sessions")
        .select("token")
        .in("booking_id", bookingIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session) {
        await sendResendLinkEmail(email, session.token);
      }
    }
  } catch (err) {
    console.error("resend-link lookup/send failed:", err);
  }

  return NextResponse.json({ success: true });
}
