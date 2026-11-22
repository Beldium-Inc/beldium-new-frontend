import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { fieldCls } from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel, StatCard } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import {
  DEMO_OPENINGS,
  applicableReqs,
  defaultVehicleFor,
  openingRestrictions,
  operatorStatus,
  type Readiness,
  type VerificationRecord,
} from "@/lib/independent/model";
import { useIndependentNotifications } from "@/lib/independent/notifications";
import { useIndependent } from "@/lib/independent/store";
import { isActiveTrip, nextStage } from "@/lib/trips/model";

import { ErrorText, KeyValues, TextField, humanize } from "./form";
import { IndependentVehicleForm } from "./onboarding";

const readinessLabel = (r: Readiness | undefined) =>
  r === "Compliant"
    ? "Demo Eligible"
    : r === "Non-compliant"
      ? "Demo Restricted"
      : "Review required";

function useStatus() {
  const { workspace } = useIndependent();
  return operatorStatus(workspace.application, workspace.review);
}

function EditLink() {
  const { workspace } = useIndependent();
  return (
    <Button asChild variant="outline">
      <Link to="/independent/onboarding">
        {workspace.application.status === "Draft" ? "Continue onboarding" : "Edit declarations"}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Link>
    </Button>
  );
}

function Header({ title, description }: { title: string; description?: string }) {
  const status = useStatus();
  return (
    <PageHeader
      title={title}
      description={
        description ??
        "Your records stay in this browser until Beldium connects them to the platform."
      }
      actions={<StatusBadge value={status} />}
    />
  );
}

// --- dashboard -------------------------------------------------------------------------------

