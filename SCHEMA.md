# SpeakMock — Database Schema

Run all SQL in Supabase SQL Editor (Dashboard > SQL Editor > New Query).
Run them in the order they appear here.

---

## Tables

### 1. bookings

Stores every booking request from students.

```sql
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  slot_datetime TIMESTAMPTZ NOT NULL,
  transaction_id TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  booking_status TEXT DEFAULT 'pending'
    CHECK (booking_status IN ('pending', 'confirmed', 'rejected', 'completed')),
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. sessions

Created when admin confirms a booking. This is the student's temporary account.

```sql
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  meet_link TEXT,
  result_file_path TEXT,
  result_uploaded_at TIMESTAMPTZ,
  session_completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. available_slots

Admin manages which time slots are available for booking.

```sql
CREATE TABLE available_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_datetime TIMESTAMPTZ NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4. admin_activity_log

Chronological log of admin actions on a booking, powers the Activity Timeline on the booking detail page.

```sql
CREATE TABLE admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

`action` is a free-form short code, e.g. `submitted`, `confirmed`, `rejected`, `completed`, `result_uploaded`, `confirmation_resent`, `rescheduled`, `rebook_allowed`.

---

### 5. slot_templates

Saved bulk-slot-creation presets (e.g. "Weekday Morning") for the Slot Manager's Quick Templates.

```sql
CREATE TABLE slot_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

`config` shape (matches the bulk slot creator form):
```json
{
  "daysOfWeek": [1, 2, 3, 4, 5],
  "times": ["09:00", "10:00", "11:00", "14:00", "15:00"]
}
```
(`daysOfWeek`: 0 = Sunday ... 6 = Saturday, matching JS `Date.getDay()`.)

---

### Additions to `bookings`

```sql
ALTER TABLE bookings ADD COLUMN rescheduled_from TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN confirmed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN completed_at TIMESTAMPTZ;
```

`confirmed_at` / `completed_at` are set alongside the existing `booking_status` transitions and exist so the dashboard/results page can query/sort by them directly instead of relying on `updated_at` (which changes on unrelated edits like admin notes).

---

## AI Avatar Test tables

See AVATAR.md for the full feature spec. Run after everything above.

### ai_test_bookings

```sql
CREATE TABLE ai_test_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'approved', 'in_progress', 'completed', 'rejected'
    )),
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_test_sessions

