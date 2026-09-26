/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Origin of the Beldium Django API, e.g. `http://localhost:8000`.
   * Set in `.env`; see `.env.example`.
   */
  readonly VITE_API_URL?: string;
  /**
   * Minutes of inactivity before a signed-in user is signed out (default 15,
   * capped at 25 to stay inside the API's 30-minute access-token lifetime).
   */
  readonly VITE_SESSION_IDLE_MINUTES?: string;
}
