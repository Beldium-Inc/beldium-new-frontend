// An email invitation link carries a token. Someone who is not signed in yet
// has to sign in or create an account first, so the token is parked here and
// picked up again once they are authenticated.

const KEY = "beldium.pendingInvitation.v1";

export function rememberInvitation(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* private mode: the link can be opened again */
  }
}

export function pendingInvitation(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearInvitation(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
