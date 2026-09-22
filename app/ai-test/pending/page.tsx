"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

function PendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email address";

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center sm:p-10">
      <div className="mx-auto flex h-16 w-16 animate-in zoom-in items-center justify-center rounded-full bg-primary-light">
        <Clock className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-text-primary">
        We&apos;re verifying your payment
      </h1>
      <p className="mt-3 text-text-secondary">
        Your test link will arrive at the email address below within a few
        hours.
      </p>
      <p className="mt-4 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-text-primary">
        {email}
      </p>
      <p className="mt-4 text-xs text-text-muted">
        If you don&apos;t see our email, check your spam folder.
      </p>
      <Button asChild variant="secondary" className="mt-8">
        <Link href="/">Back to Homepage</Link>
      </Button>
    </div>
  );
}

export default function AiTestPendingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <Suspense fallback={null}>
          <PendingContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