export function Dashboard() {
  const { workspace, isDemo, setSubject } = useIndependent();
  const { application: a, review, trips } = workspace;
  const status = useStatus();
  const active = trips.filter(isActiveTrip).length;

  return (
    <>
      <Header
        title="Independent Transport Operator"
        description={`${a.personal["firstName"] ?? ""} ${a.personal["lastName"] ?? ""} · ${a.profile["operatorType"] ?? "Operator profile pending"}`}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Account active · application</p>
          <p className="font-mono text-sm font-medium">{a.reference ?? "Draft application"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your account is active. Compliance is separate: a pending review is not eligibility.
          </p>
        </div>
        <EditLink />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Operator type" value={a.profile["operatorType"] ?? "—"} />
        <StatCard label="Vehicles" value={String(a.driverOnly ? 0 : a.vehicles.length)} />
        <StatCard
          label="Compliance"
          value={status}
          tone={
            status === "Demo Eligible"
              ? "success"
              : status === "Demo Restricted"
                ? "danger"
                : "warning"
          }
        />
        <StatCard label="Active trips" value={String(active)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Operational readiness">
          <KeyValues
            items={[
              ["Driver credentials", readinessLabel(review?.driver)],
              [
                "Vehicle access",
                a.driverOnly
                  ? "Driver-only · vehicle-dependent assignments restricted"
                  : a.vehicles.length
                    ? `${a.vehicles.length} declared`
                    : "No vehicle declared",
              ],
              ["Declared corridors", a.scope["corridors"]],
              ["Capacity / month", a.scope["monthlyCapacity"]],
            ]}
          />
        </Panel>
        <Panel title="Next actions">
          <div className="flex flex-wrap gap-2">
            {a.status === "Draft" ? (
              <Button asChild>
                <Link to="/independent/onboarding">Complete onboarding</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/independent/compliance">View compliance findings</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/independent/assignments">Available assignments</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/independent/trips">My trips</Link>
            </Button>
          </div>
          {!isDemo && status !== "Demo Eligible" ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Officer review of independent operators is not connected to Beldium yet, so your
              record stays at “{status}”. To walk through assignments and trips,{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => setSubject("demo")}
              >
                open the seeded demo operator
              </button>
              .
            </p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}

// --- profile, vehicles, credentials ----------------------------------------------------------

export function Profile() {
  const { workspace } = useIndependent();
  const a = workspace.application;
  return (
    <>
      <Header title="My Profile" />
      <div className="space-y-4">
        {(
          [
            ["Personal identity", a.personal],
            ["Operator profile", a.profile],
            ["Operating scope", a.scope],
          ] as const
        ).map(([title, data]) => (
          <Panel key={title} title={title}>
            <KeyValues items={Object.entries(data).map(([k, v]) => [humanize(k), v])} />
          </Panel>
        ))}
        <EditLink />
      </div>
    </>
  );
}

export function Vehicles() {
  const { workspace, save } = useIndependent();
  const { application: a, review } = workspace;
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState("");
  const vehicles = a.driverOnly ? [] : a.vehicles;
  return (
    <>
      <Header title="My Vehicles" />
      <div className="mb-5 flex flex-wrap gap-2">
        <Button onClick={() => setAdding(!adding)}>
          <Plus className="mr-1.5 h-4 w-4" /> Declare vehicle
        </Button>
        <EditLink />
      </div>
      {adding ? (
        <Panel title="New vehicle declaration" className="mb-5">
          <IndependentVehicleForm
            onAdd={(v) => {
              if (a.vehicles.some((x) => x.registration === v.registration))
                return setError("That registration is already declared.");
              save({ ...a, driverOnly: false, vehicles: [...a.vehicles, v] });
              setAdding(false);
              setError("");
              toast.success(
                a.status === "Submitted"
                  ? `${v.registration} declared. Your record goes back for review.`
                  : `${v.registration} declared.`,
              );
            }}
          />
          <ErrorText text={error} />
        </Panel>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {vehicles.map((v) => (
          <Panel
            key={v.id}
            title={v.registration}
            action={
              <StatusBadge
                value={
                  a.status === "Draft"
                    ? "Draft declaration"
                    : readinessLabel(review?.vehicles[v.id])
                }
              />
            }
          >
            <KeyValues
              items={[
                ["Type", v.type],
                ["Ownership", v.ownership],
                ["Payload", `${v.payload} t`],
                [
                  "Owner authorization",
                  v.ownership === "Owned" ? "Owned" : v.ownerAuthorization ? "Declared" : "Missing",
                ],
                ["Insurance expiry", v.insuranceExpiry],
                ["Roadworthiness expiry", v.roadworthinessExpiry],
              ]}
            />
          </Panel>
        ))}
      </div>
      {!vehicles.length ? (
        <p className="py-5 text-sm text-muted-foreground">
          Driver-only workspace. No vehicle is assigned, so assignments that need a vehicle cannot
          be accepted.
        </p>
      ) : null}
    </>
  );
}

export function Credentials() {
  const { workspace } = useIndependent();
  const { application: a, review } = workspace;
  return (
    <>
      <Header title="Driver Credentials" />
      <Panel
        title="Driver's licence"
        action={
          <StatusBadge
            value={a.status === "Draft" ? "Draft declaration" : readinessLabel(review?.driver)}
          />
        }
      >
        <KeyValues items={Object.entries(a.licence).map(([k, v]) => [humanize(k), v])} />
        <p className="mt-4 text-xs text-muted-foreground">
          Your driver readiness is reviewed separately from your operator application.
        </p>
      </Panel>
      <div className="mt-4">
        <EditLink />
      </div>
    </>
  );
}

// --- compliance -------------------------------------------------------------------------------

export function VerificationRecordView({ record }: { record: VerificationRecord | undefined }) {
  if (!record)
    return (
      <p className="text-xs text-muted-foreground">No verification recorded by an officer yet.</p>
    );
  return (
    <KeyValues
      items={[
        ["Source", record.source],
        ["Method", record.method],
        ["Officer", record.officer],
        ["Recorded", new Date(record.at).toLocaleString("en-GB")],
        ["Findings", record.findings],
        ["Decision", record.decision],
        ["Scope", record.scope],
        ["Next review", record.nextReview],
      ]}
    />
  );
}

export function Compliance() {
  const { workspace, respond } = useIndependent();
  const { application: a, review } = workspace;
  const status = useStatus();
  const [reply, setReply] = React.useState<Record<string, string>>({});
  const [file, setFile] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState("");

  return (
    <>
      <Header title="Compliance Centre" />
      <div className="space-y-4">
        <Panel title="Application record" action={<EditLink />}>
          <KeyValues
            items={[
              ["Reference", a.reference ?? "Not submitted"],
              [
                "Submitted",
                a.submittedAt ? new Date(a.submittedAt).toLocaleString("en-GB") : "Not submitted",
              ],
              ["Compliance status", status],
              ["Reviewer", review?.reviewer ?? "Unassigned"],
              ["Decision findings", review?.decisionSummary ?? "No decision recorded"],
            ]}
          />
        </Panel>

        <Panel
          title="Requirements and verification"
          description="Each requirement is verified by an officer, who records the source, method and findings."
        >
          <ul className="divide-y divide-border">
            {applicableReqs(a).map((r) => {
              const rr = review?.requirements[r.id];
              return (
                <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.reason} · Filename: {a.evidence[r.id]?.filename || "not declared"}
                      </p>
                    </div>
                    <StatusBadge
                      value={rr ? rr.status : a.status === "Draft" ? "Draft" : "Pending"}
                    />
                  </div>
                  <VerificationRecordView record={rr?.verification} />
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Information requests">
          {!review?.requests.length ? (
            <p className="text-sm text-muted-foreground">No information requests.</p>
          ) : (
            <ul className="space-y-5">
              {review.requests.map((r) => (
                <li key={r.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{r.reason}</h3>
                    <StatusBadge value={r.status} />
                  </div>
                  <p className="my-2 text-sm">{r.message}</p>
                  <ul className="mb-3 list-inside list-disc text-sm">
                    {r.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  {r.response ? (
                    <p className="text-sm text-muted-foreground">
                      Your response: {r.response.message} · {r.response.filename}
                    </p>
                  ) : (
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        try {
                          respond(r.id, reply[r.id] ?? "", file[r.id] ?? "");
                          setError("");
                        } catch (err) {
                          setError((err as Error).message);
                        }
                      }}
                    >
                      <TextField
                        label="Response"
                        value={reply[r.id] ?? ""}
                        onChange={(v) => setReply({ ...reply, [r.id]: v })}
                      />
                      <TextField
                        label="Replacement filename"
                        required={false}
                        value={file[r.id] ?? ""}
                        onChange={(v) => setFile({ ...file, [r.id]: v })}
                      />
                      <Button type="submit" className="sm:col-span-2 sm:w-fit">
                        Send response
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          <ErrorText text={error} />
        </Panel>
      </div>
    </>
  );
}

// --- assignments --------------------------------------------------------------------------------

export function Assignments() {
  const { workspace, acceptOpening } = useIndependent();
  const { application: a, review, trips } = workspace;
  const [selected, setSelected] = React.useState<Record<string, string>>({});
  const [accepted, setAccepted] = React.useState("");
  const [error, setError] = React.useState("");
  const eligibleChoices = a.driverOnly ? [] : a.vehicles;

  return (
    <>
      <Header
        title="Available Assignments"
        description="Demo transport openings. Each one checks your driver, vehicle, payload, scope verification and active trips."
      />
      {accepted ? (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm"
        >
          <span>Assignment accepted · {accepted}</span>
          <Button asChild size="sm">
            <Link to="/independent/trips/$tripId" params={{ tripId: accepted }}>
              Open trip <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
      <ErrorText text={error} />
      <div className="grid gap-4 xl:grid-cols-2">
        {DEMO_OPENINGS.map((o) => {
          const vehicleId = selected[o.id] ?? defaultVehicleFor(o, a, review);
          const reasons = openingRestrictions(o, a, review, trips, vehicleId || undefined);
          return (
            <Panel key={o.id} title={o.mineral} description={`${o.id} · ${o.client}`}>
              <KeyValues
                items={[
                  ["Quantity", `${o.quantity} ${o.unit}`],
                  ["Minimum payload", `${o.minPayload} t`],
                  ["Route", `${o.pickup} → ${o.destination}`],
                  ["Pickup date", o.date],
                ]}
              />
              <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
                Vehicle
                <select
                  className={fieldCls}
                  value={vehicleId}
                  onChange={(e) => setSelected({ ...selected, [o.id]: e.target.value })}
                >
                  <option value="">
                    {eligibleChoices.length ? "Select a vehicle" : "No vehicle declared"}
                  </option>
                  {eligibleChoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration} · {v.payload} t · {readinessLabel(review?.vehicles[v.id])}
                    </option>
                  ))}
                </select>
              </label>
              {reasons.length ? (
                <ul className="my-4 list-inside list-disc space-y-1 text-xs text-warning-foreground">
                  {reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="my-4 text-sm text-success">All eligibility checks passed.</p>
              )}
              <Button
                disabled={reasons.length > 0}
                onClick={() => {
                  try {
                    setAccepted(acceptOpening(o.id, vehicleId));
                    setError("");
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                Accept assignment
              </Button>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

// --- trip lists -----------------------------------------------------------------------------------

export type TripListView = "trips" | "pickup" | "journey" | "delivery";

const tripTitles: Record<TripListView, [string, string]> = {
  trips: ["My Trips", "Open trip"],
  pickup: ["Pickup / Loading", "Record pickup and loading"],
  journey: ["Journey Milestones", "Record journey event"],
  delivery: ["Proof of Delivery", "Record or inspect delivery"],
};

export function TripList({ view }: { view: TripListView }) {
  const { workspace } = useIndependent();
  const [title, cta] = tripTitles[view];
  const trips = workspace.trips.filter((t) =>
    view === "pickup"
      ? ["Accepted", "Scheduled", "Mobilized", "Arrived at Pickup"].includes(t.status)
      : view === "journey"
        ? isActiveTrip(t)
        : view === "delivery"
          ? t.status === "Arrived at Destination" || t.deliveries.length > 0
          : true,
  );
  return (
    <>
      <Header title={title} />
      {!trips.length ? (
        <p className="py-6 text-sm text-muted-foreground">
          {workspace.trips.length
            ? "No trips at this stage."
            : "No trips yet. Eligible operators can accept an available assignment."}
        </p>
      ) : null}
      <div className="space-y-4">
        {trips.map((t) => (
          <Panel
            key={t.id}
            title={t.id}
            description={`${t.cargo.mineral} · ${t.pickup} → ${t.destination}`}
            action={<StatusBadge value={t.status} />}
          >
            {view === "journey" ? (
              <ol className="mb-4 space-y-1 text-xs text-muted-foreground">
                {t.milestones.map((m) => (
                  <li key={m.id}>
                    <span className="font-medium text-foreground">{m.type}</span> ·{" "}
                    {new Date(m.at).toLocaleString("en-GB")} · {m.location}
                  </li>
                ))}
              </ol>
            ) : null}
            {view === "delivery"
              ? t.deliveries.map((d) => (
                  <p key={d.id} className="mb-3 text-sm">
                    {d.quantity} {d.unit} · {d.filename} · <StatusBadge value={d.status} />
                  </p>
                ))
              : null}
            {view !== "journey" && view !== "delivery" ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Next:{" "}
                {nextStage(t.status) ??
                  (t.status === "Exception" || t.status === "Disputed" ? "Resume" : "—")}
              </p>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/independent/trips/$tripId" params={{ tripId: t.id }}>
                {cta} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </Panel>
        ))}
      </div>
    </>
  );
}

// --- notifications & settings ---------------------------------------------------------------------

export function Notifications() {
  const { markRead } = useIndependent();
  const items = useIndependentNotifications();
  return (
    <>
      <Header title="Notifications" />
      <Panel title={`${items.filter((n) => !n.read).length} unread`}>
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </div>
              <Button size="sm" variant="outline" disabled={n.read} onClick={() => markRead(n.id)}>
                {n.read ? "Read" : "Mark read"}
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

export function Settings() {
  const { user, isDemo, setSubject, resetDemo } = useIndependent();
  return (
    <>
      <Header title="Settings" />
      <div className="space-y-4">
        <Panel title="Account">
          <KeyValues
            items={[
              ["Account type", "Independent Transport Operator"],
              ["Email", user.email],
              ["Account status", user.email_verified_at ? "Active" : "Pending email verification"],
              ["Two-step sign-in", user.mfa_enabled ? "On" : "Off"],
            ]}
          />
        </Panel>
        <Panel
          title="Workspace records"
          description="Your application, review and trips are kept in this browser until Beldium's independent operator service is connected. They are not shared with officers yet."
        >
          <div className="flex flex-wrap gap-2">
            <EditLink />
            {isDemo ? (
              <>
                <Button variant="outline" onClick={() => setSubject("mine")}>
                  Back to my record
                </Button>
                <Button variant="outline" onClick={resetDemo}>
                  Reset demo operator
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSubject("demo")}>
                Open the seeded demo operator
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
