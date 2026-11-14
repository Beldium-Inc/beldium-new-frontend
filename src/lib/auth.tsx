import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  completeSecondFactor,
  fetchCurrentUser,
  login,
  type SecondFactorChallenge,
  logout,
  register,
  resendVerification,
  verifyEmail,
  type RegisterInput,
  type RegisterResponse,
} from "./api/auth";
import { queryKeys, useCurrentUser, useHasTokens } from "./api/queries";
import type { User } from "./api/types";

// The signed-in identity, as the API sees it. This is separate from
// `lib/session.tsx`, which records which of the seven dashboards you are
// looking at and in what role: the backend has no concept of verticals yet, so
// the two live side by side rather than one pretending to be the other.

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type SignInResult =
  | { status: "signed_in"; user: User }
  | { status: "second_factor"; challenge: SecondFactorChallenge };

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  /** True once the API has confirmed who the token belongs to. */
  isAuthenticated: boolean;
  /** Set when /auth/me/ failed, e.g. the API is unreachable. */
  error: Error | null;
  /** May stop at a second factor challenge; finish it with `finishSecondFactor`. */
  signIn: (input: { email: string; password: string }) => Promise<SignInResult>;
  finishSecondFactor: (input: { challenge_token: string; code: string }) => Promise<User>;
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
        const result = await login(input);
        if (result.status === "second_factor") return result;
        return { status: "signed_in", user: await loadUser() };
      },

      finishSecondFactor: async (input) => {
        await completeSecondFactor(input);
        return loadUser();
      },

      signUp: (input) => register(input),

      confirmEmail: async (input) => {
        const answer = await verifyEmail(input);
        if (answer.second_factor_required) {
          // The account owes a second factor, so no session was opened here.
          throw Object.assign(
            new Error("Email verified. Sign in to finish with your authenticator app."),
            { name: "SecondFactorDue" },
          );
        }
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
