import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Search,
  Truck,
  UserCheck,
  AlertTriangle,
  ShieldX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ExpiryBadge } from "@/components/shared/expiry-badge";
import type { CredentialValidity } from "@/lib/api/logistics";
import {
  useLogisticsCompanies,
  useLogisticsDrivers,
  useLogisticsVehicles,
} from "@/lib/api/logistics-queries";
import {
  ASSET_REVIEW_LABEL,
  hasAssetReview,
  useReviewAsset,
  type AssetDecision,
  type ReviewedDriver,
  type ReviewedVehicle,
} from "@/lib/api/logistics-operations";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, StatCard } from "@/verticals/logistics/bits";

export const Route = createFileRoute("/logistics/operator/readiness")({
  head: () => ({
    meta: [
      { title: "Fleet & driver readiness | Beldium Compliance Operations" },
      {
        name: "description",
        content: "Review each vehicle and driver on its own before it can be assigned to a trip.",
      },
    ],
  }),
  component: ReadinessPage,
});

const CREDENTIAL: Record<CredentialValidity, { label: string; tone: string }> = {
  current: { label: "Credentials current", tone: "success" },
  expiring: { label: "Expiring soon", tone: "warning" },
  expired: { label: "Expired", tone: "danger" },
  undeclared: { label: "Not declared", tone: "neutral" },
};

const REVIEW_TONE: Record<string, string> = {
  eligible: "success",
  restricted: "danger",
  info_requested: "warning",
  under_review: "info",
  submitted: "info",
  draft: "neutral",
};

type Target = { kind: "vehicles"; row: ReviewedVehicle } | { kind: "drivers"; row: ReviewedDriver };

