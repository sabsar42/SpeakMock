"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BookingForm } from "@/components/booking-form";

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <BookingForm
      prefillName={searchParams.get("name") ?? undefined}
      prefillEmail={searchParams.get("email") ?? undefined}
      onSuccess={(email) =>
        router.push(`/booking-received?email=${encodeURIComponent(email)}`)
      }
    />
  );
}

export default function BookPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-[600px]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary">
              Book Your Session
            </h1>
            <p className="mt-2 text-text-secondary">
              Fill in your details and select a time slot to get started.
            </p>
          </div>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <Suspense fallback={null}>
              <BookPageContent />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