```sql
CREATE TABLE ai_test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES ai_test_bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  simli_session_id TEXT,
  selected_part1_questions UUID[],
  selected_cue_card_id UUID,
  selected_part3_questions UUID[],
  phase TEXT DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  transcript JSONB DEFAULT '[]',
  result_file_path TEXT,
  expires_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_test_results

```sql
CREATE TABLE ai_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES ai_test_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  fluency_coherence_score DECIMAL(3,1),
  fluency_coherence_justification TEXT,
  fluency_coherence_examples TEXT[],
  fluency_coherence_tip TEXT,
  lexical_resource_score DECIMAL(3,1),
  lexical_resource_justification TEXT,
  lexical_resource_examples TEXT[],
  lexical_resource_tip TEXT,
  grammatical_range_score DECIMAL(3,1),
  grammatical_range_justification TEXT,
  grammatical_range_examples TEXT[],
  grammatical_range_tip TEXT,
  pronunciation_score DECIMAL(3,1),
  pronunciation_justification TEXT,
  pronunciation_examples TEXT[],
  pronunciation_tip TEXT,
  overall_band DECIMAL(3,1),
  overall_feedback TEXT,
  raw_llm_response JSONB,
  model_used TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW()
);
```

### question_bank

```sql
CREATE TABLE question_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part INTEGER NOT NULL CHECK (part IN (1, 2, 3)),
  topic_category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  cue_card_id UUID REFERENCES cue_cards(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### cue_cards

```sql
CREATE TABLE cue_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  bullet_points TEXT[] NOT NULL,
  closing_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

`question_bank.cue_card_id` references `cue_cards`, so **create `cue_cards` before `question_bank`** when running this in Supabase SQL Editor (reorder the two CREATE TABLE statements accordingly — listed here in spec order, not execution order).

### Indexes for AI Avatar Test tables

```sql
CREATE INDEX idx_ai_sessions_token ON ai_test_sessions(token);

CREATE INDEX idx_ai_sessions_expires ON ai_test_sessions(expires_at)
  WHERE is_deleted = FALSE;

CREATE INDEX idx_ai_bookings_status ON ai_test_bookings(status);

CREATE INDEX idx_question_bank_part ON question_bank(part, topic_category)
  WHERE is_active = TRUE;
```

---

## Indexes

```sql
-- For finding bookings by email
CREATE INDEX idx_bookings_email ON bookings(student_email);

-- For filtering bookings by status in admin dashboard
CREATE INDEX idx_bookings_status ON bookings(booking_status);

-- For looking up session by token (magic link)
CREATE INDEX idx_sessions_token ON sessions(token);

-- For cron job: finding expired sessions
CREATE INDEX idx_sessions_expires ON sessions(expires_at)
  WHERE is_deleted = FALSE;

-- For available slot lookups
CREATE INDEX idx_slots_datetime ON available_slots(slot_datetime)
  WHERE is_active = TRUE;

-- For loading a booking's activity timeline
CREATE INDEX idx_activity_log_booking ON admin_activity_log(booking_id, created_at);
```

---

## Auto-update updated_at on bookings

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Row Level Security (RLS)

Enable RLS on all tables. Since all database operations happen through server-side API routes using the service role key, no public policies are needed. The anon key has zero access to these tables.

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_test_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE cue_cards ENABLE ROW LEVEL SECURITY;
```

No policies needed for anon role. Service role bypasses RLS by default.

---

## Supabase Storage

Create a private storage bucket for result files.

In Supabase Dashboard: Storage > New Bucket

Settings:
- Name: `results`
- Public bucket: OFF (files are private, served through signed URLs)
- File size limit: 10 MB
- Allowed MIME types: `application/pdf`, `text/markdown`, `text/plain`

File naming convention inside the bucket:
```
results/{session_id}/{original_filename}
```

Example:
```
results/a1b2c3d4-e5f6.../speaking-result.pdf
```

Create a second bucket for AI test PDF reports:

Settings:
- Name: `ai-results`
- Public bucket: OFF
- File size limit: 10 MB
- Allowed MIME types: `application/pdf`

File naming convention:
```
ai-results/{session_id}/report.pdf
```

---

## TypeScript Types

Add these to `lib/types.ts` in the project.

```typescript
export type PaymentStatus = 'pending' | 'verified' | 'rejected'
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'completed'

export interface Booking {
  id: string
  student_name: string
  student_email: string
  student_phone: string
  slot_datetime: string
  transaction_id: string
  payment_status: PaymentStatus
  booking_status: BookingStatus
  rejection_reason: string | null
  admin_notes: string | null
  rescheduled_from: string | null
  confirmed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminActivityLogEntry {
  id: string
  booking_id: string
  action: string
  note: string | null
  created_at: string
}

export interface SlotTemplateConfig {
  daysOfWeek: number[] // 0 = Sunday ... 6 = Saturday
  times: string[] // "HH:MM" 24h
}

export interface SlotTemplate {
  id: string
  name: string
  config: SlotTemplateConfig
  created_at: string
}

export interface Session {
  id: string
  booking_id: string
  token: string
  meet_link: string | null
  result_file_path: string | null
  result_uploaded_at: string | null
  session_completed_at: string | null
  expires_at: string | null
  is_deleted: boolean
  created_at: string
}

export interface AvailableSlot {
  id: string
  slot_datetime: string
  is_active: boolean
  created_at: string
}

// Joined type for session page (session + booking data)
export interface SessionWithBooking extends Session {
  booking: Booking
}

// What the student session page API returns (never expose admin_notes or full booking)
export interface PublicSessionData {
  token: string
  student_name: string
  student_email: string
  slot_datetime: string
  booking_status: BookingStatus
  meet_link: string | null
  result_file_url: string | null    // signed URL, not the raw path
  result_uploaded_at: string | null
  session_completed_at: string | null
  expires_at: string | null
  is_deleted: boolean
}

// --- AI Avatar Test types ---

export type AiTestBookingStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'

export interface AiTestBooking {
  id: string
  student_name: string
  student_email: string
  transaction_id: string
  payment_status: PaymentStatus
  status: AiTestBookingStatus
  rejection_reason: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type AiTestPhase =
  | 'not_started'
  | 'part1'
  | 'part2_prep'
  | 'part2_speaking'
  | 'part3'
  | 'scoring'
  | 'completed'

export interface TranscriptTurn {
  speaker: 'examiner' | 'student'
  text: string
  part: 1 | 2 | 3
  question_id: string | null
  at: string
}

export interface AiTestSession {
  id: string
  booking_id: string
  token: string
  simli_session_id: string | null
  selected_part1_questions: string[]
  selected_cue_card_id: string | null
  selected_part3_questions: string[]
  phase: AiTestPhase
  started_at: string | null
  ended_at: string | null
  transcript: TranscriptTurn[]
  result_file_path: string | null
  expires_at: string | null
  is_deleted: boolean
  created_at: string
}

export interface AiCriterionScore {
  score: number
  justification: string
  examples: string[]
  tip: string
}

export interface AiTestResult {
  id: string
  session_id: string
  fluency_coherence_score: number
  fluency_coherence_justification: string
  fluency_coherence_examples: string[]
  fluency_coherence_tip: string
  lexical_resource_score: number
  lexical_resource_justification: string
  lexical_resource_examples: string[]
  lexical_resource_tip: string
  grammatical_range_score: number
  grammatical_range_justification: string
  grammatical_range_examples: string[]
  grammatical_range_tip: string
  pronunciation_score: number
  pronunciation_justification: string
  pronunciation_examples: string[]
  pronunciation_tip: string
  overall_band: number
  overall_feedback: string
  raw_llm_response: unknown
  model_used: string
  scored_at: string
}

export interface CueCard {
  id: string
  topic: string
  bullet_points: string[]
  closing_prompt: string
  is_active: boolean
  created_at: string
}

export interface QuestionBankItem {
  id: string
  part: 1 | 2 | 3
  topic_category: string
  question_text: string
  cue_card_id: string | null
  is_active: boolean
  created_at: string
}
```

---

## Useful Queries

### Check if a slot is available before booking
```sql
SELECT COUNT(*) FROM bookings
WHERE slot_datetime = $1
AND booking_status IN ('pending', 'confirmed');
-- Returns 0 if slot is free, 1 if taken
```

### Get all bookings for admin dashboard
```sql
SELECT * FROM bookings
ORDER BY created_at DESC;
```

### Get session by token (public session page)
```sql
SELECT
  s.token,
  s.meet_link,
  s.result_file_path,
  s.result_uploaded_at,
  s.session_completed_at,
  s.expires_at,
  s.is_deleted,
  b.student_name,
  b.student_email,
  b.slot_datetime,
  b.booking_status
FROM sessions s
JOIN bookings b ON s.booking_id = b.id
WHERE s.token = $1
AND s.is_deleted = FALSE;
```

### Find expired sessions for cron job
```sql
SELECT s.id, s.result_file_path, s.booking_id
FROM sessions s
WHERE s.expires_at < NOW()
AND s.is_deleted = FALSE;
```

### Get available slots for booking form
```sql
SELECT slot_datetime FROM available_slots
WHERE is_active = TRUE
AND slot_datetime > NOW() + INTERVAL '24 hours'
AND slot_datetime NOT IN (
  SELECT slot_datetime FROM bookings
  WHERE booking_status IN ('pending', 'confirmed')
)
ORDER BY slot_datetime ASC;
```
