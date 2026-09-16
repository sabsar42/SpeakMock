"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Loader2, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatSlotDateTime } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/types";

const FILTERS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

type SortKey = "created_at" | "slot_datetime" | "student_name";

const badgeVariantByStatus: Record<BookingStatus, "pending" | "confirmed" | "completed" | "rejected"> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  rejected: "rejected",
};

const PAGE_SIZE = 20;

function toCsv(rows: Booking[]): string {
  const header = ["Student", "Email", "Phone", "Slot", "Transaction ID", "Status", "Created"];
  const lines = rows.map((b) =>
    [
      b.student_name,
      b.student_email,
      b.student_phone,
      formatSlotDateTime(b.slot_datetime),
      b.transaction_id,
      b.booking_status,
      new Date(b.created_at).toLocaleString(),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={null}>
      <AdminBookingsPageInner />
    </Suspense>
  );
}

function AdminBookingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | "all">(
    (searchParams.get("status") as BookingStatus | null) ?? "all"
  );
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [isBulkActing, setIsBulkActing] = useState(false);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
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

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [filter, search]);

  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.booking_status === "pending").length,
      confirmed: bookings.filter((b) => b.booking_status === "confirmed").length,
      completed: bookings.filter((b) => b.booking_status === "completed").length,
      rejected: bookings.filter((b) => b.booking_status === "rejected").length,
    };
  }, [bookings]);

  const filtered = useMemo(() => {
    let rows = filter === "all" ? bookings : bookings.filter((b) => b.booking_status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (b) =>
          b.student_name.toLowerCase().includes(q) ||
          b.student_email.toLowerCase().includes(q) ||
          b.transaction_id.toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "student_name") cmp = a.student_name.localeCompare(b.student_name);
      else cmp = new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [bookings, filter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allPageSelected = pageRows.length > 0 && pageRows.every((b) => selected.has(b.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageRows.forEach((b) => next.delete(b.id));
      else pageRows.forEach((b) => next.add(b.id));
      return next;
    });
  }

  async function handleBulkReject() {
    const reason = window.prompt("Rejection reason (applied to all selected bookings):");
    if (!reason?.trim()) return;
    setIsBulkActing(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch("/api/admin/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: id, rejection_reason: reason.trim() }),
          })
        )
      );
      setSelected(new Set());
      await loadBookings();
    } finally {
      setIsBulkActing(false);
    }
  }

  function handleExportSelected() {
    const rows = bookings.filter((b) => selected.has(b.id));
    downloadCsv(toCsv(rows), `bookings-selected-${Date.now()}.csv`);
  }

  function handleExportAll() {
    downloadCsv(toCsv(filtered), `bookings-${filter}-${Date.now()}.csv`);
  }

  return (
    <AdminShell
      title="Bookings"
      headerActions={
        <Button variant="outline" size="sm" onClick={handleExportAll}>
          <Download className="h-4 w-4" />
          Export All as CSV
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              router.replace(f.value === "all" ? "/admin/bookings" : `/admin/bookings?status=${f.value}`);
            }}
            className={cn(
              "rounded-xl border p-3.5 text-center transition",
              filter === f.value
                ? "border-accent bg-accent/10"
                : "border-border bg-white hover:border-border"
            )}
          >
            <p className="text-xl font-bold text-text-primary">{counts[f.value]}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{f.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as BookingStatus | "all")}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search name, email, transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-gray-50 pl-9 text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-white px-4 py-2.5">
          <p className="text-sm text-text-secondary">{selected.size} selected</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportSelected}>
              <Download className="h-3.5 w-3.5" />
              Export Selected
            </Button>
            <Button size="sm" variant="danger" onClick={handleBulkReject} disabled={isBulkActing}>
              {isBulkActing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 px-4 py-3">
                <Checkbox checked={allPageSelected} onCheckedChange={togglePageAll} className="border-border" />
              </th>
              {(
                [
                  ["student_name", "Student"],
                  ["slot_datetime", "Slot"],
                  ["created_at", "Created"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text-secondary"
                >
                  {label} {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((booking) => (
              <tr
                key={booking.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/admin/booking/${booking.id}`);
                }}
                className="border-b border-border last:border-0 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selected.has(booking.id)}
                    onCheckedChange={() => toggleRow(booking.id)}
                    className="border-border"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-text-primary">{booking.student_name}</p>
                  <p className="text-xs text-text-muted">{booking.student_email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {formatSlotDateTime(booking.slot_datetime)}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {new Date(booking.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-text-muted">
                  {booking.transaction_id}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={badgeVariantByStatus[booking.booking_status]}>
                    {booking.booking_status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/booking/${booking.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading bookings...
          </p>
        )}
        {!isLoading && pageRows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-text-muted">No bookings match this view.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </AdminShell>
  );
}
