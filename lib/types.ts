export type PaymentStatus = "pending" | "verified" | "rejected";
export type BookingStatus = "pending" | "confirmed" | "rejected" | "completed";

export interface Booking {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  slot_datetime: string;
  transaction_id: string;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  booking_id: string;
  token: string;
  meet_link: string | null;
  result_file_path: string | null;
  result_uploaded_at: string | null;
  session_completed_at: string | null;
  expires_at: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface AvailableSlot {
  id: string;
  slot_datetime: string;
  is_active: boolean;
  created_at: string;
}

export interface SessionWithBooking extends Session {
  booking: Booking;
}

export interface PublicSessionData {
  token: string;
  student_name: string;
  student_email: string;
  slot_datetime: string;
  booking_status: BookingStatus;
  meet_link: string | null;
  result_file_url: string | null;
  result_uploaded_at: string | null;
  session_completed_at: string | null;
  expires_at: string | null;
  is_deleted: boolean;
}
