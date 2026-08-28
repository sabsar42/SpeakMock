"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SessionPage } from "@/components/session-page";
import type { PublicSessionData } from "@/lib/types";

const REFRESH_INTERVAL_MS = 60_000;

export default function SessionTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [session, setSession] = useState<PublicSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"ok" | "not_found" | "expired" | "error">("ok");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/session/${token}`, { cache: "no-store" });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          if (data.error === "not_found") setStatus("not_found");
          else if (data.error === "expired") setStatus("expired");
          else setStatus("error");
          setSession(null);
        } else {
          setStatus("ok");
          setSession(data);
        }
      } catch {
        if (!cancelled) setStatus("error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-14 sm:px-6">
        {isLoading && (
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your session...
          </p>
        )}

        {!isLoading && status === "not_found" && (
          <p className="mx-auto max-w-md py-16 text-center text-text-secondary">
            Session not found. Please check your link.
          </p>
        )}

        {!isLoading && status === "expired" && (
          <p className="mx-auto max-w-md py-16 text-center text-text-secondary">
            This session has expired and has been removed.
          </p>
        )}

        {!isLoading && status === "error" && (
          <p className="mx-auto max-w-md py-16 text-center text-text-secondary">
            Something went wrong loading your session. Please try again shortly.
          </p>
        )}

        {!isLoading && status === "ok" && session && (
          <SessionPage session={session} />
        )}
      </main>
      <Footer />
    </div>
  );
}
