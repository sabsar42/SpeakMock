# SpeakMock — Master Build Document

> Read this file completely before writing a single line of code.
> This is the single source of truth for the entire project.
> Also read: DESIGN.md, SCHEMA.md, ENV.md before starting.

---

## BEFORE YOU START — Ask the User For

Do not proceed without collecting all of the following from the user:

1. **Supabase Project URL and Anon Key** — Supabase Dashboard > Settings > API > Project URL
2. **Supabase Service Role Key** — same page, service_role key (never expose to browser)
3. **Resend API Key** — from resend.com dashboard
4. **Sender email address** — e.g. `hello@yourdomain.com` (must be verified in Resend)
5. **Your personal Gmail** — where you want admin booking notifications sent
6. **Admin password** — a strong password for `/admin` access
7. **App URL** — your Vercel URL or custom domain e.g. `speakmock.vercel.app`
8. **Session fee amount** — the amount students pay (shown on booking page)
9. **Payment method details** — QR code image or payment number to show students
10. **Your timezone** — for displaying slots correctly

---

## Project Name
**SpeakMock**
Tagline: "IELTS Speaking Practice, Simplified"

---

## What This App Does

A lean booking platform for IELTS mock speaking sessions conducted over Google Meet.

1. Student visits the platform and fills out a booking form
2. They select a time slot and enter their payment transaction ID (mandatory)
3. Admin sees the booking in a protected dashboard and verifies the payment manually
4. Admin confirms the booking and pastes the Google Meet link
5. System creates a temporary session page (magic link) for the student
6. Resend sends the magic link to the student via email
7. Student accesses their session page — sees booking info, Meet link, and later their result
8. After the session, admin marks it complete and uploads the result (PDF or MD file)
9. 72-hour countdown begins from when session is marked complete
10. Student downloads the result from their session page within 72 hours
11. Session page auto-deletes after 72 hours via cron job
12. Student can rebook from their session page (same loop)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Email | Resend + React Email |
| Hosting | Vercel |
| Cron Jobs | Vercel Cron |

---

## Project Folder Structure

```
speakmock/
├── app/
│   ├── page.tsx                         # Homepage
│   ├── book/
│   │   └── page.tsx                     # Booking form
│   ├── booking-received/
│   │   └── page.tsx                     # Post-submission screen
│   ├── session/
│   │   └── [token]/
│   │       └── page.tsx                 # Student temp session page
│   ├── resend-link/
│   │   └── page.tsx                     # Resend magic link page
│   ├── admin/
│   │   ├── page.tsx                     # Admin login
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # All bookings overview
│   │   └── booking/
│   │       └── [id]/
│   │           └── page.tsx             # Individual booking + actions
│   └── api/
│       ├── booking/
│       │   └── route.ts                 # POST: submit booking form
│       ├── resend-link/
│       │   └── route.ts                 # POST: resend magic link
│       ├── session/
│       │   └── [token]/
│       │       └── route.ts             # GET: fetch session data
│       ├── admin/
│       │   ├── bookings/
│       │   │   └── route.ts             # GET: all bookings
│       │   ├── confirm/
│       │   │   └── route.ts             # POST: confirm + create session
│       │   ├── reject/
│       │   │   └── route.ts             # POST: reject booking
│       │   ├── upload-result/
│       │   │   └── route.ts             # POST: upload result file
│       │   ├── complete-session/
│       │   │   └── route.ts             # POST: mark done, start 72hr timer
│       │   └── slots/
│       │       └── route.ts             # GET/POST: manage available slots
│       └── cron/
│           └── cleanup/
│               └── route.ts             # GET: delete expired sessions
├── components/
│   ├── ui/                              # shadcn/ui auto-generated components
│   ├── booking-form.tsx
│   ├── session-page.tsx
│   ├── countdown-timer.tsx
│   ├── admin-booking-card.tsx
│   ├── result-upload.tsx
│   └── navbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # Browser Supabase client
│   │   └── server.ts                    # Server Supabase client (service role)
│   ├── resend/
│   │   └── emails.ts                    # All email sending functions
│   ├── utils.ts                         # Shared helper functions
│   └── types.ts                         # TypeScript interfaces and types
├── emails/                              # React Email templates
│   ├── booking-received.tsx
│   ├── booking-confirmed.tsx
│   ├── booking-rejected.tsx
│   ├── reminder-24h.tsx
│   ├── reminder-1h.tsx
│   ├── result-ready.tsx
│   └── resend-link.tsx
├── design-sample/                       # User-provided design screenshots
├── public/
│   └── payment-qr.png                  # QR code or payment image (user provides)
├── MASTER.md
├── DESIGN.md
├── SCHEMA.md
├── ENV.md
├── .env.local
└── vercel.json
```

