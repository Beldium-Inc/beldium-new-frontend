import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Gauge,
  History,
  MessageSquarePlus,
  MessageSquareWarning,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ComplianceBanner } from "@/verticals/logistics/AppShell";
import {
  CheckStatusBadge,
  DocStatusBadge,
  KeyValue,
  PageHeader,
  Panel,
  Pill,
  RiskBadge,
  ScoreBar,
  StatusBadge,
} from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";
import { REQUEST_REASONS, type Company } from "@/verticals/logistics/mock-data";
import { Preview, useProtectedFile } from "@/components/file-preview";
import { ApiError } from "@/lib/api/errors";
import { useDocumentNotes } from "@/lib/api/logistics-queries";
import { cn } from "@/lib/utils";

const describeError = (err: unknown) =>
  err instanceof ApiError || err instanceof Error ? err.message : "Please try again.";

type Tab = "overview" | "review" | "documents" | "risk" | "requests" | "decision" | "activity";

export const Route = createFileRoute("/logistics/operator/applications/$companyId")({
  validateSearch: (search: Record<string, unknown>) => ({ tab: (search["tab"] as Tab) ?? "overview" }),
  head: () => ({
    meta: [
      { title: "Company review | Beldium Compliance Operations" },
      { name: "description", content: "Nine-domain compliance review with inline document verification and approval decision." },
      { property: "og:title", content: "Company review | Beldium Compliance Operations" },
      { property: "og:description", content: "Corporate, regulatory, fleet, driver, insurance, H&S, operational, mineral and platform checks." },
    ],
  }),
  component: CompanyReview,
});

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Company profile" },
  { key: "review", label: "Compliance checks" },
  { key: "documents", label: "Document review" },
  { key: "risk", label: "Score & risk" },
  { key: "requests", label: "Information requests" },
  { key: "decision", label: "Approval decision" },
  { key: "activity", label: "Activity" },
];

