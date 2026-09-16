"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiTestBooking, AiTestBookingStatus } from "@/lib/types";

interface AiTestBookingRow extends AiTestBooking {
  ai_test_sessions: { token: string }[] | null;
}

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
        body: JSON.stringify({ booking_id: id }),
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

  return (
    <AdminShell title="AI Tests">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Gmail
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
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-gray-50/60">
                <td className="px-4 py-3 text-sm font-medium text-text-primary">
                  {booking.student_name}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{booking.student_email}</td>
                <td className="px-4 py-3 font-mono text-sm text-text-secondary">
                  {booking.transaction_id}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={badgeVariantByStatus[booking.status]}>{booking.status}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {new Date(booking.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {booking.status === "pending" ? (
                    <div className="flex gap-2">
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
                    </div>
                  ) : booking.status === "completed" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/ai-test/${booking.id}`}>View Result</Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/ai-test/${booking.id}`}>View</Link>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading AI test bookings...
          </p>
        )}
        {!isLoading && bookings.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-text-muted">No AI test bookings yet.</p>
        )}
      </div>
    </AdminShell>
  );
}
