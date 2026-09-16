"use client";

import { useCallback, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg, DatesSetArg } from "@fullcalendar/core";
import { Loader2, Video } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatSlotDateTime } from "@/lib/utils";
import type { CalendarSlot } from "@/lib/types";

type ViewName = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

const STATUS_COLOR: Record<string, { bg: string; border: string }> = {
  available: { bg: "#16a34a26", border: "#16a34a" }, // green
  pending: { bg: "#f59e0b26", border: "#f59e0b" }, // yellow
  confirmed: { bg: "#2563eb26", border: "#2563eb" }, // blue
  completed: { bg: "#6b728026", border: "#6b7280" }, // gray
};

function statusFor(slot: CalendarSlot): keyof typeof STATUS_COLOR {
  if (!slot.is_active) return "completed";
  if (!slot.booking_status) return "available";
  if (slot.booking_status === "pending") return "pending";
  if (slot.booking_status === "confirmed") return "confirmed";
  if (slot.booking_status === "completed") return "completed";
  return "available";
}

interface SlotCalendarPanelProps {
  slots: CalendarSlot[];
  isLoading: boolean;
  onRangeChange: (startIso: string, endIso: string) => void;
  onDeactivateSlot: (slotId: string) => void;
  onOpenBooking: (bookingId: string) => void;
}

export function SlotCalendarPanel({
  slots,
  isLoading,
  onRangeChange,
  onDeactivateSlot,
  onOpenBooking,
}: SlotCalendarPanelProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [view, setView] = useState<ViewName>("timeGridWeek");
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      onRangeChange(arg.start.toISOString(), arg.end.toISOString());
    },
    [onRangeChange]
  );

  function changeView(next: ViewName) {
    setView(next);
    calendarRef.current?.getApi().changeView(next);
  }

  const events = slots.map((slot) => {
    const status = statusFor(slot);
    const colors = STATUS_COLOR[status];
    return {
      id: slot.id,
      start: slot.slot_datetime,
      end: new Date(new Date(slot.slot_datetime).getTime() + 20 * 60 * 1000).toISOString(),
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: "#152430",
      extendedProps: { slot, status },
    };
  });

  function renderEventContent(arg: EventContentArg) {
    const slot = arg.event.extendedProps.slot as CalendarSlot;
    return (
      <div className="overflow-hidden px-1 text-[11px] leading-tight">
        <p className="truncate font-medium">
          {new Date(slot.slot_datetime).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        <p className="truncate opacity-90">{slot.student_name ?? "Available"}</p>
      </div>
    );
  }

  function handleEventClick(arg: EventClickArg) {
    const slot = arg.event.extendedProps.slot as CalendarSlot;
    setSelectedSlot(slot);
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-gray-50 p-1">
          {(
            [
              ["dayGridMonth", "Month"],
              ["timeGridWeek", "Week"],
              ["timeGridDay", "Day"],
            ] as [ViewName, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => changeView(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === value
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <LegendDot color="#16a34a" label="Available" />
          <LegendDot color="#f59e0b" label="Pending" />
          <LegendDot color="#2563eb" label="Confirmed" />
          <LegendDot color="#6b7280" label="Completed" />
        </div>
      </div>

      <div>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
          height="auto"
          nowIndicator
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          dayMaxEvents={3}
        />
      </div>

      <Dialog
        open={!!selectedSlot}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
      >
        <DialogContent className="max-w-sm">
          {selectedSlot && (
            <div className="p-6">
              <p className="text-sm font-semibold text-text-primary">
                {formatSlotDateTime(selectedSlot.slot_datetime)}
              </p>
              {selectedSlot.booking_status ? (
                <>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selectedSlot.student_name} —{" "}
                    <span className="capitalize">{selectedSlot.booking_status}</span>
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      if (selectedSlot.booking_id) onOpenBooking(selectedSlot.booking_id);
                      setSelectedSlot(null);
                    }}
                  >
                    <Video className="h-3.5 w-3.5" />
                    View Full Booking
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-text-secondary">
                    This slot is open for booking.
                  </p>
                  <Button
                    size="sm"
                    variant="danger"
                    className="mt-4 w-full"
                    onClick={() => {
                      onDeactivateSlot(selectedSlot.id);
                      setSelectedSlot(null);
                    }}
                  >
                    Deactivate Slot
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
