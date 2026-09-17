"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function DatePicker({
  value,
  onChange,
  placeholder = "Choose a date",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Choose a date",
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "h-9 justify-start gap-2 rounded-lg bg-background px-2 text-sm font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarDays className="size-4 shrink-0" />
        {selected ? format(selected, "MMM d, yyyy") : placeholder}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="isolate z-[60] outline-none"
        >
          <PopoverPrimitive.Popup className="max-h-[min(26rem,var(--available-height))] overflow-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(day) => {
                if (!day) return;
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
              }}
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
