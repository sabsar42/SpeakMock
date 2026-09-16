"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SlotCreatorPanel } from "@/components/admin/slot-creator-panel";
import { SlotCalendarPanel } from "@/components/admin/slot-calendar-panel";
import type { CalendarSlot } from "@/lib/types";

export default function AdminSlotsPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);

  const fetchSlots = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/slots/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRangeChange = useCallback(
    (start: string, end: string) => {
      setRange({ start, end });
      fetchSlots(start, end);
    },
    [fetchSlots]
  );

  useEffect(() => {
    if (range) fetchSlots(range.start, range.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeactivateSlot(slotId: string) {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
    await fetch("/api/admin/slots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot_id: slotId }),
    });
    if (range) fetchSlots(range.start, range.end);
  }

  function handleOpenBooking(bookingId: string) {
    router.push(`/admin/booking/${bookingId}`);
  }

  function handleSlotsCreated() {
    if (range) fetchSlots(range.start, range.end);
  }

  return (
    <AdminShell title="Slot Manager">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <SlotCreatorPanel onSlotsCreated={handleSlotsCreated} />
        <SlotCalendarPanel
          slots={slots}
          isLoading={isLoading}
          onRangeChange={handleRangeChange}
          onDeactivateSlot={handleDeactivateSlot}
          onOpenBooking={handleOpenBooking}
        />
      </div>
    </AdminShell>
  );
}
