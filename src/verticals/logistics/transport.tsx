// Trip oversight for the compliance desk and regulators: the list of
// movements across logistics companies and one movement in full, with its
// cargo, deliveries and incidents. Read only here: partners run trips in the
// Logistics Portal. The regulator gets the same screens without actions.

import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  MapPin,
  Search,
  Truck,
  AlertTriangle,
  PackageCheck,
  Timer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogisticsCompanies } from "@/lib/api/logistics-queries";
import {
  DELIVERY_STATUS_LABEL,
  INCIDENT_STATUS_LABEL,
  MOVEMENT_STAGES,
  MOVEMENT_STATUS_LABEL,
  useDeliveries,
  useIncidents,
  useMovement,
  useMovements,
  type Movement,
  type MovementStatus,
} from "@/lib/api/logistics-operations";
import { cn } from "@/lib/utils";
import { KeyValue, PageHeader, Panel, Pill, StatCard } from "./bits";

const STATUS_TONE: Record<MovementStatus, string> = {
  scheduled: "neutral",
  assigned: "info",
  loading: "info",
  in_transit: "info",
  delayed: "warning",
  arrived: "info",
  delivered: "success",
  cancelled: "danger",
};

const ACTIVE: MovementStatus[] = ["assigned", "loading", "in_transit", "delayed", "arrived"];

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  return new Date(t).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useCompanyName() {
  const companies = useLogisticsCompanies();
  return useMemo(() => {
    const map = new Map((companies.data?.results ?? []).map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? "Unknown company";
  }, [companies.data]);
}

/** Cargo details still kept in metadata until the backend promotes them (BE-L4). */
function cargoField(m: Movement, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = m.metadata?.[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return null;
}

export function MovementList({
  basePath,
}: {
  basePath: "/logistics/operator/transport" | "/logistics/regulator/transport";
}) {
  const movements = useMovements();
  const companyName = useCompanyName();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MovementStatus | "all" | "active">("active");

  const all = movements.data?.results ?? [];
  const q = search.trim().toLowerCase();
  const rows = all.filter(
    (m) =>
      (status === "all" ||
        (status === "active" ? ACTIVE.includes(m.status) : m.status === status)) &&
      (!q ||
        [
          m.reference,
          m.mineral,
          m.origin,
          m.destination,
          m.miner,
          m.buyer,
          m.vehicle_registration ?? "",
          m.driver_name ?? "",
          companyName(m.company),
        ].some((h) => h.toLowerCase().includes(q))),
  );
  const count = (s: MovementStatus) => all.filter((m) => m.status === s).length;
  const now = Date.now();
  const late = all.filter(
    (m) => ACTIVE.includes(m.status) && m.eta_at && Date.parse(m.eta_at) < now,
  ).length;

  return (
    <>
      <PageHeader
        title="Transport oversight"
        description="Mineral movements across logistics companies: who is carrying what, where it is and whether it arrived as expected."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="On the road"
          value={count("in_transit") + count("loading")}
          icon={Truck}
          tone="info"
        />
        <StatCard label="Delayed" value={count("delayed")} icon={AlertTriangle} tone="warning" />
        <StatCard label="Past ETA" value={late} icon={Timer} tone={late ? "danger" : "success"} />
        <StatCard label="Delivered" value={count("delivered")} icon={PackageCheck} tone="success" />
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, mineral, route, vehicle or company"
            aria-label="Search movements"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active trips</SelectItem>
            <SelectItem value="all">All trips</SelectItem>
            {Object.entries(MOVEMENT_STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Panel bodyClassName="p-0">
        {movements.isPending ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : movements.error ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Could not load movements: {movements.error.message}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No movements match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Movement</th>
                  <th className="px-4 py-2.5 font-medium">Company</th>
                  <th className="px-4 py-2.5 font-medium">Route</th>
                  <th className="px-4 py-2.5 font-medium">Cargo</th>
                  <th className="px-4 py-2.5 font-medium">Vehicle & driver</th>
                  <th className="px-4 py-2.5 font-medium">Pickup / ETA</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`${basePath}/$movementId`}
                        params={{ movementId: m.id }}
                        className="font-mono text-xs font-medium text-[var(--link)] hover:underline"
                      >
                        {m.reference}
                      </Link>
                      {m.batch_id && (
                        <p className="text-xs text-muted-foreground">Batch {m.batch_id}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{companyName(m.company)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span>{m.origin}</span>
                      <ArrowRight className="mx-1 inline size-3 text-muted-foreground" />
                      <span>{m.destination}</span>
                    </td>
                    <td className="px-4 py-3">
                      {m.mineral || "—"}
                      <p className="text-xs text-muted-foreground">
                        {m.quantity_display || `${m.quantity} ${m.quantity_unit}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-mono">{m.vehicle_registration ?? "No vehicle"}</p>
                      <p className="text-muted-foreground">{m.driver_name ?? "No driver"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p>{fmtDateTime(m.pickup_at)}</p>
                      <p className="text-muted-foreground">ETA {fmtDateTime(m.eta_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={STATUS_TONE[m.status]}>{MOVEMENT_STATUS_LABEL[m.status]}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function StageStrip({ status }: { status: MovementStatus }) {
  const reached =
    status === "delayed" ? MOVEMENT_STAGES.indexOf("in_transit") : MOVEMENT_STAGES.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {MOVEMENT_STAGES.map((stage, i) => {
        const done = status !== "cancelled" && i <= reached;
        return (
          <li key={stage} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                done
                  ? "border-[var(--success)] bg-[var(--success)]/40 text-[var(--success-foreground)]"
                  : "border-border text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
              {MOVEMENT_STATUS_LABEL[stage]}
            </span>
            {i < MOVEMENT_STAGES.length - 1 && <span className="h-px w-3 bg-border" />}
          </li>
        );
      })}
      {(status === "delayed" || status === "cancelled") && (
        <Pill tone={STATUS_TONE[status]}>{MOVEMENT_STATUS_LABEL[status]}</Pill>
      )}
    </ol>
  );
}

export function MovementDetail({
  movementId,
  readOnly,
}: {
  movementId: string;
  readOnly: boolean;
}) {
  const movement = useMovement(movementId);
  const deliveries = useDeliveries({ movement: movementId, page_size: 50 });
  const incidents = useIncidents({ movement: movementId, page_size: 50 });
  const companyName = useCompanyName();
  const m = movement.data;

  if (movement.isPending) {
    return <p className="p-6 text-center text-sm text-muted-foreground">Loading movement…</p>;
  }
  if (!m) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">
          This movement could not be loaded{movement.error ? `: ${movement.error.message}` : "."}
        </p>
      </Panel>
    );
  }

  const seal = cargoField(m, "seal_number", "seal");
  const weighbridge = cargoField(m, "weighbridge_ticket", "weighbridge");
  const loaded = cargoField(m, "loaded_quantity");
  const hasGps = m.last_latitude && m.last_longitude;

  return (
    <>
      <PageHeader
        title={`Movement ${m.reference}`}
        description={`${companyName(m.company)} · ${m.mineral || "Cargo"} from ${m.origin} to ${m.destination}`}
        actions={<Pill tone={STATUS_TONE[m.status]}>{MOVEMENT_STATUS_LABEL[m.status]}</Pill>}
      />
      {readOnly && (
        <p className="mb-4 text-xs text-muted-foreground">
          Read-only oversight view. Trips are run by the carrier in the Logistics Portal.
        </p>
      )}
      <Panel title="Progress" className="mb-4">
        <StageStrip status={m.status} />
        <p className="mt-3 text-xs text-muted-foreground">
          A timestamped history of each stage, with evidence, arrives with the trip milestone record
          (backend task BE-L3).
        </p>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cargo">
          <KeyValue
            items={[
              { label: "Mineral", value: m.mineral || "—" },
              {
                label: "Declared quantity",
                value: m.quantity_display || `${m.quantity} ${m.quantity_unit}`,
              },
              { label: "Loaded quantity", value: loaded ?? "Not recorded" },
              { label: "Seal number", value: seal ?? "Not recorded" },
              { label: "Weighbridge ticket", value: weighbridge ?? "Not recorded" },
              { label: "Batch", value: m.batch_id || "—" },
              { label: "Miner", value: m.miner || "—" },
              { label: "Buyer", value: m.buyer || "—" },
              {
                label: "Transaction / RFQ",
                value: [m.transaction_id, m.rfq_id].filter(Boolean).join(" · ") || "—",
              },
            ]}
          />
        </Panel>
        <Panel title="Carrier and timing">
          <KeyValue
            items={[
              { label: "Company", value: companyName(m.company) },
              { label: "Vehicle", value: m.vehicle_registration ?? "Not assigned" },
              { label: "Driver", value: m.driver_name ?? "Not assigned" },
              { label: "Movement type", value: m.movement_type || "—" },
              { label: "Pickup", value: fmtDateTime(m.pickup_at) },
              { label: "ETA", value: fmtDateTime(m.eta_at) },
              { label: "Delivered", value: fmtDateTime(m.delivered_at) },
              {
                label: "Last GPS",
                value: hasGps ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {Number(m.last_latitude).toFixed(4)}, {Number(m.last_longitude).toFixed(4)}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({fmtDateTime(m.last_gps_at)})
                    </span>
                  </span>
                ) : (
                  "No fix yet"
                ),
              },
            ]}
          />
        </Panel>
      </div>
      <Panel
        title="Deliveries"
        description="What the receiver recorded on arrival"
        className="mt-4"
        bodyClassName="p-0"
      >
        {deliveries.isPending ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : (deliveries.data?.results ?? []).length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No delivery recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Delivery</th>
                  <th className="px-4 py-2.5 font-medium">Destination</th>
                  <th className="px-4 py-2.5 font-medium">Expected</th>
                  <th className="px-4 py-2.5 font-medium">Received</th>
                  <th className="px-4 py-2.5 font-medium">Variance</th>
                  <th className="px-4 py-2.5 font-medium">Custody transferred</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(deliveries.data?.results ?? []).map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-mono text-xs">
                      {d.reference}
                      {d.receipt_reference && (
                        <p className="text-muted-foreground">Receipt {d.receipt_reference}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.destination}
                      <p className="text-xs text-muted-foreground">{d.destination_type}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {d.expected_quantity} {d.quantity_unit}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {d.received_quantity ? `${d.received_quantity} ${d.quantity_unit}` : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{d.variance ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{fmtDateTime(d.custody_transferred_at)}</td>
                    <td className="px-4 py-3">
                      <Pill
                        tone={
                          d.status === "completed"
                            ? "success"
                            : d.status === "variance_flagged"
                              ? "danger"
                              : "info"
                        }
                      >
                        {DELIVERY_STATUS_LABEL[d.status]}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Incidents and exceptions" className="mt-4" bodyClassName="p-0">
        {incidents.isPending ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : (incidents.data?.results ?? []).length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No incident reported on this trip.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(incidents.data?.results ?? []).map((i) => (
              <li key={i.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{i.reference}</span>
                  <Pill
                    tone={
                      i.severity === "critical" || i.severity === "high"
                        ? "danger"
                        : i.severity === "medium"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {i.severity}
                  </Pill>
                  <Pill
                    tone={i.status === "closed" || i.status === "resolved" ? "success" : "warning"}
                  >
                    {INCIDENT_STATUS_LABEL[i.status]}
                  </Pill>
                  <span className="text-xs text-muted-foreground">
                    {i.incident_type} · {fmtDateTime(i.occurred_at)}
                    {i.location ? ` · ${i.location}` : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-sm">{i.description}</p>
                {i.immediate_action && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Action taken: {i.immediate_action}
                  </p>
                )}
                {i.resolution && (
                  <p className="mt-1 text-xs text-muted-foreground">Resolution: {i.resolution}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
