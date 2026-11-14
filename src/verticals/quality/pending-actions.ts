import * as React from "react";
import { toast } from "sonner";

/**
 * Tracks which actions have a request in flight. A button uses `isBusy` to
 * disable itself while saving, and `run` ignores a second click on the same key.
 * The success message is shown only after the server has accepted the change.
 */
export function usePendingActions() {
  const inFlight = React.useRef(new Set<string>());
  const [busy, setBusy] = React.useState<ReadonlySet<string>>(() => new Set());

  const isBusy = React.useCallback((key: string) => busy.has(key), [busy]);

  const run = React.useCallback(
    async (
      key: string,
      call: () => Promise<boolean>,
      successMessage?: string,
    ): Promise<boolean> => {
      if (inFlight.current.has(key)) return false;
      inFlight.current.add(key);
      setBusy(new Set(inFlight.current));
      try {
        const ok = await call();
        if (ok && successMessage) toast.success(successMessage);
        return ok;
      } finally {
        inFlight.current.delete(key);
        setBusy(new Set(inFlight.current));
      }
    },
    [],
  );

  return { isBusy, run };
}
