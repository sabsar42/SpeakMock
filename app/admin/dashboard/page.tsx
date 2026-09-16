"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Loader2, Plus, Video } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { AddSlotsDrawer } from "@/components/admin/add-slots-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSlotDateTime } from "@/lib/utils";
import type { BookingWithSession } from "@/lib/types";

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  revenueThisMonth: number;
  awaitingResult: number;
}

const STAT_CARDS: { key: keyof Stats; label: string; href: string }[] = [
  { key: "total", label: "Total Bookings", href: "/admin/bookings" },
  { key: "pending", label: "Pending", href: "/admin/bookings?status=pending" },
  { key: "confirmed", label: "Confirmed", href: "/admin/bookings?status=confirmed" },
  { key: "completed", label: "Completed", href: "/admin/bookings?status=completed" },
  { key: "revenueThisMonth", label: "Revenue This Month", href: "/admin/bookings?status=confirmed" },
];

const badgeVariantByStatus: Record<
  BookingWithSession["booking_status"],
  "pending" | "confirmed" | "completed" | "rejected"
> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  rejected: "rejected",
};

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<BookingWithSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/bookings"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todaysSessions = bookings.filter(
    (b) => b.booking_status === "confirmed" && isToday(b.slot_datetime)
  );
  const recentBookings = bookings.slice(0, 5);

  function copyMeetLink(id: string, link: string) {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <AdminShell
      title="Dashboard"
      headerActions={
        <Button size="sm" onClick={() => setDrawerOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Slots
        </Button>
      }
    >
      <AddSlotsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSlotsCreated={loadData}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => router.push(card.href)}
            className="rounded-xl border border-border bg-white p-4 text-left transition hover:border-border"
          >
            <p className="text-2xl font-bold text-text-primary">
              {stats
                ? card.key === "revenueThisMonth"
                  ? `৳${stats.revenueThisMonth.toLocaleString()}`
                  : stats[card.key]
                : "—"}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
              {card.label}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Today&apos;s Sessions</h2>
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </p>
          ) : todaysSessions.length === 0 ? (
            <p className="text-sm text-text-muted">No sessions scheduled today.</p>
          ) : (
            <ul className="space-y-3">
              {todaysSessions.map((b) => {
                const meetLink = b.sessions?.[0]?.meet_link ?? null;
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-gray-50 px-3.5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{b.student_name}</p>
                      <p className="text-xs text-text-muted">
                        {formatSlotDateTime(b.slot_datetime)}
                      </p>
                    </div>
                    {meetLink && (
                      <button
                        onClick={() => copyMeetLink(b.id, meetLink)}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-200"
                      >
                        {copiedId === b.id ? (
                          "Copied!"
                        ) : (
                          <>
                            <Video className="h-3.5 w-3.5" />
                            <Copy className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-accent hover:underline">
              View All
            </Link>
          </div>
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </p>
          ) : recentBookings.length === 0 ? (
            <p className="text-sm text-text-muted">No bookings yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentBookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/booking/${b.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-gray-50 px-3.5 py-3 hover:border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{b.student_name}</p>
                      <p className="text-xs text-text-muted">
                        {formatSlotDateTime(b.slot_datetime)}
                      </p>
                    </div>
                    <Badge variant={badgeVariantByStatus[b.booking_status]}>
                      {b.booking_status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
