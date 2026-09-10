import { useCallback } from "react";

import { useAuth } from "./auth";
import { useSession } from "./session";

/**
 * Signing out has to clear both halves of the session: the API token pair and
 * the record of which dashboard and role the person was working in. The seven
 * vertical layouts hand this to their own store as `onSignOut`.
 */
export function useSignOut(): () => void {
  const { signOut: endSession } = useAuth();
  const { signOut: clearWorkspace } = useSession();

  return useCallback(() => {
    // The workspace choice goes immediately so the UI redirects at once; the
    // token blacklisting runs behind it and clears the pair either way.
    clearWorkspace();
    void endSession();
  }, [endSession, clearWorkspace]);
}
