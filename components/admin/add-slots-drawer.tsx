"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { SlotCreatorPanel } from "@/components/admin/slot-creator-panel";

interface AddSlotsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSlotsCreated: () => void;
}

export function AddSlotsDrawer({ open, onOpenChange, onSlotsCreated }: AddSlotsDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-white p-5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200">
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="text-lg font-semibold text-text-primary">
              Add Slots
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-lg p-1.5 text-text-muted hover:bg-gray-100 hover:text-text-primary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
          <SlotCreatorPanel onSlotsCreated={onSlotsCreated} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
