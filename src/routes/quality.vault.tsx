import { createFileRoute } from "@tanstack/react-router";

import { VaultWorkspace } from "@/components/vault/VaultWorkspace";
import { AppShell } from "@/verticals/quality/shell";

export const Route = createFileRoute("/quality/vault")({
  head: () => ({
    meta: [
      { title: "Document vault | Beldium Quality & Control" },
      {
        name: "description",
        content:
          "Back up quality records with version history, integrity checks and second approval.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <VaultWorkspace sector="quality" />
    </AppShell>
  ),
});
