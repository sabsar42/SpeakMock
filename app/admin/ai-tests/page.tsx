"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FlaskConical,
  Loader2,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiTestBooking, AiTestBookingStatus, AvatarProviderName } from "@/lib/types";

interface AiTestBookingRow extends AiTestBooking {
  ai_test_sessions: { token: string; avatar_provider: AvatarProviderName }[] | null;
}

const PROVIDER_LABELS: Record<AvatarProviderName, string> = {
  simli: "Simli",
  spatius: "Spatius",
};

const badgeVariantByStatus: Record<
  AiTestBookingStatus,
  "pending" | "confirmed" | "completed" | "rejected"
> = {
  pending: "pending",
  approved: "confirmed",
  in_progress: "confirmed",
  completed: "completed",
  rejected: "rejected",
};

export default function AdminAiTestsPage() {
  const [bookings, setBookings] = useState<AiTestBookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [demoBusy, setDemoBusy] = useState<"score" | "walkthrough" | "cleanup" | null>(null);
  const [providerChoice, setProviderChoice] = useState<Record<string, AvatarProviderName>>({});
  const [demoProvider, setDemoProvider] = useState<AvatarProviderName>("simli");

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/ai-test/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleApprove(id: string) {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-test/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: id,
          avatar_provider: providerChoice[id] ?? "simli",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not approve booking.");
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve booking.");
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Rejection reason:");
    if (!reason?.trim()) return;
    setActingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-test/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, rejection_reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reject booking.");
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject booking.");
    } finally {
      setActingId(null);
    }
  }

  /** Creates a demo with sample answers already filled in, then scores it. */
  async function runScoringDemo() {
    setDemoBusy("score");
    setError(null);
    setNotice(null);
    try {
      const createRes = await fetch("/api/admin/ai-test/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "prefilled" }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error ?? "Could not create the demo test.");

      setNotice("Sample answers created. Scoring with the AI examiner — this can take a minute...");

      const scoreRes = await fetch("/api/ai-test/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: created.token }),
      });
      if (!scoreRes.ok) {
        const scoreData = await scoreRes.json().catch(() => ({}));
        throw new Error(
          scoreData.error ??
            "Scoring failed. Free-tier models are sometimes rate-limited — try again in a moment."
        );
      }

      setNotice(null);
      await loadBookings();
      window.open(`/ai-test/result/${created.token}`, "_blank", "noopener");
    } catch (err) {
      setNotice(null);
      setError(err instanceof Error ? err.message : "Could not run the demo.");
    } finally {
      setDemoBusy(null);
    }
  }

  /** Creates an empty demo session so you can walk the live test room yourself. */
  async function runRoomWalkthrough() {
    setDemoBusy("walkthrough");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/ai-test/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "empty", avatar_provider: demoProvider }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.detail ? `${data.error} (${data.detail})` : data.error ?? "Could not create the demo test."
        );
      }
      await loadBookings();
      window.open(`/ai-test/room/${data.token}`, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the demo.");
    } finally {
      setDemoBusy(null);
    }
  }

  async function clearDemos() {
    if (!window.confirm("Remove all demo tests? This does not affect real student bookings.")) {
      return;
    }
    setDemoBusy("cleanup");
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-test/demo", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove demo tests.");
      setNotice(`Removed ${data.removed} demo test${data.removed === 1 ? "" : "s"}.`);
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove demo tests.");
    } finally {
      setDemoBusy(null);
    }
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/ai-test/room/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  }

  const demoCount = bookings.filter((b) => b.transaction_id === "DEMO").length;

  return (
    <AdminShell title="AI Tests">
      <AdminCard className="mb-6 border-accent/30 bg-accent-light/30">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-text-primary">Demo Test</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Try the AI examiner without a paying student. The scoring demo fills in
              realistic sample answers and runs them through the real scoring model, so you
              can see exactly what a candidate receives.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={runScoringDemo} disabled={demoBusy !== null}>
                {demoBusy === "score" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                See a Scored Result
              </Button>
              <Select
                value={demoProvider}
                onValueChange={(value) => setDemoProvider(value as AvatarProviderName)}
              >
                <SelectTrigger className="h-9 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_LABELS) as AvatarProviderName[]).map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={runRoomWalkthrough}
                disabled={demoBusy !== null}
              >
                {demoBusy === "walkthrough" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                Try the Test Room
              </Button>
              {demoCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearDemos}
                  disabled={demoBusy !== null}
                >
                  {demoBusy === "cleanup" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Clear {demoCount} demo{demoCount === 1 ? "" : "s"}
                </Button>
              )}
            </div>

            <p className="mt-3 text-xs text-text-muted">
              &ldquo;See a Scored Result&rdquo; uses one AI scoring call. &ldquo;Try the Test
              Room&rdquo; uses the selected avatar provider&apos;s credit and a microphone,
              exactly like a real test.
            </p>
          </div>
        </div>
      </AdminCard>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-sky-200 bg-primary-light px-4 py-3 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {notice}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Email
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Submitted
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const token = booking.ai_test_sessions?.[0]?.token ?? null;
              const provider = booking.ai_test_sessions?.[0]?.avatar_provider ?? null;
              const isDemo = booking.transaction_id === "DEMO";

              return (
                <tr
                  key={booking.id}
                  className="border-b border-border last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-text-primary">
                      {booking.student_name}
                    </span>
                    {isDemo && (
                      <span className="ml-2 rounded-full border border-accent/30 bg-accent-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Demo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {booking.student_email}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-text-secondary">
                    {booking.transaction_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={badgeVariantByStatus[booking.status]}>{booking.status}</Badge>
                      {provider && (
                        <span className="rounded-full border border-border bg-gray-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                          {PROVIDER_LABELS[provider]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {booking.status === "pending" && (
                        <>
                          <Select
                            value={providerChoice[booking.id] ?? "simli"}
                            onValueChange={(value) =>
                              setProviderChoice((prev) => ({
                                ...prev,
                                [booking.id]: value as AvatarProviderName,
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 w-[110px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(PROVIDER_LABELS) as AvatarProviderName[]).map(
                                (provider) => (
                                  <SelectItem key={provider} value={provider}>
                                    {PROVIDER_LABELS[provider]}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(booking.id)}
                            disabled={actingId === booking.id}
                          >
                            {actingId === booking.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(booking.id)}
                            disabled={actingId === booking.id}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}

                      {token && booking.status !== "completed" && (
                        <Button size="sm" variant="ghost" onClick={() => copyLink(token)}>
                          <Copy className="h-3.5 w-3.5" />
                          {copiedToken === token ? "Copied!" : "Copy Link"}
                        </Button>
                      )}

                      {booking.status === "completed" && token && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/ai-test/result/${token}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Result
                          </Link>
                        </Button>
                      )}

                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/ai-test/${booking.id}`}>Details</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {isLoading && (
          <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading AI test bookings...
          </p>
        )}
        {!isLoading && bookings.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            No AI test bookings yet. Use the demo above to try the examiner.
          </p>
        )}
      </div>
    </AdminShell>
  );
}
