import { apiFetch } from "./client";
import { clearTokens, readTokens, writeTokens, type TokenPair } from "./tokens";
import type { User } from "./types";

export interface RegisterInput {
  email: string;
  password: string;
  /** Must equal `password`; the API rejects the pair otherwise. */
  confirm_password: string;
  /** Must be true. The API refuses registration without an accepted terms flag. */
  agreed_terms: boolean;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country?: string;
  onboarding_role?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

/**
 * Ties every account created or signed into from this app to the miner
 * portal — the API rejects a login whose declared portal doesn't match the
 * one the account registered with, so an account made here can't be used to
 * sign into the compliance app, and vice versa.
 */
const PORTAL = "miner";

export interface VerifyEmailResponse extends TokenPair {
  message: string;
}

/**
 * Create an account. The backend emails a six-digit code; the account cannot
 * sign in until `verifyEmail` consumes it.
 */
export function register(input: RegisterInput): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register/", {
    method: "POST",
    body: { ...input, portal: PORTAL },
    auth: false,
  });
}

/**
 * Consume the signup code. This returns a token pair, so a verified account is
 * signed in immediately without a second round-trip through the login form.
 */
export async function verifyEmail(input: {
  email: string;
  code: string;
}): Promise<VerifyEmailResponse> {
  const response = await apiFetch<VerifyEmailResponse>("/auth/verify-email/", {
    method: "POST",
    body: input,
    auth: false,
  });
  writeTokens({ access: response.access, refresh: response.refresh });
  return response;
}

/**
 * Ask for another signup code. The reply is deliberately the same whether or
 * not the address has an unverified account, so don't infer existence from it.
 */
export function resendVerification(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/resend-verification/", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

/** Exchange credentials for a token pair. Throws `email_not_verified` (403) on an unverified account. */
export async function login(input: { email: string; password: string }): Promise<TokenPair> {
  const tokens = await apiFetch<TokenPair>("/auth/token/", {
    method: "POST",
    body: { ...input, portal: PORTAL },
    auth: false,
  });
  writeTokens(tokens);
  return tokens;
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  return apiFetch<User>("/auth/me/", { signal });
}

export type CurrentUserPatch = Partial<Pick<User, "first_name" | "last_name" | "phone_number">>;

export function updateCurrentUser(patch: CurrentUserPatch): Promise<User> {
  return apiFetch<User>("/auth/me/", { method: "PATCH", body: patch });
}

/**
 * Verify the account's phone number. Both calls need a signed-in account, so
 * this is only reachable after the email code has been consumed, since that is what
 * issues the token pair.
 */
export function requestPhoneVerification(phoneNumber: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/verify-phone/request/", {
    method: "POST",
    body: { phone_number: phoneNumber },
  });
}

export function confirmPhoneVerification(input: {
  phone_number: string;
  code: string;
}): Promise<{ message: string; phone_number: string }> {
  return apiFetch<{ message: string; phone_number: string }>("/auth/verify-phone/confirm/", {
    method: "POST",
    body: input,
  });
}

/**
 * End the session. The refresh token is blacklisted server-side so it cannot be
 * replayed: dropping it locally alone would leave it usable for its full seven
 * days by anyone who had copied it. The local pair is cleared either way: a
 * failed call must not strand someone signed in.
 */
export async function logout(): Promise<void> {
  const tokens = readTokens();
  try {
    if (tokens) {
      await apiFetch<void>("/auth/logout/", { method: "POST", body: { refresh: tokens.refresh } });
    }
  } catch {
    // Already expired, already blacklisted, or the API is unreachable. None of
    // those should keep the user signed in on this device.
  } finally {
    clearTokens();
  }
}
