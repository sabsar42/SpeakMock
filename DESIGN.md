# SpeakMock — Design Guide

> Before writing any UI code, read this file completely.
> Hero/background asset: `/design-sample/0_0.png` (desert landscape, optimized as `/public/hero/desert-hero.webp`).

---

## Design Philosophy

SpeakMock is a light, trustworthy, high-contrast product — calm and clean, not corporate or template-y.

- **Light by default** — white/off-white surfaces, dark navy text. Every page except the homepage uses a plain light background (`bg-background`, `#F7FAFC`).
- **Image-backed homepage** — the homepage uses the desert image (`/hero/desert-hero.webp`) as a full-bleed, fixed background behind the entire page (hero through footer), with a dark gradient scrim only at the very top and bottom so hero/footer text stays readable. The image itself must stay clearly visible elsewhere on the page.
- **No glassmorphism** — cards are solid, fully opaque white (`bg-white`), never translucent or blurred. On the homepage, opaque white cards float over the visible background image; there is no `backdrop-blur` anywhere in the project.
- **High contrast, purposeful color** — navy blue is the primary action color, desert orange is the accent/highlight color used sparingly (badges, pricing border, hero CTA). No dark theme, no gradients on buttons.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `background` | `#F7FAFC` | Page background (non-homepage pages) |
| `surface` | `#FFFFFF` | Cards, modals, panels |
| `border` | `#E1E8ED` | Card/input borders, dividers |
| `primary` | `#1F4A68` | Buttons, links, active states (deep navy blue) |
| `primary-hover` | `#163650` | Button/link hover |
| `primary-light` | `#E8F1F7` | Icon circle backgrounds, payment-info box background |
| `accent` | `#C25C15` | Hero CTA, pricing top border, badges (desert orange) |
| `accent-hover` | `#9E4A0F` | Accent hover state |
| `accent-light` | `#FDEEE0` | Accent icon circle backgrounds |
| `dune-*` / `sky-*` | see `tailwind.config.ts` | Extended orange/blue scale sampled from the desert image, used for fine-grained accents (e.g. `text-dune-300` in the hero headline) |
| `text-primary` | `#152430` | Headings, important labels |
| `text-secondary` | `#4B6373` | Body copy, descriptions |
| `text-muted` | `#8098A8` | Captions, placeholders, disabled labels |
| `success` | `#10B981` | Confirmed status |
| `warning` | `#F59E0B` | Pending status |
| `error` | `#EF4444` | Rejected status, error messages |
| `info` | `#397CAC` | Informational highlights |

Status badges and inline messages use light pastel fills (`bg-yellow-50`, `bg-green-50`, `bg-red-50`, `bg-gray-100`) with matching darker text/border — see `components/ui/badge.tsx`.

---

## Typography

Font: **Inter** via `next/font/google`.

| Role | Weight | Size | Usage |
|---|---|---|---|
| Display heading | 700 | 48px–56px | Hero headline |
| Section heading | 700 | 28px–36px | Section titles |
| Card heading | 600 | 18px–22px | Card/modal headings |
| Body | 400 | 15px–16px | Paragraphs |
| Label | 500 | 13px–14px | Form labels, metadata |
| Caption | 400 | 12px | Timestamps, footnotes |
| Badge | 600 | 11px | Status badges, uppercase, tracked |

---

## Component Styles

### Cards
```
background: white
border: 1px solid #E1E8ED
border-radius: 12px (rounded-xl) or 24px (rounded-3xl) on homepage sections
box-shadow: shadow-sm (default) or shadow-xl (homepage sections over the image)
padding: 24px–48px
```

### Buttons

Primary (filled navy): `bg-primary text-white hover:bg-primary-hover shadow-sm`
Accent (filled orange, hero/pricing CTA): `bg-accent text-white hover:bg-accent-hover`
Secondary (outline): `bg-white border border-sky-300 text-primary hover:bg-primary-light`
Outline (neutral): `border border-border bg-white text-text-primary hover:bg-gray-50`
Ghost: `hover:bg-gray-100 text-text-primary`
Danger (solid red, used for reject actions): `bg-error text-white hover:bg-red-600`

Disabled state (all buttons): `opacity-50 cursor-not-allowed`.

### Form Inputs
```
border: 1px solid #D1D5DB (gray-300)
background: white
border-radius: 8px
focus: border-color sky-600, ring 2px sky-500
```

### Status Badges
Pill-shaped, uppercase, tracked:
- Pending: `bg-yellow-50 text-yellow-700 border-yellow-200`
- Confirmed: `bg-green-50 text-green-700 border-green-200`
- Rejected: `bg-red-50 text-red-700 border-red-200`
- Completed: `bg-gray-100 text-gray-600 border-gray-200`

### Date/Time Picker
The booking form uses a real calendar popover (`components/ui/calendar.tsx`, built on `react-day-picker`) for date selection plus a grid of time-slot chip buttons for the selected day (`components/slot-picker.tsx`) — never a flat `<select>` dropdown for slot choice.

---

## Page-Specific Design Notes

### Homepage

- The desert image (`fixed inset-0`, `object-cover`) sits behind the entire page, with a dark gradient scrim covering roughly the top 55% (behind the hero) and bottom band (behind the footer) only — the middle of the page shows the image clearly through the gaps between cards.
- Navbar and footer both accept a `transparent` prop: on the homepage they render transparent/white-text over the image; on every other page they render as a normal solid white bar with dark text.
- Hero: pill badge, bold white headline (accent word in `text-dune-300`), white subheading, two CTAs (`accent` filled + white-filled secondary), no card underneath the buttons.
- Below the hero: opaque white `rounded-3xl` cards (`How It Works`, `What You Get`, pricing, FAQ) each floating directly over the visible background image — no wrapping section background color, no blur.
- Pricing card: white card with a `border-t-4 border-t-accent` top accent.

### Booking Form, Session Page, Resend Link, Admin Pages

Flat `bg-background` (`#F7FAFC`), white cards, same button/badge system as the homepage. No hero image on these pages — keeps forms and data-dense screens clean.

- Booking form: calendar + time-slot picker, indigo/sky-tinted payment instructions box (`bg-primary-light`), transaction ID clearly marked required.
- Session page: white card, status badge, full-width navy "Join Google Meet" button, white/sky-outline "Download Your Result" button, monospace countdown.
- Admin dashboard: white stat cards (active filter gets a `border-primary` highlight), filter tabs, striped table (`odd:bg-white even:bg-gray-50/60`).
- Admin booking detail: transaction ID in a monospace gray box with copy button, solid-red "Reject" vs navy "Confirm" actions clearly differentiated.

---

## Responsive Behavior

- Mobile first. Stack all multi-column layouts vertically on mobile.
- Booking form and session page: full width on mobile, padded sides.
- Admin dashboard table: horizontal scroll acceptable on mobile.

---

## Animation and Motion

- Keep animation subtle — no page transitions, no parallax.
- Button hover: color shift, `transition-all duration-150`.
- Loading state: `animate-pulse` skeletons or a spinning SVG icon inside buttons.
- Success state: scale-in effect on the booking-received checkmark.
- Countdown timer ticks every second — the only "live" element on the page.

---

## Iconography

**Lucide React** icons, 16–20px in most contexts, 24px for prominent single icons (48–64px for the booking-received success icon).

---

## Things to Avoid

- No dark theme anywhere in this project — it was tried and reverted; stick to the light palette above.
- No `backdrop-blur` / frosted-glass panels anywhere.
- No fabricated testimonials, reviews, or client logos.
- Do not use more than 2 font weights on a single page.
- Do not use more than 3 different button styles on a single page.
