import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils";
import { sendAiTestReceivedEmail, sendNewAiTestAlertEmail } from "@/lib/resend/emails";
import type { AiTestBooking } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; transaction_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, transaction_id } = body;

  if (!name?.trim() || !transaction_id?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: booking, error: insertError } = await supabase
    .from("ai_test_bookings")
    .insert({
      student_name: name.trim(),
      student_email: email.trim(),
      transaction_id: transaction_id.trim(),
    })
    .select()
    .single<AiTestBooking>();

  if (insertError || !booking) {
    return NextResponse.json(
      { error: "Could not create booking. Please try again." },
      { status: 500 }
    );
  }

  try {
    await Promise.all([
      sendAiTestReceivedEmail(booking),
      sendNewAiTestAlertEmail(booking),
    ]);
  } catch (emailError) {
    console.error("Failed to send AI test booking emails:", emailError);
  }

  return NextResponse.json({ success: true });
}