function CompanyReview() {
  const { companyId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { companies, startReview } = useApp();
  const [starting, setStarting] = React.useState(false);
  const company = companies.find((c) => c.id === companyId);

  if (!company) {
    return (
      <AppShell role="operator" breadcrumbs={[{ label: "Applications", to: "/logistics/operator/applications" }, { label: "Unknown" }]}>
        <Panel>
          <p className="text-sm text-muted-foreground">
            No application found for {companyId}.{" "}
            <Link to="/logistics/operator/applications" className="text-[var(--link)] hover:underline">
              Back to applications
            </Link>
          </p>
        </Panel>
      </AppShell>
    );
  }

  const setTab = (t: Tab) => navigate({ to: "/logistics/operator/applications/$companyId", params: { companyId }, search: { tab: t } });
  const rich = company.checks.length > 0;

  return (
    <AppShell
      role="operator"
      breadcrumbs={[
        { label: "Compliance Operations", to: "/logistics/operator" },
        { label: "Applications", to: "/logistics/operator/applications" },
        { label: company.name },
      ]}
    >
      <PageHeader
        title={company.name}
        description={`${company.id} · ${company.rcNumber} · ${company.location}, ${company.state} · submitted ${company.submitted}`}
        actions={
          <>
            <StatusBadge status={company.status} />
            <RiskBadge risk={company.risk} score={company.riskScore} />
            <button
              type="button"
              disabled={starting}
              onClick={() => {
                // Only a submitted application can be started; anything already
                // in review is simply resumed.
                if (company.status !== "Pending Review") {
                  setTab("review");
                  return;
                }
                setStarting(true);
                startReview(company.id)
                  .then(() => {
                    toast.success("Review started");
                    setTab("review");
                  })
                  .catch((err: unknown) =>
                    toast.error("The review could not be started", {
                      description: describeError(err),
                    }),
                  )
                  .finally(() => setStarting(false));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90 disabled:opacity-40"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Start / resume review
            </button>
          </>
        }
      />

      {(company.restrictions ?? []).length > 0 ? (
        <ComplianceBanner
          tone="warning"
          title={`Restriction active: ${(company.restrictions ?? []).map((r) => r.scope).join(", ")}`}
          body={(company.restrictions ?? []).map((r) => r.reason).join(" · ")}
        />
      ) : null}

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap transition",
              tab === t.key ? "bg-[var(--brand)] text-white" : "text-muted-foreground hover:bg-muted hover:text-[var(--brand)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!rich && tab !== "requests" && tab !== "decision" ? (
        <Panel title="Summary record" description="This operator holds a summary compliance record in the prototype dataset.">
          <KeyValue
            items={[
              { label: "Registered name", value: company.name },
              { label: "RC number", value: company.rcNumber },
              { label: "Head office", value: `${company.location}, ${company.state}` },
              { label: "Fleet", value: `${company.fleetSize} vehicles` },
              { label: "Drivers", value: `${company.driverCount}` },
              { label: "Reviewer", value: company.reviewer },
              { label: "Compliance score", value: `${company.riskScore} / 100` },
              { label: "Services", value: company.services.join(", ") },
              { label: "Annual tonnage", value: company.annualTonnage },
            ]}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ScoreBar label="Fleet" value={company.scores.fleet} />
            <ScoreBar label="Drivers" value={company.scores.drivers} />
            <ScoreBar label="Insurance" value={company.scores.insurance} />
            <ScoreBar label="Safety" value={company.scores.safety} />
            <ScoreBar label="Mineral transport" value={company.scores.mineral} />
          </div>
        </Panel>
      ) : null}

      {rich && tab === "overview" ? <OverviewTab company={company} /> : null}
      {rich && tab === "review" ? <ChecksTab company={company} /> : null}
      {rich && tab === "documents" ? <DocumentsTab company={company} /> : null}
      {rich && tab === "risk" ? <RiskTab company={company} /> : null}
      {tab === "requests" ? <RequestsTab company={company} /> : null}
      {tab === "decision" ? <DecisionTab company={company} /> : null}
      {rich && tab === "activity" ? <ActivityTab company={company} /> : null}
    </AppShell>
  );
}

/* ---------------------------- Overview ---------------------------- */

function OverviewTab({ company }: { company: Company }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <Panel title="Company information" description="Verified against Corporate Affairs Commission records">
          <KeyValue
            items={[
              { label: "Registered name", value: company.name },
              { label: "RC number", value: company.rcNumber },
              { label: "Beldium ID", value: company.id },
              { label: "Incorporated", value: company.incorporated },
              { label: "Head office", value: `${company.location}, ${company.state}` },
              { label: "Country", value: company.country },
              { label: "Primary contact", value: company.contactName },
              { label: "Email", value: company.contactEmail },
              { label: "Phone", value: company.contactPhone },
              { label: "Website", value: company.website },
              { label: "Employees", value: company.employees },
              { label: "Annual tonnage", value: company.annualTonnage },
            ]}
          />
        </Panel>

        <Panel title="Operating locations" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {company.operatingLocations.map((l) => (
              <li key={l.name} className="flex items-start gap-3 px-5 py-3.5">
                <Building2 className="mt-0.5 h-4 w-4 text-[var(--link)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--brand)]">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.address}</p>
                </div>
                <Pill tone="info">{l.type}</Pill>
                <Pill>{l.staff} staff</Pill>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Fleet snapshot" bodyClassName="p-0">
            <ul className="divide-y divide-border text-sm">
              {company.vehicles.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <Truck className="h-4 w-4 text-[var(--link)]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--brand)]">{v.registration}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.make} {v.model} · {v.type}
                    </p>
                  </div>
                  <Pill tone={v.status === "Compliant" ? "success" : v.status === "Attention" ? "warning" : "danger"}>
                    {v.status}
                  </Pill>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Driver snapshot" bodyClassName="p-0">
            <ul className="divide-y divide-border text-sm">
              {company.drivers.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <Users className="h-4 w-4 text-[var(--link)]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--brand)]">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.licenceClass} · expires {d.licenceExpiry}
                    </p>
                  </div>
                  <Pill tone={d.status === "Compliant" ? "success" : d.status === "Attention" ? "warning" : "danger"}>
                    {d.status}
                  </Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="space-y-4">
        <Panel title="Compliance score" description="Weighted across nine domains">
          <div className="mb-4 flex items-end gap-2">
            <span className="font-display text-4xl leading-none font-semibold text-[var(--brand)]">{company.riskScore}</span>
            <span className="pb-1 text-sm text-muted-foreground">/ 100</span>
            <span className="ml-auto pb-1">
              <RiskBadge risk={company.risk} />
            </span>
          </div>
          <div className="space-y-3">
            <ScoreBar label="Fleet compliance" value={company.scores.fleet} />
            <ScoreBar label="Driver compliance" value={company.scores.drivers} />
            <ScoreBar label="Insurance" value={company.scores.insurance} />
            <ScoreBar label="Health & safety" value={company.scores.safety} />
            <ScoreBar label="Mineral transport" value={company.scores.mineral} />
          </div>
          <p className="mt-4 rounded-lg bg-[var(--warning)]/15 px-3 py-2 text-xs text-[var(--warning-foreground)]">
            Mineral transport scores 0, licence pending at the Mining Cadastre Office.
          </p>
        </Panel>

        <Panel title="Services offered">
          <div className="flex flex-wrap gap-2">
            {company.services.map((s) => (
              <Pill key={s} tone="info">
                {s}
              </Pill>
            ))}
          </div>
        </Panel>

        <Panel title="Case details">
          <KeyValue
            items={[
              { label: "Reviewer", value: company.reviewer },
              { label: "Submitted", value: company.submitted },
              { label: "Last activity", value: company.lastActivity },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

/* ---------------------------- Checks ---------------------------- */

function ChecksTab({ company }: { company: Company }) {
  const { reviewSection } = useApp();
  const [openKey, setOpenKey] = React.useState<string>(company.checks[0]?.key ?? "");
  const signedOff = company.checks.filter((c) => c.reviewNotes);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-3 xl:col-span-2">
        {company.checks.map((section) => {
          const open = openKey === section.key;
          return (
            <section
              key={section.key}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenKey(open ? "" : section.key)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-semibold text-[var(--brand)]">
                    {section.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{section.description}</span>
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {section.score}%
                </span>
                <CheckStatusBadge status={section.status} />
              </button>
              {open ? (
                <div className="border-t border-border bg-muted/30 px-5 py-4">
                  {section.items.length > 0 ? (
                    <ul className="mb-3 grid gap-2.5 sm:grid-cols-2">
                      {section.items.map((item) => (
                        <li
                          key={item.label}
                          className="rounded-lg border border-border bg-card px-3.5 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-[var(--brand)]">{item.label}</p>
                            <CheckStatusBadge status={item.status} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Linked documents:</span>
                    {section.documentIds.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground">none uploaded</span>
                    ) : null}
                    {section.documentIds.map((id) => {
                      const d = company.documents.find((x) => x.id === id);
                      return d ? (
                        <Pill
                          key={id}
                          tone={
                            d.status === "verified"
                              ? "success"
                              : d.status === "rejected"
                                ? "danger"
                                : "neutral"
                          }
                        >
                          <FileText className="h-3 w-3" /> {d.name}
                        </Pill>
                      ) : null;
                    })}
                  </div>
                  <SignOffForm
                    key={`${section.key}:${section.reviewedAt ?? ""}`}
                    company={company}
                    section={section}
                    onSave={(input) => reviewSection(company.id, section.key, input)}
                  />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="space-y-4">
        <Panel title="Sign-off notes" description="Recorded with each check" bodyClassName="p-0">
          <ul className="max-h-72 divide-y divide-border overflow-y-auto">
            {signedOff.length === 0 ? (
              <li className="px-5 py-3 text-xs text-muted-foreground">
                No check has been signed off yet.
              </li>
            ) : (
              signedOff.map((c) => (
                <li key={c.key} className="px-5 py-3">
                  <p className="text-xs text-muted-foreground">
                    {c.label}
                    {c.reviewedAt ? ` · ${c.reviewedAt}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-[var(--brand)]">{c.reviewNotes}</p>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel title="Domain scores">
          <div className="space-y-3">
            {company.checks.map((c) => (
              <ScoreBar key={c.key} label={c.label} value={c.score} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

type SignOffStatus = "passed" | "attention" | "failed";

/**
 * Operator verdict on one check. The API only accepts "passed" once the
 * section has its details and every current document for it is verified, so
 * that is shown as a hint here and the API's own answer is what gets reported.
 */
function SignOffForm({
  company,
  section,
  onSave,
}: {
  company: Company;
  section: Company["checks"][number];
  onSave: (input: {
    status: SignOffStatus;
    score: number;
    notes: string;
    applicable: boolean;
  }) => Promise<void>;
}) {
  const [status, setStatus] = React.useState<SignOffStatus>(
    section.status === "attention" || section.status === "failed" ? section.status : "passed",
  );
  const [score, setScore] = React.useState(section.score ? String(section.score) : "");
  const [notes, setNotes] = React.useState("");
  const [applicable, setApplicable] = React.useState(section.applicable ?? true);
  const [saving, setSaving] = React.useState(false);

  const linked = section.documentIds
    .map((id) => company.documents.find((d) => d.id === id))
    .filter((d): d is Company["documents"][number] => Boolean(d));
  const gaps: string[] = [];
  if (!section.hasData) gaps.push("the company has not filled in this section");
  if (linked.length === 0) gaps.push("no document is uploaded for it");
  else if (linked.some((d) => d.status !== "verified"))
    gaps.push("not every linked document is verified");

  const save = async () => {
    const value = Number(score);
    if (score.trim() === "" || !Number.isInteger(value) || value < 0 || value > 100) {
      toast.error("Enter a score between 0 and 100.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Add a sign-off note explaining the verdict.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ status, score: value, notes: notes.trim(), applicable });
      toast.success(`${section.label}: ${applicable ? status : "not applicable"}`);
      setNotes("");
    } catch (err) {
      toast.error(`${section.label} was not signed off`, { description: describeError(err) });
    } finally {
      setSaving(false);
    }
  };

  const field =
    "rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20";

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4">
      <p className="font-display text-xs font-semibold text-[var(--brand)]">Sign-off</p>
      {section.reviewNotes ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Last sign-off{section.reviewedAt ? ` ${section.reviewedAt}` : ""}: {section.reviewNotes}
        </p>
      ) : null}
      {status === "passed" && applicable && gaps.length > 0 ? (
        <p className="mt-2 rounded-lg bg-[var(--warning)]/15 px-3 py-2 text-xs text-[var(--brand)]">
          "Passed" will be refused while {gaps.join(", and ")}.
        </p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
        <label className="text-xs text-muted-foreground">
          Verdict
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SignOffStatus)}
            className={cn(field, "mt-1 block w-full")}
          >
            <option value="passed">Passed</option>
            <option value="attention">Needs attention</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          Score (0-100)
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className={cn(field, "mt-1 block w-full")}
          />
        </label>
      </div>
      {section.key === "mineral" ? (
        <label className="mt-3 flex items-center gap-2 text-xs text-[var(--brand)]">
          <input
            type="checkbox"
            checked={applicable}
            onChange={(e) => setApplicable(e.target.checked)}
          />
          This company transports minerals (untick only if it declared no mineral services)
        </label>
      ) : null}
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Sign-off note (required)"
        className={cn(field, "mt-3 w-full")}
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
      >
        <BadgeCheck className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Record sign-off"}
      </button>
    </div>
  );
}

/* ---------------------------- Documents ---------------------------- */

function DocumentsTab({ company }: { company: Company }) {
  const { reviewDocument, addDocumentNote } = useApp();
  const [selectedId, setSelectedId] = React.useState(company.documents[0]?.id ?? "");
  const [filter, setFilter] = React.useState("All");
  const [note, setNote] = React.useState("");
  const [reviewNote, setReviewNote] = React.useState("");
  const [busy, setBusy] = React.useState<"verified" | "rejected" | "note" | null>(null);
  const [requesting, setRequesting] = React.useState(false);
  const selected = company.documents.find((d) => d.id === selectedId) ?? company.documents[0];
  const categories = ["All", ...Array.from(new Set(company.documents.map((d) => d.category)))];
  const list = company.documents.filter((d) => filter === "All" || d.category === filter);

  // The download endpoint sits behind the bearer token, so the file is fetched
  // with it once and reused for the preview, "View" and "Download".
  const fileName = selected?.originalName || selected?.name || "document";
  const { file, error: fileError } = useProtectedFile(selected?.downloadUrl ?? null, fileName);
  const reviewable = selected?.status === "pending";
  const notes = useDocumentNotes(selected?.id ?? null).data ?? [];

  const describe = (err: unknown) => (err instanceof ApiError ? err.message : "Please try again.");

  const withFile = (run: (url: string) => void) => {
    if (file) run(file.url);
    else if (fileError) toast.error("This file could not be loaded", { description: fileError });
    else toast.info("The file is still loading. Try again in a moment.");
  };

  const view = () => withFile((url) => window.open(url, "_blank"));

  const download = () =>
    withFile((url) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

  // The API wants a note with every review and only accepts one while the
  // application is under review, so the outcome shown is the API's, not assumed.
  const review = async (status: "verified" | "rejected") => {
    if (!selected) return;
    const notes = reviewNote.trim();
    if (status === "rejected" && !notes) {
      toast.error("Add a review note saying why this document is rejected.");
      return;
    }
    setBusy(status);
    try {
      await reviewDocument(selected.id, status, notes || "Evidence checked and verified.");
      toast.success(`${selected.name}: ${status}`);
      setReviewNote("");
    } catch (err) {
      toast.error(`${selected.name} was not ${status}`, { description: describe(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Panel title="Submitted documents" description={`${company.documents.length} files`} bodyClassName="p-0">
        <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                filter === c ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-border text-muted-foreground hover:border-[var(--link)]/50",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <ul className="max-h-[640px] divide-y divide-border overflow-y-auto">
          {list.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-4 py-3 text-left transition",
                  selected?.id === d.id ? "bg-[var(--brand-soft)]/50" : "hover:bg-muted/50",
                )}
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--link)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[var(--brand)]">{d.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {d.category} · {d.type} · {d.size}
                  </span>
                  <span className="mt-1 block">
                    <DocStatusBadge status={d.status} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {selected ? (
        <Panel
          title={selected.name}
          description={`${selected.category} · uploaded ${selected.uploadedAt} by ${selected.uploadedBy}`}
          actions={<DocStatusBadge status={selected.status} />}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6">
              <div className="h-96 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                <Preview
                  file={file}
                  error={fileError}
                  hasUrl={Boolean(selected.downloadUrl)}
                  name={selected.name}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {selected.originalName || selected.name} · {selected.type}
              </p>
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                disabled={!reviewable}
                placeholder={
                  reviewable
                    ? "Review note: required to reject, optional to verify"
                    : "This document has already been reviewed."
                }
                className="mt-3 w-full rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20 disabled:opacity-60"
              />
              {selected.reviewNotes ? (
                <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-[var(--brand)]">
                  <span className="text-muted-foreground">Review note: </span>
                  {selected.reviewNotes}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={view}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button
                  type="button"
                  disabled={!reviewable || busy !== null}
                  onClick={() => void review("verified")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)] px-3 py-2 text-xs font-semibold text-[var(--success-foreground)] hover:brightness-95 disabled:opacity-40"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                  {busy === "verified" ? "Verifying…" : "Verify"}
                </button>
                <button
                  type="button"
                  disabled={!reviewable || busy !== null}
                  onClick={() => void review("rejected")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--danger)] px-3 py-2 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-40"
                >
                  <Ban className="h-3.5 w-3.5" /> {busy === "rejected" ? "Rejecting…" : "Reject"}
                </button>
                <button
                  type="button"
                  onClick={() => setRequesting(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--warning)] px-3 py-2 text-xs font-semibold text-[var(--warning-foreground)] hover:brightness-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Request replacement
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4">
                <p className="mb-3 font-display text-xs font-semibold text-[var(--brand)]">Document metadata</p>
                <dl className="space-y-2 text-xs">
                  {[
                    ["Issuer", selected.issuer],
                    ["Reference", selected.reference],
                    ["Issued", selected.issued],
                    ["Expires", selected.expires],
                    ["File type", selected.type],
                    ["File size", selected.size],
                    ["Uploaded by", selected.uploadedBy],
                    ["Uploaded", selected.uploadedAt],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium text-[var(--brand)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="mb-2 font-display text-xs font-semibold text-[var(--brand)]">Document notes</p>
                <ul className="mb-3 space-y-2">
                  {notes.length === 0 ? (
                    <li className="text-xs text-muted-foreground">No notes recorded.</li>
                  ) : (
                    notes.map((n) => (
                      <li key={n.id} className="rounded-lg bg-muted px-3 py-2 text-xs">
                        <p className="text-muted-foreground">
                          {n.created_at.slice(0, 16).replace("T", " ")}
                          {n.internal ? " · internal" : ""}
                        </p>
                        <p className="mt-0.5 text-[var(--brand)]">{n.body}</p>
                      </li>
                    ))
                  )}
                </ul>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note for this document…"
                  className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20"
                />
                <button
                  type="button"
                  disabled={!note.trim() || busy !== null}
                  onClick={() => {
                    setBusy("note");
                    addDocumentNote(company.id, selected.id, note.trim())
                      .then(() => {
                        setNote("");
                        toast.success("Note added to document");
                      })
                      .catch((err: unknown) =>
                        toast.error("The note was not saved", { description: describe(err) }),
                      )
                      .finally(() => setBusy(null));
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-[var(--brand)] disabled:opacity-40"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" /> Add note
                </button>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}
      {requesting ? (
        <RequestInfoModal companyId={company.id} onClose={() => setRequesting(false)} />
      ) : null}
    </div>
  );
}

/* ---------------------------- Risk ---------------------------- */

type RiskFactor = { factor: string; impact: "High" | "Medium" | "Low"; mitigation: string };

/** Everything on record that pulls this company's risk up, most serious first. */
function riskFactors(company: Company, openRequests: number): RiskFactor[] {
  const factors: RiskFactor[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  for (const r of company.restrictions ?? []) {
    factors.push({
      factor: `Service restricted: ${r.scope}`,
      impact: "High",
      mitigation: r.reason,
    });
  }
  for (const c of company.checks) {
    if (c.applicable === false) continue;
    if (c.status === "failed") {
      factors.push({
        factor: `${c.label} failed sign-off (${c.score}%)`,
        impact: "High",
        mitigation: c.reviewNotes || "Resolve the findings, then review again",
      });
    } else if (c.status === "attention") {
      factors.push({
        factor: `${c.label} needs attention (${c.score}%)`,
        impact: "Medium",
        mitigation: c.reviewNotes || "Follow up before full approval",
      });
    } else if (c.status === "pending") {
      factors.push({
        factor: `${c.label} is not signed off`,
        impact: "Medium",
        mitigation: "Sign off on the Compliance checks tab",
      });
    }
  }
  for (const d of company.documents) {
    const dated = d.expires !== "-";
    if (d.status === "rejected") {
      factors.push({
        factor: `${d.name} was rejected`,
        impact: "High",
        mitigation: d.reviewNotes || "The company must upload a replacement",
      });
    } else if (dated && d.expires < today) {
      factors.push({
        factor: `${d.name} expired on ${d.expires}`,
        impact: "High",
        mitigation: "Request a renewed document",
      });
    } else if (dated && d.expires <= soon) {
      factors.push({
        factor: `${d.name} expires on ${d.expires}`,
        impact: "Medium",
        mitigation: "Renewal due within 30 days",
      });
    } else if (d.status === "pending") {
      factors.push({
        factor: `${d.name} is awaiting review`,
        impact: "Low",
        mitigation: "Verify on the Document review tab",
      });
    }
  }
  for (const c of company.conditions ?? []) {
    if (c.cleared) continue;
    factors.push({
      factor: `Condition outstanding: ${c.title}`,
      impact: c.overdue ? "High" : "Medium",
      mitigation: c.overdue ? `Overdue since ${c.due}` : `Due ${c.due}`,
    });
  }
  if (openRequests > 0) {
    factors.push({
      factor: `${openRequests} information request${openRequests === 1 ? "" : "s"} open`,
      impact: "Medium",
      mitigation: "Awaiting the company's response",
    });
  }

  const rank = { High: 0, Medium: 1, Low: 2 };
  return factors.sort((a, b) => rank[a.impact] - rank[b.impact]);
}

function RiskTab({ company }: { company: Company }) {
  const { requests } = useApp();
  const applicable = company.checks.filter((c) => c.applicable !== false);
  const radar = applicable.map((c) => ({ domain: c.label.split(" ")[0], score: c.score }));
  const bars = applicable.map((c) => ({ name: c.label, score: c.score }));

  const signedOff = applicable.filter((c) => c.status !== "pending");
  const lowest = [...signedOff].sort((a, b) => a.score - b.score).slice(0, 2);
  const openRequests = requests.filter(
    (r) => r.companyId === company.id && r.status !== "Closed",
  ).length;
  const factors = riskFactors(company, openRequests);

  const summary =
    signedOff.length === 0
      ? "No check has been signed off yet, so the score is 0. It rises as each check is signed off on the Compliance checks tab."
      : `${company.risk} risk. ${signedOff.length} of ${applicable.length} checks signed off` +
        (lowest.length > 0
          ? `; lowest: ${lowest.map((c) => `${c.label} (${c.score}%)`).join(", ")}.`
          : ".");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Overall risk" description="Average of the check scores, by weight">
          <div className="flex items-end gap-2">
            <span className="font-display text-5xl leading-none font-semibold text-[var(--brand)]">
              {company.riskScore}
            </span>
            <span className="pb-1.5 text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-3">
            <RiskBadge risk={company.risk} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{summary}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Low: 85 and above · Medium: 65 to 84 · High: below 65
          </p>
        </Panel>
        <Panel title="Domain radar" className="lg:col-span-2" bodyClassName="p-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="75%">
                <PolarGrid stroke="#E2E8F2" />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Domain breakdown" bodyClassName="p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} layout="vertical" margin={{ left: 60, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#5B6B85" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11, fill: "#5B6B85" }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }}
              />
              <Bar dataKey="score" fill="#101E3D" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Risk factors and mitigations"
        description="From this company's checks, documents, conditions and requests"
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-border">
          {factors.length === 0 ? (
            <li className="px-5 py-3 text-sm text-muted-foreground">No risk factors on record.</li>
          ) : (
            factors.map((r, index) => (
              <li
                key={`${index}:${r.factor}`}
                className="flex flex-wrap items-center gap-3 px-5 py-3"
              >
                <span className="min-w-0 flex-1 text-sm text-[var(--brand)]">{r.factor}</span>
                <Pill
                  tone={
                    r.impact === "High" ? "danger" : r.impact === "Medium" ? "warning" : "neutral"
                  }
                >
                  {r.impact} impact
                </Pill>
                <span className="text-xs text-muted-foreground">{r.mitigation}</span>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </div>
  );
}

/* ---------------------------- Requests ---------------------------- */

export function RequestInfoModal({
  companyId,
  onClose,
}: {
  companyId: string;
  onClose: () => void;
}) {
  const { createRequest } = useApp();
  const [reason, setReason] = React.useState(REQUEST_REASONS[0]);
  const [message, setMessage] = React.useState("");
  const [items, setItems] = React.useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--brand)]/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-sm font-semibold text-[var(--brand)]">Request additional information</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-3.5 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--brand)]">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
            >
              {REQUEST_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--brand)]">Required items (one per line)</label>
            <textarea
              rows={3}
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder={"Mineral Transport Licence\nEscort arrangement letter"}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--brand)]">Message to partner</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain exactly what is required and by when…"
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
            />
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-[var(--brand)]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!message.trim()}
            onClick={() => {
              createRequest(
                companyId,
                reason ?? "Additional information required",
                message.trim(),
                items.split("\n").map((i) => i.trim()).filter(Boolean),
              );
              toast.success("Information request sent to partner");
              onClose();
            }}
            className="rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            Send request
          </button>
        </footer>
      </div>
    </div>
  );
}

function RequestsTab({ company }: { company: Company }) {
  const { requests } = useApp();
  const [open, setOpen] = React.useState(false);
  const list = requests.filter((r) => r.companyId === company.id);

  return (
    <>
      <Panel
        title="Information requests"
        description="Requests raised against this application"
        bodyClassName="p-0"
        actions={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90"
          >
            <MessageSquareWarning className="h-3.5 w-3.5" /> Request information
          </button>
        }
      >
        <ul className="divide-y divide-border">
          {list.map((r) => (
            <li key={r.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-semibold text-[var(--brand)]">{r.reason}</span>
                <Pill tone={r.status === "Open" ? "warning" : r.status === "Responded" ? "info" : "success"}>{r.status}</Pill>
                <span className="ml-auto text-xs text-muted-foreground">
                  {r.id} · raised {r.raisedAt} by {r.raisedBy} · due {r.due}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.message}</p>
              {r.items.length ? (
                <ul className="mt-2 space-y-1">
                  {r.items.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[var(--brand)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" /> {i}
                    </li>
                  ))}
                </ul>
              ) : null}
              {r.response ? (
                <div className="mt-3 rounded-lg border border-[#b9d3fb] bg-[var(--brand-soft)]/50 px-3 py-2 text-xs">
                  <p className="font-medium text-[var(--brand)]">Partner response · {r.response.at}</p>
                  <p className="mt-0.5 text-muted-foreground">{r.response.message}</p>
                  {r.response.files.map((f) => (
                    <p key={f} className="mt-1 flex items-center gap-1.5 text-[var(--link)]">
                      <FileText className="h-3 w-3" /> {f}
                    </p>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
          {list.length === 0 ? <li className="px-5 py-10 text-center text-sm text-muted-foreground">No requests raised.</li> : null}
        </ul>
      </Panel>
      {open ? <RequestInfoModal companyId={company.id} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/* ---------------------------- Decision ---------------------------- */

type ConditionDraft = { title: string; description: string; due: string; scope: string };
type FinalDecision = "Approved" | "Conditionally Approved" | "Rejected";

function DecisionTab({ company }: { company: Company }) {
  const { recordDecision, decisions, requests } = useApp();
  const [summary, setSummary] = React.useState("");
  const [drafts, setDrafts] = React.useState<ConditionDraft[]>([]);
  const [busy, setBusy] = React.useState<FinalDecision | null>(null);
  const existing = decisions[company.id];
  const [modal, setModal] = React.useState(false);

  const verified = company.documents.filter((d) => d.status === "verified").length;
  const openRequests = requests.filter(
    (r) => r.companyId === company.id && r.status !== "Closed",
  ).length;
  const applicable = company.checks.filter((c) => c.applicable !== false);
  const notPassed = applicable.filter((c) => c.status !== "passed");
  const outstanding = (company.conditions ?? []).filter((c) => !c.cleared);
  const restrictions = company.restrictions ?? [];

  // What the API will refuse a full approval for; shown so the reviewer knows
  // before clicking. The API's own answer is still what gets reported.
  const blockers: string[] = [];
  if (notPassed.length > 0) {
    blockers.push(
      `${notPassed.length} of ${applicable.length} checks are not passed (Compliance checks tab)`,
    );
  }
  if (verified < company.documents.length) {
    blockers.push(
      `${company.documents.length - verified} document(s) are not verified (Document review tab)`,
    );
  }
  if (openRequests > 0) blockers.push(`${openRequests} information request(s) are still open`);
  if (outstanding.length > 0)
    blockers.push(`${outstanding.length} approval condition(s) are not cleared`);
  if (restrictions.length > 0)
    blockers.push(`${restrictions.length} service restriction(s) are active`);

  const setDraft = (index: number, patch: Partial<ConditionDraft>) =>
    setDrafts((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const decide = async (decision: FinalDecision) => {
    const rationale = summary.trim();
    if (!rationale) {
      toast.error("Write the decision rationale first.");
      return;
    }
    const conditional = decision === "Conditionally Approved";
    if (conditional) {
      if (drafts.some((d) => !d.title.trim() || !d.description.trim() || !d.due)) {
        toast.error("Each condition needs a title, a description and a due date.");
        return;
      }
      if (drafts.length === 0 && outstanding.length === 0) {
        toast.error("Conditional approval needs at least one condition. Add one below.");
        return;
      }
    }
    setBusy(decision);
    try {
      await recordDecision(
        company.id,
        decision,
        rationale,
        conditional
          ? drafts.map((d) => ({
              title: d.title.trim(),
              description: d.description.trim(),
              due_date: d.due,
              ...(d.scope ? { service_scope: d.scope } : {}),
            }))
          : undefined,
      );
      toast.success(`${company.name}: ${decision}`);
      setDrafts([]);
    } catch (err) {
      toast.error(`${decision} was not recorded`, { description: describeError(err) });
    } finally {
      setBusy(null);
    }
  };

  const field =
    "rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20";

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Final review summary" description="Confirm before recording a decision">
            <KeyValue
              items={[
                { label: "Company", value: company.name },
                { label: "Application", value: company.id },
                { label: "Reviewer", value: company.reviewer },
                {
                  label: "Compliance score",
                  value: `${company.riskScore} / 100 (${company.risk})`,
                },
                {
                  label: "Documents verified",
                  value: `${verified} of ${company.documents.length}`,
                },
                { label: "Open requests", value: String(openRequests) },
              ]}
            />
            {blockers.length > 0 ? (
              <div className="mt-5 rounded-lg bg-[var(--warning)]/15 px-4 py-3">
                <p className="text-xs font-semibold text-[var(--brand)]">
                  Full approval is not possible yet
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-[var(--brand)]">
                  {blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-medium text-[var(--brand)]">
                Decision rationale
              </label>
              <textarea
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Why this decision is being made (required)"
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20"
              />
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-[var(--brand)]">
                Conditions (for conditional approval)
              </p>
              {outstanding.length > 0 ? (
                <ul className="mb-2 space-y-1">
                  {outstanding.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-xs text-[var(--brand)]">
                      <Gauge className="h-3.5 w-3.5 text-[var(--warning)]" /> {c.title} · due{" "}
                      {c.due}
                      {c.overdue ? " (overdue)" : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {drafts.map((d, i) => (
                <div
                  key={i}
                  className="mb-2 grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2"
                >
                  <input
                    value={d.title}
                    onChange={(e) => setDraft(i, { title: e.target.value })}
                    placeholder="Condition title"
                    className={field}
                  />
                  <input
                    type="date"
                    value={d.due}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDraft(i, { due: e.target.value })}
                    aria-label="Due date"
                    className={field}
                  />
                  <input
                    value={d.description}
                    onChange={(e) => setDraft(i, { description: e.target.value })}
                    placeholder="What the company must do"
                    className={cn(field, "sm:col-span-2")}
                  />
                  <select
                    value={d.scope}
                    onChange={(e) => setDraft(i, { scope: e.target.value })}
                    aria-label="Service restricted until cleared"
                    className={field}
                  >
                    <option value="">No service restricted</option>
                    {company.services.map((service) => (
                      <option key={service} value={service}>
                        Restrict: {service}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDrafts((rows) => rows.filter((_, index) => index !== i))}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-[var(--brand)]"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setDrafts((rows) => [...rows, { title: "", description: "", due: "", scope: "" }])
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-[var(--brand)]"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" /> Add condition
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void decide("Approved")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)] px-4 py-2.5 text-xs font-semibold text-[var(--success-foreground)] hover:brightness-95 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />{" "}
                {busy === "Approved" ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void decide("Conditionally Approved")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--brand)]/90 disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />{" "}
                {busy === "Conditionally Approved" ? "Recording…" : "Conditional approval"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--warning)] px-4 py-2.5 text-xs font-semibold text-[var(--warning-foreground)] hover:brightness-95 disabled:opacity-40"
              >
                <MessageSquareWarning className="h-4 w-4" /> Request more info
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void decide("Rejected")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--danger)] px-4 py-2.5 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-40"
              >
                <Ban className="h-4 w-4" /> {busy === "Rejected" ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </Panel>

          {existing ? (
            <Panel title="Recorded decision">
              <div className="flex flex-wrap items-center gap-2">
                <Pill
                  tone={
                    existing.decision === "Approved"
                      ? "success"
                      : existing.decision === "Rejected"
                        ? "danger"
                        : existing.decision === "Conditionally Approved"
                          ? "info"
                          : "warning"
                  }
                >
                  {existing.decision}
                </Pill>
                <span className="text-xs text-muted-foreground">{existing.at}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{existing.summary}</p>
              {outstanding.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {outstanding.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-xs text-[var(--brand)]">
                      <Gauge className="h-3.5 w-3.5 text-[var(--warning)]" /> {c.title} · due{" "}
                      {c.due}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          ) : null}
        </div>

        <div className="space-y-4">
          <Panel title="Domain sign-off">
            <ul className="space-y-2.5">
              {company.checks.map((c) => (
                <li key={c.key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--brand)]">{c.label}</span>
                  <CheckStatusBadge status={c.status} />
                </li>
              ))}
              {company.checks.length === 0 ? (
                <li className="text-xs text-muted-foreground">Summary record only.</li>
              ) : null}
            </ul>
          </Panel>
          <Panel title="Sign-off notes" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {company.checks.filter((c) => c.reviewNotes).length === 0 ? (
                <li className="px-5 py-3 text-xs text-muted-foreground">
                  No check has been signed off yet.
                </li>
              ) : (
                company.checks
                  .filter((c) => c.reviewNotes)
                  .map((c) => (
                    <li key={c.key} className="px-5 py-3 text-xs">
                      <p className="text-muted-foreground">
                        {c.label}
                        {c.reviewedAt ? ` · ${c.reviewedAt}` : ""}
                      </p>
                      <p className="mt-0.5 text-[var(--brand)]">{c.reviewNotes}</p>
                    </li>
                  ))
              )}
            </ul>
          </Panel>
        </div>
      </div>
      {modal ? <RequestInfoModal companyId={company.id} onClose={() => setModal(false)} /> : null}
    </>
  );
}

/* ---------------------------- Activity ---------------------------- */

function ActivityTab({ company }: { company: Company }) {
  return (
    <Panel title="Case activity" description="Chronological record for this application" bodyClassName="p-0">
      <ul className="divide-y divide-border">
        {[...company.activity].reverse().map((a) => (
          <li key={a.id} className="flex gap-3 px-5 py-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
              <History className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--brand)]">{a.action}</p>
                <Pill tone={a.channel === "System" ? "info" : a.channel === "Partner" ? "neutral" : "success"}>{a.channel}</Pill>
                <span className="ml-auto text-xs text-muted-foreground">{a.at}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {a.detail}: {a.actor}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
