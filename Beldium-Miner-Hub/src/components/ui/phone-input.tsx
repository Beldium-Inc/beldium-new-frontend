import * as React from "react";

import { Input } from "@/components/ui/input";
import { formatPhoneNumber } from "@/lib/phone";

/**
 * A phone field that accepts whatever format the user types (local, with or
 * without a leading zero, with or without a country code) and normalises it
 * to E.164 once they leave the field, so the backend's strict format check
 * never surfaces as an error for a number entered by local convention.
 * Formatting on blur (not every keystroke) avoids fighting the cursor while
 * the user is still typing a partial number.
 */
const PhoneInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
    value: string;
    onChange: (value: string) => void;
  }
>(({ value, onChange, onBlur, ...props }, ref) => {
  return (
    <Input
      type="tel"
      inputMode="tel"
      ref={ref}
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        // Allow only digits, spaces and a leading "+" while typing.
        onChange(raw.replace(/(?!^)\+|[^\d+\s]/g, ""));
      }}
      onBlur={(e) => {
        if (e.target.value.trim()) onChange(formatPhoneNumber(e.target.value));
        onBlur?.(e);
      }}
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
