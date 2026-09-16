"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { ResultUpload } from "@/components/result-upload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatSlotDateTime } from "@/lib/utils";
import type { BookingWithSession } from "@/lib/types";

type Filter = "all" | "pending" | "uploaded" | "expired";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Pending Upload", value: "pending" },
  { label: "Uploaded", value: "uploaded" },
  { label: "Expired", value: "expired" },
];

interface ResultRow extends BookingWithSession {
  sessionDetail: {
    id: string;
    token: string;
    meet_link: string | null;
    result_file_path: string | null;
    expires_at: string | null;
  } | null;
}

function urgencyClass(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < 0) return "border-l-4 border-l-gray-400";
  if (hoursLeft < 12) return "border-l-4 border-l-error";
  if (hoursLeft < 36) return "border-l-4 border-l-warning";
  return "border-l-4 border-l-emerald-600";
}

export default function AdminResultsPage() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.ok) {
        const data = await res.json();
        const completed = (data.bookings as BookingWithSession[]).filter(
          (b) => b.booking_status === "completed"
        );
        setRows(
          completed.map((b) => ({
            ...b,
            sessionDetail: null,
          }))
        );
        // Fetch per-booking session detail (expires_at, result_file_path) since
        // the list endpoint only embeds meet_link/token.
        const details = await Promise.all(
          completed.map((b) =>
            fetch(`/api/admin/bookings/${b.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => ({ id: b.id, session: d?.session ?? null }))
          )
        );
        setRows((prev) =>
          prev.map((row) => {
            const match = details.find((d) => d.id === row.id);
            return { ...row, sessionDetail: match?.session ?? null };
          })
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const hasResult = !!row.sessionDetail?.result_file_path;
      const isExpired = row.sessionDetail?.expires_at
        ? new Date(row.sessionDetail.expires_at).getTime() < Date.now()
        : false;
      if (filter === "pending") return !hasResult && !isExpired;
      if (filter === "uploaded") return hasResult;
      if (filter === "expired") return isExpired;
      return true;
    });
  }, [rows, filter]);

  async function resendResultEmail(bookingId: string) {
    setResendingId(bookingId);
    try {
      await fetch("/api/admin/resend-result-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });
    } finally {
      setResendingId(null);
    }
  }

  return (
    <AdminShell title="Results">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading results...
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">No results in this view.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((row) => (
            <div
              key={row.id}
              className={cn(
                "rounded-xl border border-border bg-white p-4",
                urgencyClass(row.sessionDetail?.expires_at ?? null)
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/booking/${row.id}`}
                    className="text-sm font-medium text-text-primary hover:underline"
                  >
                    {row.student_name}
                  </Link>
                  <p className="text-xs text-text-muted">
                    Session: {formatSlotDateTime(row.slot_datetime)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Expires:{" "}
                    {row.sessionDetail?.expires_at
                      ? formatSlotDateTime(row.sessionDetail.expires_at)
                      : "—"}
                  </p>
                </div>
                {row.sessionDetail?.result_file_path && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resendingId === row.id}
                    onClick={() => resendResultEmail(row.id)}
                  >
                    {resendingId === row.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" />
                    )}
                    Resend Email
                  </Button>
                )}
              </div>

              <div className="mt-3">
                <ResultUpload
                  bookingId={row.id}
                  existingFileName={
                    row.sessionDetail?.result_file_path
                      ? row.sessionDetail.result_file_path.split("/").pop() ?? null
                      : null
                  }
                  onUploaded={() => loadData()}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
