import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmation step for a destructive action that needs a written reason, such
 * as revoking a certificate or closing a non-conformity. The confirm button
 * stays off until a reason is typed and while the request is in flight.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  /** Resolves true when the server accepted the change; the dialog then closes. */
  onConfirm: (reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = React.useState("");
  const trimmed = reason.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold tracking-wide text-navy uppercase">
            Reason (required)
          </span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
            className="w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-link"
          />
        </label>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-navy hover:border-link disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!trimmed || busy}
            onClick={async () => {
              const ok = await onConfirm(trimmed);
              if (ok) {
                setReason("");
                onOpenChange(false);
              }
            }}
            className="rounded-xl border border-danger bg-danger/15 px-4 py-2.5 text-sm font-semibold text-danger-foreground disabled:opacity-50"
          >
            {busy ? "Saving..." : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
