/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Beldium Django API, e.g. `https://api.beldium.com`. Defaults to localhost:8000. */
  readonly VITE_API_URL?: string;
  /** `api` to use the Beldium API for auth and onboarding; anything else runs on demo data. */
  readonly VITE_DATA_MODE?: string;
}
