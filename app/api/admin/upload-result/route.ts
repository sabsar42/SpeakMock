import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { sendResultReadyEmail } from "@/lib/resend/emails";
import type { Booking } from "@/lib/types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "text/markdown", "text/plain"]);

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");
  const bookingId = formData.get("booking_id");

  if (!(file instanceof File) || typeof bookingId !== "string" || !bookingId) {
    return NextResponse.json(
      { error: "file and booking_id are required." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File must be 10MB or smaller." }, { status: 400 });
  }

  const isMarkdownByName = file.name.toLowerCase().endsWith(".md");
  if (!ALLOWED_TYPES.has(file.type) && !isMarkdownByName) {
    return NextResponse.json(
      { error: "Only PDF, Markdown, or plain text files are allowed." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle<Booking>();

  if (bookingError) {
    return NextResponse.json({ error: "Could not load booking." }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "No session found for this booking." },
      { status: 404 }
    );
  }

  const storagePath = `${session.id}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("results")
    .upload(storagePath, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json(
      { error: "Could not upload file. Check that the 'results' storage bucket exists." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      result_file_path: storagePath,
      result_uploaded_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (updateError) {
    return NextResponse.json({ error: "File uploaded, but could not save record." }, { status: 500 });
  }

  try {
    await sendResultReadyEmail(booking, session.token);
  } catch (emailError) {
    console.error("Failed to send result-ready email:", emailError);
  }

  return NextResponse.json({ success: true, file_name: file.name });
}
