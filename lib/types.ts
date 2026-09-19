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
  rescheduled_from: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
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

export interface BookingWithSession extends Booking {
  sessions: { meet_link: string | null; token: string }[] | null;
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

export interface AdminActivityLogEntry {
  id: string;
  booking_id: string;
  action: string;
  note: string | null;
  created_at: string;
}

export interface SlotTemplateConfig {
  daysOfWeek: number[]; // 0 = Sunday ... 6 = Saturday
  times: string[]; // "HH:MM" 24h
}

export interface SlotTemplate {
  id: string;
  name: string;
  config: SlotTemplateConfig;
  created_at: string;
}

// Slot as returned by the admin calendar endpoint, joined with booking status if taken.
export interface CalendarSlot {
  id: string;
  slot_datetime: string;
  is_active: boolean;
  booking_id: string | null;
  booking_status: BookingStatus | null;
  student_name: string | null;
}

// --- AI Avatar Test ---

export type AiTestBookingStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "completed"
  | "rejected";

export interface AiTestBooking {
  id: string;
  student_name: string;
  student_email: string;
  transaction_id: string;
  payment_status: PaymentStatus;
  status: AiTestBookingStatus;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AiTestPhase =
  | "not_started"
  | "part1"
  | "part2_prep"
  | "part2_speaking"
  | "part3"
  | "scoring"
  | "completed";

export interface TranscriptTurn {
  speaker: "examiner" | "student";
  text: string;
  part: 1 | 2 | 3;
  question_id: string | null;
  at: string;
}

export type AvatarProviderName = "simli" | "spatius";

export interface AiTestSession {
  id: string;
  booking_id: string;
  token: string;
  simli_session_id: string | null;
  avatar_provider: AvatarProviderName;
  spatius_session_id: string | null;
  selected_part1_questions: string[];
  selected_cue_card_id: string | null;
  selected_part3_questions: string[];
  phase: AiTestPhase;
  started_at: string | null;
  ended_at: string | null;
  transcript: TranscriptTurn[];
  result_file_path: string | null;
  expires_at: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface AiCriterionScore {
  score: number;
  justification: string;
  examples: string[];
  tip: string;
}

export interface AiTestResult {
  id: string;
  session_id: string;
  fluency_coherence_score: number;
  fluency_coherence_justification: string;
  fluency_coherence_examples: string[];
  fluency_coherence_tip: string;
  lexical_resource_score: number;
  lexical_resource_justification: string;
  lexical_resource_examples: string[];
  lexical_resource_tip: string;
  grammatical_range_score: number;
  grammatical_range_justification: string;
  grammatical_range_examples: string[];
  grammatical_range_tip: string;
  pronunciation_score: number;
  pronunciation_justification: string;
  pronunciation_examples: string[];
  pronunciation_tip: string;
  overall_band: number;
  overall_feedback: string;
  raw_llm_response: unknown;
  model_used: string;
  scored_at: string;
}

export interface CueCard {
  id: string;
  topic: string;
  bullet_points: string[];
  closing_prompt: string;
  is_active: boolean;
  created_at: string;
}

export interface QuestionBankItem {
  id: string;
  part: 1 | 2 | 3;
  topic_category: string;
  question_text: string;
  cue_card_id: string | null;
  is_active: boolean;
  created_at: string;
}
