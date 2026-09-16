import { SupabaseClient } from "@supabase/supabase-js";

export async function logActivity(
  supabase: SupabaseClient,
  bookingId: string,
  action: string,
  note?: string
) {
  const { error } = await supabase
    .from("admin_activity_log")
    .insert({ booking_id: bookingId, action, note: note ?? null });

  if (error) {
    console.error(`Failed to log activity "${action}" for booking ${bookingId}:`, error);
  }
}
