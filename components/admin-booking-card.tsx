import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSlotDateTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";

const badgeVariantByStatus: Record<Booking["booking_status"], "pending" | "confirmed" | "completed" | "rejected"> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  rejected: "rejected",
};

export function AdminBookingRow({ booking }: { booking: Booking }) {
  return (
    <tr className="border-b border-border last:border-0 odd:bg-white even:bg-gray-50/60">
      <td className="px-4 py-3 text-sm font-medium text-text-primary">
        {booking.student_name}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {booking.student_email}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {formatSlotDateTime(booking.slot_datetime)}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-text-secondary">
        {booking.transaction_id}
      </td>
      <td className="px-4 py-3">
        <Badge variant={badgeVariantByStatus[booking.booking_status]}>
          {booking.booking_status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-text-muted">
        {new Date(booking.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/booking/${booking.id}`}>View</Link>
        </Button>
      </td>
    </tr>
  );
}