---

## Pages — Full Spec

### 1. Homepage `/`

Purpose: Landing page that explains the service and converts visitors into bookers.

**Sections (in order):**
- Navbar: Logo (SpeakMock) on the left, "Book a Session" button on the right
- Hero: Bold headline, short subheadline, two buttons: "Book Now" and "Already booked? Get your link"
- How It Works: 3 steps in a row — Book your slot / Pay and confirm / Speak with an examiner
- What You Get: Icons with short descriptions — 20 min session, real IELTS format, band score feedback, result PDF
- Pricing: Single card showing the fee, accepted payment methods
- FAQ: 4 to 5 common questions (accordion component)
- Footer: Contact Gmail, "Already booked?" link

---

### 2. Booking Form `/book`

Purpose: Student fills in all required details to request a booking.

**Fields (all required):**
- Full Name
- Gmail Address (must be @gmail.com — validate on client and server)
- Phone Number (with country code)
- Preferred Slot (dropdown or calendar showing only available slots fetched from Supabase)
- Payment instruction box (distinct background color, shows amount, QR code or payment number)
- Transaction ID (text input — submit button is DISABLED until this field is non-empty)
- Checkbox: "I confirm I have made the payment of [amount] and understand the no-show policy"

**Behavior:**
- Validate Gmail format strictly (must end in @gmail.com)
- Transaction ID is required — keep submit button disabled until filled and checkbox is checked
- On submit: call POST /api/booking
- Show a loading spinner on the button during submission
- On success: redirect to /booking-received
- On error: show inline error message without losing form data
- Slots that already have a pending or confirmed booking are hidden or shown as unavailable

---

### 3. Booking Received `/booking-received`

Purpose: Confirmation screen shown immediately after form submission.

**Elements:**
- Success checkmark icon (animated, subtle)
- Heading: "We've received your booking request"
- Body: "We'll verify your payment and confirm your slot within a few hours. Check your Gmail for updates."
- Show the email address they entered
- Note: "If you don't see our email, check your spam folder"
- Link back to homepage

---

### 4. Student Session Page `/session/[token]`

Purpose: The student's temporary account. Everything they need is here.

**What to show:**
- Student name and Gmail at the top
- Booking slot date and time (formatted in readable format)
- Status badge (Pending / Confirmed / Completed / Expired)
- Google Meet link — shown as a prominent button only after admin confirms. Label: "Join Google Meet"
- Result section — shown only after admin uploads the result. Label: "Download Your Result" with file name
- Countdown timer — shown only after session is marked complete. Format: "Your page expires in 47h 23m 14s"
- "Book Another Session" button — always visible at the bottom, clicking prefills their name and Gmail in the booking form

**Behavior:**
- Fetch session data from GET /api/session/[token]
- If token does not exist: show "Session not found. Please check your link."
- If is_deleted is true: show "This session has expired and has been removed."
- Auto-refresh data every 60 seconds (use setInterval with fetch) so student sees status updates without refreshing
- Countdown timer counts down in real time using JavaScript (client component)

---

### 5. Resend Link `/resend-link`

Purpose: Student who lost their email can get their session link resent.

