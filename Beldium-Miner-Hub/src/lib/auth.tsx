import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  fetchCurrentUser,
  login,
  logout,
  register,
  resendVerification,
  verifyEmail,
  type RegisterInput,
  type RegisterResponse,
} from "./api/auth";
import { queryKeys, useCurrentUser, useHasTokens } from "./api/queries";
import type { User } from "./api/types";

// The signed-in identity, as the API sees it. This is the miner portal's only
// identity/session concept — unlike the compliance app there is no separate
// vertical/role picker here.

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  /** True once the API has confirmed who the token belongs to. */
  isAuthenticated: boolean;
  /** Set when /auth/me/ failed, e.g. the API is unreachable. */
  error: Error | null;
  signIn: (input: { email: string; password: string }) => Promise<User>;
  signUp: (input: RegisterInput) => Promise<RegisterResponse>;
  confirmEmail: (input: { email: string; code: string }) => Promise<User>;
  resendCode: (email: string) => Promise<{ message: string }>;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<User | null>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const hasTokens = useHasTokens();
  const query = useCurrentUser();

  const loadUser = React.useCallback(
    () =>
      queryClient.fetchQuery({
        queryKey: queryKeys.currentUser,
        queryFn: ({ signal }) => fetchCurrentUser(signal),
      }),
    [queryClient],
  );

  const value = React.useMemo<AuthContextValue>(() => {
    const user = query.data ?? null;
    const status: AuthStatus = !hasTokens
      ? "unauthenticated"
      : user
        ? "authenticated"
        : query.isError
          ? "unauthenticated"
          : "loading";

    return {
      user,
      status,
      isAuthenticated: status === "authenticated",
      error: query.error ?? null,

      signIn: async (input) => {
        await login(input);
        return loadUser();
      },

      signUp: (input) => register(input),

      confirmEmail: async (input) => {
        await verifyEmail(input);
        return loadUser();
      },

      resendCode: (email) => resendVerification(email),

      signOut: async () => {
        // Blacklists the refresh token server-side, then clears the local pair
        // whether or not that succeeded.
        await logout();
        // Nothing cached was fetched anonymously, so drop all of it.
        queryClient.clear();
      },

      refetchUser: async () => {
        if (!hasTokens) return null;
        const result = await query.refetch();
        return result.data ?? null;
      },
    };
  }, [hasTokens, query, loadUser, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
