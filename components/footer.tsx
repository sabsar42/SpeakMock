import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0B1D2E]">
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
              href="mailto:hello@speakmock.com"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-dune-300"
            >
              <Mail className="h-4 w-4" />
              hello@speakmock.com
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

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} SpeakMock. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
