import { apiFetch } from "./client";
import { clearTokens, writeTokens, type TokenPair } from "./tokens";
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
    body: input,
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
    body: input,
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
 * Drop the local token pair. The API is stateless, so there is nothing to call:
 * the access token stays valid until it expires (30 minutes).
 */
export function logout(): void {
  clearTokens();
}
