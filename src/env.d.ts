/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Origin of the Beldium Django API, e.g. `http://localhost:8000`.
   * Set in `.env`; see `.env.example`.
   */
  readonly VITE_API_URL?: string;
}
