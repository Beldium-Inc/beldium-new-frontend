// @lovable.dev/vite-tanstack-config already includes the following: do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// CI builds must set VITE_API_URL. Without it the build would fall back to
// localhost, so stop here with a clear message instead.
const apiUrl =
  process.env["VITE_API_URL"] || loadEnv("production", process.cwd(), "VITE_")["VITE_API_URL"];
if (process.env["CI"] && !apiUrl?.trim()) {
  throw new Error(
    "VITE_API_URL is missing. Set it as a CI variable (for example http://localhost:8000 for a test build).",
  );
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
