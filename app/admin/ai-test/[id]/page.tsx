"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  AiTestBooking,
  AiTestBookingStatus,
  AiTestResult,
  AiTestSession,
} from "@/lib/types";

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

export default function AdminAiTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [booking, setBooking] = useState<AiTestBooking | null>(null);
  const [session, setSession] = useState<AiTestSession | null>(null);
  const [result, setResult] = useState<AiTestResult | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/ai-test/bookings/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load booking.");
      setBooking(data.booking);
      setSession(data.session);
      setResult(data.result);
      setNotes(data.booking.admin_notes ?? "");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load booking.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNotes() {
    if (!booking || notes === (booking.admin_notes ?? "")) return;
    try {
      await fetch(`/api/admin/ai-test/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notes }),
      });
    } catch {
      // Non-critical; retried on next blur.
    }
  }

  async function handleApprove() {
    setIsApproving(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/ai-test/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not approve booking.");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not approve booking.");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/ai-test/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reject booking.");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not reject booking.");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <AdminShell title="AI Test Booking">
      {isLoading && (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading booking...
        </p>
      )}

      {!isLoading && loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {loadError}
        </div>
      )}

      {!isLoading && booking && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <AdminCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                  {booking.student_name}
                </h2>
                <Badge variant={badgeVariantByStatus[booking.status]}>{booking.status}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Gmail
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">{booking.student_email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Submitted
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {new Date(booking.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Transaction ID
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-text-secondary">
                    {booking.transaction_id}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(booking.transaction_id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && <p className="mt-1 text-xs text-success">Copied!</p>}
              </div>

              <div className="mt-4 space-y-2">
                <Label className="text-text-secondary">Admin Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Private notes about this booking..."
                />
              </div>
            </AdminCard>

            {booking.status === "completed" && result && (
              <AdminCard>
                <h2 className="mb-4 text-sm font-semibold text-text-primary">Result</h2>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Overall Band Score
                </p>
                <p className="mt-1 text-4xl font-bold text-accent">{result.overall_band}</p>
                <p className="mt-3 text-sm text-text-secondary">{result.overall_feedback}</p>
                <p className="mt-4 text-xs text-text-muted">
                  Scored with: <span className="font-mono">{result.model_used}</span>
                </p>
                {session && (
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={`/ai-test/result/${session.token}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      View as Student
                    </Link>
                  </Button>
                )}
              </AdminCard>
            )}
          </div>

          <AdminCard>
            <h2 className="mb-4 text-sm font-semibold text-text-primary">Actions</h2>

            {actionError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-error">
                {actionError}
              </div>
            )}

            {booking.status === "pending" && (
              <div className="space-y-4">
                <Button className="w-full" onClick={handleApprove} disabled={isApproving}>
                  {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Approve
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setShowRejectForm((v) => !v)}
                >
                  Reject
                </Button>
                {showRejectForm && (
                  <div className="space-y-3 rounded-lg border border-red-100 bg-red-50/50 p-4">
                    <Label className="text-text-secondary">Rejection Reason</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Why is this booking being rejected?"
                    />
                    <Button
                      variant="danger"
                      className="w-full"
                      disabled={rejectionReason.trim() === "" || isRejecting}
                      onClick={handleReject}
                    >
                      {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send Rejection
                    </Button>
                  </div>
                )}
              </div>
            )}

            {booking.status === "approved" && session && (
              <p className="text-sm text-text-secondary">
                Test link sent. Waiting for the student to start their session.
              </p>
            )}

            {booking.status === "in_progress" && (
              <p className="text-sm text-text-secondary">
                The student is currently taking the test.
              </p>
            )}

            {booking.status === "rejected" && (
              <p className="text-sm text-text-secondary">
                This booking was rejected. Reason: {booking.rejection_reason}
              </p>
            )}

            {booking.status === "completed" && result && (
              <p className="text-sm text-text-secondary">
                Test completed and scored. See the result panel for details.
              </p>
            )}
          </AdminCard>
        </div>
      )}
    </AdminShell>
  );
}
