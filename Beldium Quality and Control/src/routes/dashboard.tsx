import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/beldium/shell";
import { EmptyState, Field, PageHeader, Pill, SectionTitle, Stat, StatusPill, Surface } from "@/components/beldium/ui";
import { useBeldium } from "@/lib/beldium/store";
import { roleMeta } from "@/lib/beldium/data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Role dashboard — Beldium Quality & Control" },
      {
        name: "description",
        content:
          "Role-specific compliance dashboard: verification queue, custody status, testing throughput and certificate trust signals.",
      },
      { property: "og:title", content: "Role dashboard — Beldium Quality & Control" },
      {
        property: "og:description",
        content: "Verification queue, custody status, testing throughput and certificate trust.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <DashboardPage />
    </AppShell>
  ),
});

function DashboardPage() {
  const { user, state } = useBeldium();
  if (!user) return null;
  const { applications, samples, certificates, nonConformities } = state;

  const openApps = applications.filter((a) => a.status !== "approved" && a.status !== "rejected");
  const openFlags = applications.flatMap((a) => a.riskFlags.filter((f) => !f.resolved));
  const openNcrs = nonConformities.filter((n) => n.status !== "closed");
  const pendingResults = samples.filter((s) => s.results.some((r) => r.verdict === "pending"));

  const role = user.role;

  return (
    <>
      <PageHeader
        eyebrow={roleMeta[role].label}
        title={`Good day, ${user.name.split(" ")[0]}`}
        description={roleMeta[role].tagline}
        actions={<Pill tone="info">{user.org}</Pill>}
      />

      {role === "operator" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Open applications" value={openApps.length} sub="awaiting operator action" />
            <Stat label="Unresolved risk flags" value={openFlags.length} sub="across all partners" />
            <Stat
              label="Documents pending"
              value={applications.flatMap((a) => a.documents).filter((d) => d.status === "pending").length}
              sub="verification required"
            />
            <Stat label="Open non-conformities" value={openNcrs.length} sub="CAPA supervision" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Surface>
              <SectionTitle
                title="Verification queue"
                hint="Quality & Control Partner applications assigned to your desk"
                action={
                  <Link to="/applications" className="text-sm font-medium text-link hover:underline">
                    Open queue
                  </Link>
                }
              />
              <div className="divide-y divide-border">
                {openApps.length === 0 ? (
                  <EmptyState title="Queue clear" hint="No applications awaiting action." />
                ) : (
                  openApps.map((a) => (
                    <Link
                      key={a.id}
                      to="/applications/$id"
                      params={{ id: a.id }}
                      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-accent/50"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-navy">
                          {a.organisation.legalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.ref} · submitted {a.submittedAt} · {a.organisation.country}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill tone={a.riskScore > 50 ? "danger" : a.riskScore > 25 ? "warning" : "success"}>
                          risk {a.riskScore}
                        </Pill>
                        <StatusPill value={a.status} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Surface>

            <Surface>
              <SectionTitle title="Live risk signals" hint="Automatically screened, operator adjudicated" />
              <div className="divide-y divide-border">
                {openFlags.length === 0 ? (
                  <EmptyState title="No open flags" />
                ) : (
                  openFlags.slice(0, 6).map((f) => (
                    <div key={f.id} className="flex gap-3 px-6 py-4">
                      <AlertTriangle
                        className={
                          f.severity === "high"
                            ? "mt-0.5 size-4 shrink-0 text-danger-foreground"
                            : "mt-0.5 size-4 shrink-0 text-warning-foreground"
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-navy">{f.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.detail}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Surface>
          </div>
        </>
      ) : null}

      {role === "partner" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Samples in lab" value={samples.filter((s) => ["received", "testing"].includes(s.status)).length} sub="received or under test" />
            <Stat label="Results pending" value={pendingResults.length} sub="awaiting analyst entry" />
            <Stat label="Certificates issued" value={certificates.filter((c) => c.status === "active").length} sub="active and verifiable" />
            <Stat label="Open CAPAs" value={openNcrs.length} sub="corrective actions due" />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Surface>
              <SectionTitle title="Bench workload" action={<Link to="/samples" className="text-sm font-medium text-link hover:underline">All samples</Link>} />
              <div className="divide-y divide-border">
                {samples
                  .filter((s) => s.status !== "certified")
                  .map((s) => (
                    <Link key={s.id} to="/samples/$id" params={{ id: s.id }} className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-accent/50">
                      <div>
                        <p className="text-sm font-semibold text-navy">{s.ref}</p>
                        <p className="text-xs text-muted-foreground">{s.material} · lot {s.lot}</p>
                      </div>
                      <StatusPill value={s.status} />
                    </Link>
                  ))}
              </div>
            </Surface>
            <Surface>
              <SectionTitle title="Accreditation health" hint="Your listing on the Beldium partner register" />
              <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                <Field label="Accreditation" value="ISO/IEC 17025:2017 (BELAC 268-TEST)" />
                <Field label="Valid until" value="2027-02-28" />
                <Field label="Proficiency" value="Round 2026-A satisfactory" />
                <Field label="Listing status" value={<StatusPill value="in_review" />} />
              </dl>
              <div className="mx-6 mb-6 rounded-2xl bg-warning/15 p-4 text-xs text-warning-foreground">
                <p className="font-semibold">Action required</p>
                <p className="mt-1">
                  Your 3TG export handling permit has expired. 3TG intake is suspended until renewal
                  evidence is filed under NCR-2026-018.
                </p>
              </div>
            </Surface>
          </div>
        </>
      ) : null}

      {role === "miner" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Lots registered" value={samples.length} sub="this quarter" />
            <Stat label="In transit" value={samples.filter((s) => s.status === "in_transit").length} sub="custody open" />
            <Stat label="Under test" value={samples.filter((s) => s.status === "testing").length} sub="at partner lab" />
            <Stat label="Certified" value={samples.filter((s) => s.status === "certified").length} sub="buyer-ready" />
          </div>
          <Surface className="mt-6">
            <SectionTitle title="My lots" hint="Register a sample and follow it to certification" action={<Link to="/samples" className="text-sm font-medium text-link hover:underline">Register sample</Link>} />
            <div className="divide-y divide-border">
              {samples.map((s) => (
                <Link key={s.id} to="/samples/$id" params={{ id: s.id }} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-accent/50">
                  <div>
                    <p className="text-sm font-semibold text-navy">{s.lot} · {s.ref}</p>
                    <p className="text-xs text-muted-foreground">{s.mineSite} · {s.massKg} kg · {s.material}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone="info">{s.custody.length} custody events</Pill>
                    <StatusPill value={s.status} />
                  </div>
                </Link>
              ))}
            </div>
          </Surface>
        </>
      ) : null}

      {role === "buyer" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Incoming lots" value={samples.length} sub="matched to your specs" />
            <Stat label="Spec conformant" value={samples.filter((s) => s.qualityReview?.verdict === "pass").length} sub="full pass" />
            <Stat label="Concession needed" value={samples.filter((s) => s.qualityReview?.verdict === "conditional").length} sub="conditional results" />
            <Stat label="Active certificates" value={certificates.filter((c) => c.status === "active").length} sub="verifiable" />
          </div>
          <Surface className="mt-6">
            <SectionTitle title="Specification matching" hint="How delivered material performs against your purchase specifications" />
            <div className="divide-y divide-border">
              {samples.map((s) => (
                <Link key={s.id} to="/samples/$id" params={{ id: s.id }} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-accent/50">
                  <div>
                    <p className="text-sm font-semibold text-navy">{s.ref} · {s.material}</p>
                    <p className="text-xs text-muted-foreground">{s.origin} · supplier {s.minerOrg}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.qualityReview ? <StatusPill value={s.qualityReview.verdict} /> : <Pill tone="neutral">awaiting review</Pill>}
                    <ArrowUpRight className="size-4 text-link" />
                  </div>
                </Link>
              ))}
            </div>
          </Surface>
        </>
      ) : null}

      {role === "regulator" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Registered partners" value={applications.filter((a) => a.status === "approved").length} sub="approved listings" />
            <Stat label="Applications in flight" value={openApps.length} sub="under operator review" />
            <Stat label="Certificates in market" value={certificates.length} sub={`${certificates.filter((c) => c.status === "revoked").length} revoked`} />
            <Stat label="Open non-conformities" value={openNcrs.length} sub="supervised remediation" />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Surface>
              <SectionTitle title="Oversight register" hint="Read-only view of partner standing" />
              <div className="divide-y divide-border">
                {applications.map((a) => (
                  <Link key={a.id} to="/applications/$id" params={{ id: a.id }} className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-semibold text-navy">{a.organisation.legalName}</p>
                      <p className="text-xs text-muted-foreground">{a.laboratory.accreditationBody} · {a.organisation.country}</p>
                    </div>
                    <StatusPill value={a.status} />
                  </Link>
                ))}
              </div>
            </Surface>
            <Surface>
              <SectionTitle title="Chain integrity" hint="Custody seals recorded across monitored lots" />
              <div className="divide-y divide-border">
                {samples.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-navy">{s.ref}</p>
                      <p className="text-xs text-muted-foreground">{s.origin}</p>
                    </div>
                    {s.custody.every((c) => c.sealIntact) ? (
                      <Pill tone="success">
                        <CheckCircle2 className="size-3" /> seals intact
                      </Pill>
                    ) : (
                      <Pill tone="danger">seal breach</Pill>
                    )}
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </>
      ) : null}

      <Surface className="mt-6">
        <SectionTitle title="Recent activity" hint="Immutable actions recorded against your visibility scope" />
        <div className="divide-y divide-border">
          {[...applications.flatMap((a) => a.audit.map((e) => ({ ...e, ctx: a.ref }))), ...samples.flatMap((s) => s.audit.map((e) => ({ ...e, ctx: s.ref })))]
            .sort((a, b) => (a.at < b.at ? 1 : -1))
            .slice(0, 6)
            .map((e) => (
              <div key={e.id + e.ctx} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3">
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-navy">
                      <span className="font-medium">{e.actor}</span> — {e.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{e.ctx} · {e.detail}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{e.at}</span>
              </div>
            ))}
        </div>
      </Surface>
    </>
  );
}
