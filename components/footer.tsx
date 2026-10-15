import Link from "next/link";
import { Mail } from "lucide-react";

// The old hardcoded hello@speakmock.com was on a domain SpeakMock doesn't
// own, so student emails to it went nowhere. Configurable, defaulting to the
// verified sending domain.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@speakmock.printez.co.uk";

export function Footer() {
  return (
    <footer className="bg-[#1C0A11]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-bold text-white">
              Speak<span className="text-dune-300">Mock</span>
            </p>
            <p className="mt-2 text-sm text-white/60">
              IELTS Speaking Practice, Simplified.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Questions about a booking or payment? Email us and we&apos;ll
              get back to you within a few hours.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-dune-300"
            >
              <Mail className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white">
              Quick Links
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/ai-test" className="hover:text-white">
                  AI Mock Test
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-white">
                  Book a Session
                </Link>
              </li>
              <li>
                <Link href="/resend-link" className="hover:text-white">
                  Resend My Link
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          <p>
            SpeakMock is an independent practice service and is not affiliated with, endorsed by,
            or connected to IELTS, the British Council, IDP or Cambridge University Press &amp;
            Assessment. AI band scores are practice estimates, not official results.
          </p>
          <p>&copy; {new Date().getFullYear()} SpeakMock. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