**Elements:**
- Short explanation: "Lost your session link? Enter your Gmail and we'll resend it."
- Gmail input field
- "Resend My Link" button
- After submit: always show "If we found a session for that email, we've sent the link." (never reveal if email exists or not)

**Behavior:**
- Call POST /api/resend-link
- Always show success message regardless of whether email was found (security)

---

### 6. Admin Login `/admin`

Purpose: Password-protected entry to admin area.

**Elements:**
- Centered card with SpeakMock logo
- Password input (not username, just password)
- "Login" button

**Behavior:**
- Check against ADMIN_PASSWORD env variable on server
- On success: set an httpOnly cookie named `admin_session` with a signed token, redirect to /admin/dashboard
- On failure: show "Incorrect password" inline, no redirect
- Protect all /admin/* routes by checking this cookie in middleware

---

### 7. Admin Dashboard `/admin/dashboard`

Purpose: Overview of all bookings with filters and quick actions.

**Elements:**
- Top stats bar: Total / Pending / Confirmed / Completed / Rejected (clickable filters)
- Filter tabs: All | Pending | Confirmed | Completed | Rejected
- Booking list: table or card list with these columns per row:
  - Student Name
  - Gmail
  - Slot (date and time)
  - Transaction ID
  - Status badge
  - Created At
  - "View" button linking to /admin/booking/[id]
- Manual refresh button
- Add Slots button (opens a modal or section to add available time slots)

---

### 8. Admin Booking Detail `/admin/booking/[id]`

Purpose: See full booking details and take action.

**Show:**
- All student info (name, Gmail, phone)
- Transaction ID (large, easy to copy)
- Slot date and time
- Current status badge
- Admin notes field (editable text area, saves on blur)

**Actions by status:**

If `pending`:
- Text input for Meet link (required to confirm)
- "Confirm Booking" button (disabled until Meet link is pasted)
- "Reject Booking" button that expands a reason text field then a "Send Rejection" button

If `confirmed`:
- Show the Meet link already saved
- "Mark Session as Complete" button (starts 72hr timer)
- Note below: "Clicking this will start the 72-hour expiry countdown for the student's session page"

If `completed`:
- Show session_completed_at and expires_at
- File upload section: drag and drop or click to upload PDF or MD file
- "Upload Result" button
- If result already uploaded: show file name with option to re-upload

---

## API Routes — Full Spec

### POST /api/booking
Input: `{ name, email, phone, slot_datetime, transaction_id }`

Steps:
1. Validate all fields server-side (email must end in @gmail.com, transaction_id must be non-empty)
2. Check that the slot_datetime exists in available_slots and is_active is true
3. Check no pending or confirmed booking already exists for that slot
4. Insert into bookings table (status: pending)
5. Send email to student via Resend: "Booking Received"
6. Send notification email to admin Gmail via Resend: "New Booking Alert"
7. Return `{ success: true }`

Error cases: return 400 with descriptive error message for slot taken, invalid email, missing fields.

---

### POST /api/admin/confirm
Auth: admin cookie required (check in route handler)
Input: `{ booking_id, meet_link }`

Steps:
1. Verify admin cookie
2. Check booking exists and is in pending status
3. Update bookings: payment_status = verified, booking_status = confirmed
4. Generate a unique session token (use nanoid with length 32)
5. Insert into sessions table with the meet_link and token
6. Send email to student: "Booking Confirmed" with magic link and Meet link
7. Schedule 24h and 1h reminder emails (use Resend's scheduledAt parameter)
8. Return `{ success: true, token }`

---

### POST /api/admin/reject
Auth: admin cookie required
Input: `{ booking_id, rejection_reason }`

Steps:
1. Verify admin cookie
2. Update bookings: booking_status = rejected, rejection_reason = input
3. Send email to student: "Booking Update" explaining rejection and inviting rebook
4. Return `{ success: true }`

---

### POST /api/admin/complete-session
Auth: admin cookie required
Input: `{ booking_id }`

Steps:
1. Verify admin cookie
2. Update bookings: booking_status = completed
3. Set sessions: session_completed_at = now(), expires_at = now() + 72 hours
4. Return `{ success: true, expires_at }`

---

### POST /api/admin/upload-result
Auth: admin cookie required
Input: FormData with `file` and `booking_id`

Steps:
1. Verify admin cookie
2. Get the session record for this booking_id
3. Upload file to Supabase Storage bucket `results` using path: `results/{session_id}/{filename}`
4. Update sessions: result_file_path = storage path, result_uploaded_at = now()
5. Send email to student: "Your Result is Ready" with link to their session page
6. Return `{ success: true }`

---

### POST /api/resend-link
Input: `{ email }`

Steps:
1. Find sessions joined with bookings where student_email = input and is_deleted = false
2. If found, send email with magic link
3. Always return `{ success: true }` (do not reveal whether email was found)

---

### GET /api/session/[token]
Input: token from URL

Steps:
1. Find session where token = input
2. If not found or is_deleted = true, return `{ error: 'not_found' }`
3. Join with bookings table to get student info and slot
4. Return all session and booking data needed for the session page (exclude sensitive fields like admin_notes)

---

### GET /api/cron/cleanup
Auth: `Authorization: Bearer {CRON_SECRET}` header

Steps:
1. Verify CRON_SECRET header matches env variable
2. Query sessions where expires_at < now() and is_deleted = false
3. For each expired session:
   a. Delete result file from Supabase Storage if result_file_path exists
   b. Set is_deleted = true in sessions table
4. Return `{ deleted: N, timestamp: now() }`

---

### GET/POST /api/admin/slots
Auth: admin cookie required

GET: Return all available_slots ordered by slot_datetime ascending
POST `{ slot_datetime }`: Insert new slot into available_slots
DELETE `{ slot_id }`: Set is_active = false for that slot

---

## Email Templates — Spec

Build all templates using React Email components. Keep them clean, minimal, and branded.

### 1. Booking Received (to student)
Subject: "We received your booking — SpeakMock"
Content: Name, slot requested, transaction ID noted, "We'll verify and confirm within a few hours", support Gmail

### 2. New Booking Alert (to admin)
Subject: "[Action Required] New Booking — {Student Name} — {Slot}"
Content: All booking details in a table, direct link to /admin/booking/[id]

### 3. Booking Confirmed (to student)
Subject: "Your booking is confirmed — SpeakMock"
Content: Name, confirmed slot, Google Meet link as a big button, magic link to session page, "Save this email — it contains your session link", no-show policy reminder

### 4. Booking Rejected (to student)
Subject: "Update on your SpeakMock booking"
Content: Name, slot, reason for rejection, "You're welcome to book again" with link to /book

### 5. 24-Hour Reminder (to student)
Subject: "Your mock test is tomorrow — SpeakMock"
Content: Name, slot time, Meet link, session page link, what to prepare

### 6. 1-Hour Reminder (to student)
Subject: "Your session starts in 1 hour — SpeakMock"
Content: Name, time, Meet link as a very prominent button, short checklist (good lighting, quiet room, stable internet)

### 7. Result Ready (to student)
Subject: "Your IELTS result is ready — SpeakMock"
Content: Name, congratulations, link to session page to download, "Your page expires in 72 hours — download before then"

### 8. Resend Link (to student)
Subject: "Your SpeakMock session link"
Content: "Here is your session link as requested", magic link as a button, note about expiry

---

## Vercel Cron Job

Create `vercel.json` in the project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs the cleanup every hour at minute 0. Secure the endpoint by checking the CRON_SECRET header.

---

## Available Slots Logic

- Slots are 20 minutes long
- Admin adds slots manually from the admin dashboard (a date-time picker)
- A slot disappears from the booking form if a pending or confirmed booking exists for it
- Admin can deactivate a slot by setting is_active = false
- Show slots in the booking form sorted by date ascending
- Only show slots at least 24 hours in the future

---

## Admin Auth — Middleware

Create `middleware.ts` in the project root:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin') === false) {
    const adminCookie = request.cookies.get('admin_session')
    if (!adminCookie || adminCookie.value !== process.env.ADMIN_SESSION_TOKEN) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/booking/:path*']
}
```

Ask Claude Code to implement proper cookie-based auth with a signed token. The /admin login page itself is public. All /admin/dashboard and /admin/booking/* routes are protected.

---

## No-Show Policy (ask user to define)

Before building the homepage and booking form, ask the user:
1. What is the session fee?
2. What is the no-show policy? (refund? reschedule? no refund?)
3. What payment methods are accepted?
4. What is the cancellation window? (e.g. must cancel 24 hours before)

---

## Build Phases

Work through these phases in order. After each phase, show the user what was built and ask for confirmation before moving to the next.

### Phase 1 — Project Setup
- Initialize Next.js 14 with TypeScript and Tailwind
- Install and configure shadcn/ui
- Set up Supabase client (browser and server)
- Set up Resend
- Create .env.local from ENV.md
- Set up Supabase tables and storage from SCHEMA.md
- Create middleware.ts for admin auth
- Create vercel.json with cron config

**Ask user for:** all items in the "BEFORE YOU START" section above.

---

### Phase 2 — UI (Static, No Logic)
Read DESIGN.md and the /design-sample folder before writing any UI.

Build these pages with static/mock data first:
1. Homepage (all sections)
2. Booking form (UI only, no submission)
3. Booking received page
4. Session page (with mock data showing all states)
5. Resend link page
6. Admin login page
7. Admin dashboard (with 3 to 4 mock bookings)
8. Admin booking detail (showing all action states)

**Ask user for:** feedback on design before continuing.

---

### Phase 3 — Booking Flow
1. POST /api/booking route
2. Connect booking form to API
3. Slot availability logic (fetch from Supabase, disable taken slots)
4. GET /api/admin/bookings route
5. Connect admin dashboard to real data

---

### Phase 4 — Admin Actions
1. POST /api/admin/confirm route
2. POST /api/admin/reject route
3. Wire up admin booking detail buttons
4. Session page data fetching (GET /api/session/[token])
5. Auto-refresh on session page (every 60 seconds)

---

### Phase 5 — Email System
1. Build all 8 email templates in React Email
2. Connect Resend to all API routes
3. Test each email by triggering the flows locally

---

### Phase 6 — File Upload + Result
1. Configure Supabase Storage bucket (results, private)
2. POST /api/admin/upload-result route
3. POST /api/admin/complete-session route
4. Show result download button on session page
5. Show countdown timer on session page

---

### Phase 7 — Cron + Cleanup
1. GET /api/cron/cleanup route
2. Test expiry logic with a short expires_at value
3. Confirm file deletion from Storage works

---

### Phase 8 — Polish and Deploy
1. Add loading states to all buttons and data-fetching sections
2. Add error messages (inline, user-friendly)
3. Mobile responsiveness audit
4. Test end-to-end flow (book, confirm, session, result, expiry)
5. Deploy to Vercel
6. Add all env variables to Vercel dashboard
7. Verify cron job is registered in Vercel

---

## Important Rules for Claude Code

- Always use TypeScript. Never use `any` type.
- Use Server Components by default. Use Client Components only for forms, interactivity, and timers.
- All Supabase operations from API routes use the SERVICE ROLE client.
- Never expose SUPABASE_SERVICE_ROLE_KEY or ADMIN_PASSWORD to the browser.
- Use `nanoid` for generating session tokens (length 32).
- Always validate inputs on the server even if validated on the client too.
- Read DESIGN.md before writing any UI component.
- Read SCHEMA.md before writing any database query.
- After each phase, pause and confirm with the user.
- If anything is unclear or requires a business decision, ask the user before assuming.
