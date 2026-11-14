import { apiFetch } from "./client";
import { clearTokens, hasSession, writeTokens, type TokenPair } from "./tokens";
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

export interface VerifyEmailResponse extends Partial<TokenPair> {
  message: string;
  second_factor_required?: boolean;
  challenge_token?: string;
  enrolment_required?: boolean;
}

/** After a correct password, when the account owes a second factor (backend G8). */
export interface SecondFactorChallenge {
  second_factor_required: true;
  challenge_token: string;
  methods: string[];
  enrolment_required: boolean;
  expires_in: number;
}

export type LoginResult =
  | { status: "signed_in"; tokens: TokenPair }
  | { status: "second_factor"; challenge: SecondFactorChallenge };

function isChallenge(value: unknown): value is SecondFactorChallenge {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { second_factor_required?: unknown }).second_factor_required === true &&
    typeof (value as { challenge_token?: unknown }).challenge_token === "string"
  );
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
  // An account that owes a second factor gets a challenge here, not tokens.
  if (typeof response.access === "string") writeTokens({ access: response.access });
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

/**
 * Exchange credentials for a session. Internal and partner accounts may get a
 * second factor challenge instead of tokens; finish it with
 * `completeSecondFactor`. Throws `email_not_verified` (403) on an unverified
 * account.
 */
export async function login(input: { email: string; password: string }): Promise<LoginResult> {
  const answer = await apiFetch<TokenPair | SecondFactorChallenge>("/auth/token/", {
    method: "POST",
    body: input,
    auth: false,
  });
  if (isChallenge(answer)) return { status: "second_factor", challenge: answer };
  writeTokens(answer);
  return { status: "signed_in", tokens: answer };
}

/** Swap a challenge and a code from the authenticator app (or a recovery code) for a session. */
export async function completeSecondFactor(input: {
  challenge_token: string;
  code: string;
}): Promise<void> {
  const tokens = await apiFetch<TokenPair>("/auth/token/second-factor/", {
    method: "POST",
    body: input,
    auth: false,
  });
  writeTokens(tokens);
}

export interface SecondFactorEnrolment {
  method: "totp";
  secret: string;
  otpauth_uri: string;
}

/** Start linking an authenticator app, from a sign in challenge or when signed in. */
export function startSecondFactorEnrolment(
  challengeToken?: string,
): Promise<SecondFactorEnrolment> {
  return apiFetch<SecondFactorEnrolment>("/auth/second-factor/enrol/", {
    method: "POST",
    body: { method: "totp", ...(challengeToken ? { challenge_token: challengeToken } : {}) },
    auth: !challengeToken,
  });
}

/** Confirm the app with its first code. Returns the recovery codes, shown once. */
export async function confirmSecondFactorEnrolment(input: {
  code: string;
  challenge_token?: string | undefined;
}): Promise<string[]> {
  const answer = await apiFetch<{ recovery_codes: string[]; access?: string }>(
    "/auth/second-factor/enrol/confirm/",
    {
      method: "POST",
      body: input.challenge_token ? input : { code: input.code },
      auth: !input.challenge_token,
    },
  );
  if (typeof answer.access === "string") writeTokens({ access: answer.access });
  return answer.recovery_codes;
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
 * replayed. The local pair is cleared either way: a
 * failed call must not strand someone signed in.
 */
export async function logout(): Promise<void> {
  try {
    if (hasSession()) {
      // The API reads the refresh token from the HttpOnly cookie, revokes it
      // and clears the cookie.
      await apiFetch<void>("/auth/logout/", { method: "POST", body: {} });
    }
  } catch {
    // Already expired, already blacklisted, or the API is unreachable. None of
    // those should keep the user signed in on this device.
  } finally {
    clearTokens();
  }
}
