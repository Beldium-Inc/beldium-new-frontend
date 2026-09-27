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
import { ApiError } from "./api/errors";
import { queryKeys, useCurrentUser, useHasTokens } from "./api/queries";
import type { User } from "./api/types";
import { isDemoMode } from "./data-mode";
import {
  DEMO_CODE,
  getState,
  resetState,
  setState,
  useOperator,
  type Account,
} from "./onboarding-store";

// The signed-in identity. Same contract as Miner Hub's AuthProvider, so screens
// never care which implementation is behind it: `api` talks to the Django
// accounts endpoints, `demo` keeps the account in the browser (onboarding-store).

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

function ApiAuthProvider({ children }: { children: React.ReactNode }) {
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
        // Blacklists the refresh token server-side, then clears the local pair.
        await logout();
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

/** The demo account, shaped like the API's `User` so screens read one type. */
function demoUser(account: Account): User {
  return {
    id: `demo-${account.email}`,
    email: account.email,
    first_name: account.firstName,
    last_name: account.lastName,
    phone_number: account.phone,
    country: account.country,
    onboarding_role: account.signupRole ?? "",
    email_verified_at: account.emailVerified
      ? (account.createdAt ?? new Date().toISOString())
      : null,
    phone_verified_at: account.phoneVerified
      ? (account.createdAt ?? new Date().toISOString())
      : null,
    is_staff: false,
    created_at: account.createdAt ?? new Date().toISOString(),
  };
}

function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const operator = useOperator();
  // Read after hydration only: the store is empty during SSR, and a signed-in
  // tab would otherwise flash "Sign in required" before localStorage loads.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  const value = React.useMemo<AuthContextValue>(() => {
    const account = operator.account;
    const user = operator.signedIn && account ? demoUser(account) : null;
    const status: AuthStatus = !hydrated ? "loading" : user ? "authenticated" : "unauthenticated";

    const requireAccount = (email: string) => {
      const current = getState().account;
      if (!current || current.email.toLowerCase() !== email.trim().toLowerCase()) {
        throw new ApiError("No account in progress for that email.", {
          code: "not_found",
          status: 404,
        });
      }
      return current;
    };

    return {
      user,
      status,
      isAuthenticated: status === "authenticated",
      error: null,
      signIn: async ({ email, password }) => {
        const current = getState().account;
        if (
          !current ||
          current.email.toLowerCase() !== email.trim().toLowerCase() ||
          current.password !== password
        ) {
          throw new ApiError("Email or password is incorrect.", {
            code: "invalid_credentials",
            status: 401,
          });
        }
        if (!current.emailVerified) {
          throw new ApiError("Verify your email before signing in.", {
            code: "email_not_verified",
            status: 403,
          });
        }
        setState({ signedIn: true });
        return demoUser(current);
      },
      signUp: async (input) => {
        const next: Account = {
          firstName: input.first_name ?? "",
          lastName: input.last_name ?? "",
          email: input.email,
          phone: input.phone_number ?? "",
          country: input.country ?? "Nigeria",
          password: input.password,
          participantType: getState().account?.participantType ?? "",
          signupRole: input.onboarding_role,
          emailVerified: false,
          phoneVerified: false,
          createdAt: new Date().toISOString(),
        };
        // A fresh account starts a fresh application.
        resetState();
        setState({ account: next });
        return {
          message: `Demo mode: your verification code is ${DEMO_CODE}.`,
          user: demoUser(next),
        };
      },
      confirmEmail: async ({ email, code }) => {
        const current = requireAccount(email);
        if (code !== DEMO_CODE) {
          throw new ApiError("That code is incorrect.", { code: "invalid_code", status: 400 });
        }
        const verified = { ...current, emailVerified: true };
        // Like the API, a consumed code signs the account in.
        setState({ account: verified, signedIn: true });
        return demoUser(verified);
      },
      resendCode: async (email) => {
        requireAccount(email);
        return { message: `Demo mode: your verification code is ${DEMO_CODE}.` };
      },
      signOut: async () => {
        setState({ signedIn: false });
      },
      refetchUser: async () => user,
    };
  }, [operator, hydrated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const AuthProvider = isDemoMode ? DemoAuthProvider : ApiAuthProvider;

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
