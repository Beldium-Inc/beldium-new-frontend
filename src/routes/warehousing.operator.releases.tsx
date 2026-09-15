import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/operator/releases")({
  head: () => ({
    meta: [
      { title: "Release authorisation | Beldium Warehouse Operator" },
      { name: "description", content: "Authorise stored lots for release and dispatch, reconciling declared and weighbridge-actual quantity." },
    ],
  }),
  component: ReleasesPage,
});

function ReleasesPage() {
  const { state, myWarehouse, requestRelease, decideRelease } = useDemo();
  const lots = state.lots.filter((l) => l.warehouse === myWarehouse?.id);
  const releasable = lots.filter((l) => l.status === "stored");
  const releases = state.releaseRequests.filter((r) => r.warehouse === myWarehouse?.id);
  const pending = releases.filter((r) => r.status === "pending");
  const decided = releases.filter((r) => r.status !== "pending");

  const [form, setForm] = React.useState<Record<string, { destination: string; requestedBy: string; actual: string }>>({});

  return (
    <AppShell role="operator" title="Release requests" subtitle="Stock cannot leave site without a recorded authorisation and weighbridge reconciliation">
      <Panel title="Ready for release" description="Stored lots eligible for a release request.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {releasable.map((l) => {
              const f = form[l.id] ?? { destination: "", requestedBy: l.owner_name, actual: "" };
              return (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-primary">{l.reference}</TableCell>
                  <TableCell className="text-sm">{l.product_name}</TableCell>
                  <TableCell className="text-sm">{Number(l.quantity).toLocaleString()} {l.unit}</TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-40 text-xs"
                      value={f.requestedBy}
                      onChange={(e) => setForm((p) => ({ ...p, [l.id]: { ...f, requestedBy: e.target.value } }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-44 text-xs"
                      placeholder="Destination"
                      value={f.destination}
                      onChange={(e) => setForm((p) => ({ ...p, [l.id]: { ...f, destination: e.target.value } }))}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      className="h-8 rounded-lg bg-link text-xs text-link-foreground hover:bg-link/90"
                      disabled={!f.destination.trim()}
                      onClick={() => {
                        requestRelease({
                          warehouse: myWarehouse!.id,
                          lot: l.id,
                          requested_by_name: f.requestedBy || l.owner_name,
                          destination: f.destination,
                          declared_quantity: l.quantity,
                          unit: l.unit,
                        });
                        toast.success(`Release requested for ${l.reference}`);
                      }}
                    >
                      Request release
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {releasable.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nothing eligible for release.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Pending authorisation" description="Reconcile declared vs. weighbridge-actual quantity before authorising." className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Declared</TableHead>
              <TableHead>Actual (weighbridge)</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map((r) => {
              const lot = state.lots.find((l) => l.id === r.lot);
              const actualKey = `actual-${r.id}`;
              const actual = form[actualKey]?.actual ?? "";
              const variance = actual
                ? Math.round(((Number(actual) - Number(r.declared_quantity)) / Number(r.declared_quantity)) * 1000) / 10
                : null;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-primary">{lot?.reference ?? r.lot}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.destination}</TableCell>
                  <TableCell className="text-sm">{Number(r.declared_quantity).toLocaleString()} {r.unit}</TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-32 text-xs"
                      placeholder="Actual weight"
                      value={actual}
                      onChange={(e) => setForm((p) => ({ ...p, [actualKey]: { destination: "", requestedBy: "", actual: e.target.value } }))}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {variance != null ? (
                      <span className={Math.abs(variance) > 0.5 ? "text-destructive" : "text-muted-foreground"}>
                        {variance > 0 ? "+" : ""}
                        {variance}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <Button
                      className="h-8 rounded-lg bg-link text-xs text-link-foreground hover:bg-link/90"
                      onClick={() => {
                        decideRelease(r.id, {
                          status: "authorised",
                          actual_weighbridge_quantity: actual ? Number(actual) : undefined,
                        });
                        toast.success(`${lot?.reference ?? r.id} authorised for release`);
                      }}
                    >
                      Authorise
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 text-xs text-destructive"
                      onClick={() => {
                        decideRelease(r.id, { status: "declined", reason: "Declined by operator" });
                        toast.error(`Release declined for ${lot?.reference ?? r.id}`);
                      }}
                    >
                      Decline
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {pending.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nothing awaiting authorisation.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Decided" className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decided.map((r) => {
              const lot = state.lots.find((l) => l.id === r.lot);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-primary">{lot?.reference ?? r.lot}</TableCell>
                  <TableCell className="text-sm">{r.destination}</TableCell>
                  <TableCell className="text-sm">{r.variance_percent != null ? `${r.variance_percent}%` : "-"}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(r.status)}>{r.status}</StatusPill></TableCell>
                </TableRow>
              );
            })}
            {decided.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  Nothing decided yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
