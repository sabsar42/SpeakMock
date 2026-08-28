# SpeakMock — Environment Variables

Create a `.env.local` file in the root of your project.
Never commit this file to Git. It is already in .gitignore by default in Next.js.

---

## .env.local Template

Copy this exactly and fill in your values:

```env
# ─────────────────────────────────────────
# SUPABASE
# ─────────────────────────────────────────

NEXT_PUBLIC_SUPABASE_URL=
# Where to find: Supabase Dashboard > Settings > API > Project URL
# Example: https://abcdefghijkl.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Where to find: Supabase Dashboard > Settings > API > anon public key
# This is safe to expose to the browser

SUPABASE_SERVICE_ROLE_KEY=
# Where to find: Supabase Dashboard > Settings > API > service_role key
# NEVER use this in any client-side code. Server/API routes only.


# ─────────────────────────────────────────
# RESEND (email)
# ─────────────────────────────────────────

RESEND_API_KEY=
# Where to find: resend.com > API Keys > Create API Key
# Example: re_abc123xyz

RESEND_FROM_EMAIL=
# The email address Resend sends FROM
# Must be a verified domain in your Resend account
# Example: hello@speakmock.com or noreply@speakmock.com

ADMIN_NOTIFICATION_EMAIL=
# Your personal Gmail where you want booking alerts sent
# Example: yourgmail@gmail.com


# ─────────────────────────────────────────
# APP
# ─────────────────────────────────────────

NEXT_PUBLIC_APP_URL=
# Your live URL after deploying to Vercel
# Use http://localhost:3000 during development
# Example: https://speakmock.vercel.app


# ─────────────────────────────────────────
# ADMIN AUTH
# ─────────────────────────────────────────

ADMIN_PASSWORD=
# A strong password you will use to log in at /admin
# Example: something long and random, not your regular password

ADMIN_SESSION_SECRET=
# A random 32-character string used to sign the admin session cookie
# Generate one at: https://generate-secret.vercel.app/32


# ─────────────────────────────────────────
# CRON JOB SECURITY
# ─────────────────────────────────────────

CRON_SECRET=
# A random 32-character string to secure the /api/cron/cleanup endpoint
# Generate one at: https://generate-secret.vercel.app/32
# This goes in the Authorization header when Vercel calls the cron route


# ─────────────────────────────────────────
# BUSINESS SETTINGS
# ─────────────────────────────────────────

NEXT_PUBLIC_SESSION_FEE=
# The fee students pay, shown on the booking page
# Example: 500 or "500 BDT" or "₹500" — include currency symbol

NEXT_PUBLIC_PAYMENT_METHOD_NAME=
# Name of your payment method shown to students
# Example: bKash or UPI or Easypaisa

NEXT_PUBLIC_PAYMENT_NUMBER=
# Your payment number shown on the booking form
# Example: 01XXXXXXXXX
```

---

## Where to Get Each Value

| Variable | Where |
|---|---|
| SUPABASE_URL | Supabase Dashboard > Settings > API |
| SUPABASE_ANON_KEY | Supabase Dashboard > Settings > API |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Dashboard > Settings > API |
| RESEND_API_KEY | resend.com > API Keys |
| RESEND_FROM_EMAIL | Your verified domain in Resend |
| ADMIN_NOTIFICATION_EMAIL | Your own Gmail |
| NEXT_PUBLIC_APP_URL | Your Vercel project URL |
| ADMIN_PASSWORD | You choose |
| ADMIN_SESSION_SECRET | https://generate-secret.vercel.app/32 |
| CRON_SECRET | https://generate-secret.vercel.app/32 |
| SESSION_FEE | You decide |
| PAYMENT_METHOD_NAME | Your payment app |
| PAYMENT_NUMBER | Your payment number |

---

## Vercel Deployment

After deploying to Vercel, add all variables here:
Vercel Dashboard > Your Project > Settings > Environment Variables

Set each variable for: Production, Preview, Development

Important: After adding env variables to Vercel, you must redeploy the project for them to take effect. Vercel does not hot-reload env changes.

---

## Local Development Checklist

- [ ] `.env.local` file created in project root
- [ ] `.env.local` is in `.gitignore` (it is by default in Next.js)
- [ ] All required variables are filled in
- [ ] Supabase tables created from SCHEMA.md
- [ ] Supabase Storage bucket `results` created
- [ ] Resend domain verified and sender email confirmed
- [ ] Run `npm run dev` and confirm no env errors in terminal

---

## Notes on NEXT_PUBLIC_ Prefix

Variables starting with `NEXT_PUBLIC_` are exposed to the browser.
Only use this prefix for values that are safe to be public.

Safe to expose:
- SUPABASE_URL
- SUPABASE_ANON_KEY (anon key has no admin access)
- APP_URL
- SESSION_FEE
- PAYMENT_METHOD_NAME
- PAYMENT_NUMBER

Never expose:
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET
- CRON_SECRET
