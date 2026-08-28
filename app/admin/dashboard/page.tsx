"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBookingRow } from "@/components/admin-booking-card";
import type { Booking, BookingStatus } from "@/lib/types";

const FILTERS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [newSlotDatetime, setNewSlotDatetime] = useState("");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [addSlotError, setAddSlotError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load bookings.");
      setBookings(data.bookings ?? []);
    } catch {
      setError("Could not load bookings. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleAddSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSlotDatetime) return;
    setIsAddingSlot(true);
    setAddSlotError(null);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_datetime: new Date(newSlotDatetime).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add slot.");
      setNewSlotDatetime("");
      setAddSlotOpen(false);
    } catch (err) {
      setAddSlotError(err instanceof Error ? err.message : "Could not add slot.");
    } finally {
      setIsAddingSlot(false);
    }
  }

  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.booking_status === "pending").length,
      confirmed: bookings.filter((b) => b.booking_status === "confirmed").length,
      completed: bookings.filter((b) => b.booking_status === "completed").length,
      rejected: bookings.filter((b) => b.booking_status === "rejected").length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.booking_status === filter);
  }, [bookings, filter]);

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
        <DialogContent className="max-w-sm">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Add Available Slot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSlot} className="space-y-4">
              {addSlotError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-error">
                  {addSlotError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="slot-datetime">Date and Time</Label>
                <Input
                  id="slot-datetime"
                  type="datetime-local"
                  value={newSlotDatetime}
                  onChange={(e) => setNewSlotDatetime(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!newSlotDatetime || isAddingSlot}
              >
                {isAddingSlot ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Slot"
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <h1 className="text-xl font-bold text-text-primary">
            Speak<span className="text-primary">Mock</span> Admin
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadBookings} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddSlotOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Slots
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                router.push("/admin");
                router.refresh();
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {FILTERS.map((f) => (
            <Card
              key={f.value}
              className={cn(
                "cursor-pointer p-4 text-center transition",
                filter === f.value && "border-primary"
              )}
              onClick={() => setFilter(f.value)}
            >
              <p className="text-2xl font-bold text-text-primary">
                {counts[f.value]}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {f.label}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as BookingStatus | "all")}>
            <TabsList>
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Student
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Gmail
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Slot
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Transaction ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <AdminBookingRow key={booking.id} booking={booking} />
              ))}
            </tbody>
          </table>
          {isLoading && (
            <p className="flex items-center justify-center gap-2 px-4 py-8 text-center text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading bookings...
            </p>
          )}
          {!isLoading && filteredBookings.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              No bookings in this filter.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
