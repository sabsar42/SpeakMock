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
  created_at: string
  updated_at: string
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