function ReadinessPage() {
  const vehicles = useLogisticsVehicles();
  const drivers = useLogisticsDrivers();
  const companies = useLogisticsCompanies();
  const [search, setSearch] = useState("");
  const [credential, setCredential] = useState<CredentialValidity | "all">("all");
  const [reviewing, setReviewing] = useState<Target | null>(null);

  const companyName = useMemo(() => {
    const map = new Map((companies.data?.results ?? []).map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? "Unknown company";
  }, [companies.data]);

  const vehicleRows = (vehicles.data?.results ?? []) as ReviewedVehicle[];
  const driverRows = (drivers.data?.results ?? []) as ReviewedDriver[];
  // The decision controls switch on by themselves once the backend serves
  // review_status (task BE-L1); until then this page is the credential check.
  const reviewLive = hasAssetReview([...vehicleRows, ...driverRows]);

  const q = search.trim().toLowerCase();
  const keep = (status: CredentialValidity, hay: string[]) =>
    (credential === "all" || status === credential) &&
    (!q || hay.some((h) => h.toLowerCase().includes(q)));

  const shownVehicles = vehicleRows.filter((v) =>
    keep(v.credential_status, [
      v.registration,
      v.make,
      v.model,
      v.vehicle_type,
      companyName(v.company),
    ]),
  );
  const shownDrivers = driverRows.filter((d) =>
    keep(d.credential_status, [
      d.full_name,
      d.licence_number,
      d.licence_class,
      companyName(d.company),
    ]),
  );

  const count = (status: CredentialValidity) =>
    vehicleRows.filter((v) => v.credential_status === status).length +
    driverRows.filter((d) => d.credential_status === status).length;

  return (
    <AppShell
      role="operator"
      breadcrumbs={[
        { label: "Compliance Operations", to: "/logistics/operator" },
        { label: "Fleet & drivers" },
      ]}
    >
      <PageHeader
        title="Fleet & driver readiness"
        description="Every vehicle and driver across applicants, checked on its own. Only an eligible vehicle and driver can be put on a trip."
      />
      {!reviewLive && (
        <div className="mb-5 rounded-xl border border-[var(--warning)]/60 bg-[var(--warning)]/10 px-4 py-3 text-sm">
          Per-vehicle and per-driver decisions switch on when the backend review endpoint is live
          (task BE-L1). Until then this page shows each asset's credential status from its declared
          dates.
        </div>
      )}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current"
          value={count("current")}
          icon={CheckCircle2}
          tone="success"
          active={credential === "current"}
          onClick={() => setCredential(credential === "current" ? "all" : "current")}
        />
        <StatCard
          label="Expiring soon"
          value={count("expiring")}
          icon={AlertTriangle}
          tone="warning"
          active={credential === "expiring"}
          onClick={() => setCredential(credential === "expiring" ? "all" : "expiring")}
        />
        <StatCard
          label="Expired"
          value={count("expired")}
          icon={ShieldX}
          tone="danger"
          active={credential === "expired"}
          onClick={() => setCredential(credential === "expired" ? "all" : "expired")}
        />
        <StatCard
          label="Not declared"
          value={count("undeclared")}
          icon={CircleDashed}
          tone="neutral"
          active={credential === "undeclared"}
          onClick={() => setCredential(credential === "undeclared" ? "all" : "undeclared")}
        />
      </div>
      <div className="relative mb-4 sm:w-80">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Registration, name, licence or company"
          aria-label="Search vehicles and drivers"
        />
      </div>
      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">
            <Truck className="mr-1.5 size-4" /> Vehicles ({shownVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="drivers">
            <UserCheck className="mr-1.5 size-4" /> Drivers ({shownDrivers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles" className="mt-4">
          <Panel bodyClassName="p-0">
            {vehicles.isPending ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : shownVehicles.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No vehicles match.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Vehicle</th>
                      <th className="px-4 py-2.5 font-medium">Company</th>
                      <th className="px-4 py-2.5 font-medium">Insurance</th>
                      <th className="px-4 py-2.5 font-medium">Roadworthiness</th>
                      <th className="px-4 py-2.5 font-medium">Declared</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      {reviewLive && (
                        <th className="px-4 py-2.5 text-right font-medium">Decision</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shownVehicles.map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-3">
                          <p className="font-mono font-medium">{v.registration}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.year} {v.make} {v.model} · {v.vehicle_type} · {v.capacity}{" "}
                            {v.capacity_unit}
                          </p>
                        </td>
                        <td className="px-4 py-3">{companyName(v.company)}</td>
                        <td className="px-4 py-3">
                          {v.insurance_expiry ? (
                            <ExpiryBadge date={v.insurance_expiry} compact />
                          ) : (
                            <Pill>Not dated</Pill>
                          )}
                          {v.insurer && (
                            <p className="mt-1 text-xs text-muted-foreground">{v.insurer}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {v.roadworthiness_expiry ? (
                            <ExpiryBadge date={v.roadworthiness_expiry} compact />
                          ) : (
                            <Pill>Not dated</Pill>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <Declared ok={v.insurance_declared} label="Insurance" />
                          <Declared ok={v.roadworthiness_declared} label="Roadworthiness" />
                          <Declared ok={v.safety_equipment_declared} label="Safety equipment" />
                        </td>
                        <td className="px-4 py-3">
                          <StatusCell
                            credential={v.credential_status}
                            review={v.review_status}
                            reason={v.review_reason}
                          />
                        </td>
                        {reviewLive && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => setReviewing({ kind: "vehicles", row: v })}
                            >
                              Review
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>
        <TabsContent value="drivers" className="mt-4">
          <Panel bodyClassName="p-0">
            {drivers.isPending ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : shownDrivers.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No drivers match.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Driver</th>
                      <th className="px-4 py-2.5 font-medium">Company</th>
                      <th className="px-4 py-2.5 font-medium">Licence</th>
                      <th className="px-4 py-2.5 font-medium">Medical</th>
                      <th className="px-4 py-2.5 font-medium">Experience</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      {reviewLive && (
                        <th className="px-4 py-2.5 text-right font-medium">Decision</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shownDrivers.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{d.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.employment_relationship || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">{companyName(d.company)}</td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs">{d.licence_number}</p>
                          <p className="mb-1 text-xs text-muted-foreground">
                            Class {d.licence_class}
                          </p>
                          <ExpiryBadge date={d.licence_expiry} compact />
                        </td>
                        <td className="px-4 py-3">
                          {d.medical_expiry ? (
                            <ExpiryBadge date={d.medical_expiry} compact />
                          ) : (
                            <Pill>Not dated</Pill>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <p>{d.years_experience} years</p>
                          {d.mineral_haulage_experience && (
                            <p className="text-muted-foreground">
                              Minerals: {d.mineral_haulage_experience}
                            </p>
                          )}
                          <Declared ok={d.safety_training_declared} label="Safety training" />
                        </td>
                        <td className="px-4 py-3">
                          <StatusCell
                            credential={d.credential_status}
                            review={d.review_status}
                            reason={d.review_reason}
                          />
                        </td>
                        {reviewLive && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => setReviewing({ kind: "drivers", row: d })}
                            >
                              Review
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>
      <ReviewDialog target={reviewing} onClose={() => setReviewing(null)} />
    </AppShell>
  );
}

function Declared({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className="flex items-center gap-1">
      {ok ? (
        <CheckCircle2 className="size-3.5 text-[var(--success-foreground)]" />
      ) : (
        <CircleDashed className="size-3.5 text-muted-foreground" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </p>
  );
}

function StatusCell({
  credential,
  review,
  reason,
}: {
  credential: CredentialValidity;
  review?: string | undefined;
  reason?: string | undefined;
}) {
  return (
    <div className="space-y-1">
      <Pill tone={CREDENTIAL[credential].tone}>{CREDENTIAL[credential].label}</Pill>
      {review && (
        <Pill tone={REVIEW_TONE[review] ?? "neutral"}>
          {ASSET_REVIEW_LABEL[review as keyof typeof ASSET_REVIEW_LABEL] ?? review}
        </Pill>
      )}
      {reason && <p className="max-w-[14rem] text-xs text-muted-foreground">{reason}</p>}
    </div>
  );
}

function ReviewDialog({ target, onClose }: { target: Target | null; onClose: () => void }) {
  const review = useReviewAsset();
  const [reason, setReason] = useState("");
  const label = target
    ? target.kind === "vehicles"
      ? target.row.registration
      : target.row.full_name
    : "";

  const decide = async (decision: AssetDecision) => {
    if (!target) return;
    if (decision !== "eligible" && !reason.trim()) {
      toast.error("Give a reason", { description: "The company is told why." });
      return;
    }
    if (decision === "eligible" && target.row.credential_status === "expired") {
      toast.error("This asset has an expired credential", {
        description: "It cannot be made eligible until a current document is on file.",
      });
      return;
    }
    try {
      await review.mutateAsync({
        kind: target.kind,
        id: target.row.id,
        decision,
        reason: reason.trim(),
      });
      toast.success(`${label} marked ${ASSET_REVIEW_LABEL[decision].toLowerCase()}`);
      setReason("");
      onClose();
    } catch (err) {
      toast.error("Could not record the decision", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {label}</DialogTitle>
          <DialogDescription>
            Eligible means it can be assigned to a trip. Restricted blocks assignment until the
            issue is fixed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="asset-reason">Reason</Label>
          <Textarea
            id="asset-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Required for restricted or information requested"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={review.isPending}
            onClick={() => decide("info_requested")}
          >
            Request information
          </Button>
          <Button
            variant="outline"
            disabled={review.isPending}
            onClick={() => decide("restricted")}
          >
            Restrict
          </Button>
          <Button disabled={review.isPending} onClick={() => decide("eligible")}>
            Mark eligible
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
