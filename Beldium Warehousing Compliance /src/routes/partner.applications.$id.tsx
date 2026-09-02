import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HardHat,
  Info,
  Leaf,
  Lock,
  Settings2,
  ShieldCheck,
  Warehouse,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DemoDataBanner, Field, Panel, StatusPill, toneForStatus } from "@/components/compliance-ui";
import {
  APPLICATION_TIMELINE,
  COMPANY_PROFILE,
  FACILITY_PROFILE,
  INSPECTORS,
  REVIEW_SECTIONS,
  RISK_BREAKDOWN,
  RISK_SCORE,
  labelStatus,
  type EvidenceState,
  type ReviewStatus,
} from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/partner/applications/$id")({
  head: () => ({
    meta: [
      { title: "Application review | Beldium Compliance Partner" },
      {
        name: "description",
        content:
          "Full warehouse application review: corporate, facility, safety, environmental, insurance, operations, inventory, security and inspection evidence with risk scoring.",
      },
      { property: "og:title", content: "Application review | Beldium Compliance Partner" },
      { property: "og:description", content: "Review sections, risk assessment and decision actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationDetail,
});

const SECTION_ICONS = {
  Building2,
  Warehouse,
  HardHat,
  Leaf,
  ShieldCheck,
  Settings2,
  Boxes,
  Lock,
  ClipboardCheck,
} as const;

const EVIDENCE_LABEL: Record<EvidenceState, string> = {
  verified: "Verified",
  attention: "Needs attention",
  missing: "Missing",
};

type ActionKind = "approve" | "conditional" | "info" | "reject";

const ACTION_COPY: Record<ActionKind, { title: string; status: ReviewStatus; needsReason: boolean; cta: string; description: string }> = {
  approve: {
    title: "Approve application",
    status: "approved",
    needsReason: false,
    cta: "Confirm approval",
    description: "Issues a warehouse compliance certificate and moves the facility to continuous monitoring.",
  },
  conditional: {
    title: "Conditionally approve",
    status: "conditional",
    needsReason: true,
    cta: "Issue conditional approval",
    description: "Approval subject to stated conditions. A reason and the conditions are mandatory.",
  },
  info: {
    title: "Request more information",
    status: "info-requested",
    needsReason: true,
    cta: "Send information request",
    description: "Pauses the SLA clock and notifies the applicant. State exactly what is required.",
  },
  reject: {
    title: "Reject application",
    status: "rejected",
    needsReason: true,
    cta: "Confirm rejection",
    description: "Closes the file. A documented reason is mandatory and is shared with the applicant.",
  },
};

function ApplicationDetail() {
  const { id } = useParams({ from: "/partner/applications/$id" });
  const {
    applications,
    decisions,
    recordDecision,
    requireInspection,
    inspectionRequired,
    addNonConformity,
    nonConformities,
    alerts,
    acknowledged,
    acknowledgeAlert,
  } = useDemo();
  const app = applications.find((a) => a.id === id);
  const decision = decisions[id];
  const actor = "Adaeze Nwachukwu";

  const [action, setAction] = useState<ActionKind | null>(null);
  const [reason, setReason] = useState("");
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspector, setInspector] = useState(INSPECTORS[0] ?? "");
  const [inspectionDate, setInspectionDate] = useState("2026-09-02");
  const [inspectionNote, setInspectionNote] = useState(
    "Verify bund wall remediation at Bay B4 and CCTV retention configuration.",
  );
  const [ncOpen, setNcOpen] = useState(false);
  const [ncTitle, setNcTitle] = useState("");
  const [ncSection, setNcSection] = useState("Environmental");
  const [ncSeverity, setNcSeverity] = useState<"Minor" | "Major" | "Critical">("Major");
  const [ncDue, setNcDue] = useState("2026-09-30");

  if (!app) {
    return (
      <AppShell role="partner" title="Application not found">
        <Panel title="Unknown reference" description={`No application matches ${id}.`}>
          <Button asChild className="rounded-xl">
            <Link to="/partner/applications">Back to applications</Link>
          </Button>
        </Panel>
      </AppShell>
    );
  }

  const facilityAlerts = alerts.filter((a) => a.facility.startsWith("Apapa"));
  const facilityNCs = nonConformities.filter((n) => n.facility.startsWith("Apapa"));
  const inspection = inspectionRequired[id];

  const submitDecision = () => {
    if (!action) return;
    const cfg = ACTION_COPY[action];
    if (cfg.needsReason && reason.trim().length < 12) {
      toast.error("A written reason is required", {
        description: "Provide at least a sentence explaining the decision for the audit trail.",
      });
      return;
    }
    recordDecision(id, cfg.status, reason.trim() || "No conditions — all sections cleared.", actor);
    toast.success(`${cfg.title} recorded`, {
      description: `${app.id} · ${labelStatus(cfg.status)} · logged to audit trail`,
    });
    setAction(null);
    setReason("");
  };

  return (
    <AppShell
      role="partner"
      title={app.company}
      subtitle={`${app.ref} · ${app.facility}`}
      actions={
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/partner/applications">
            <ArrowLeft className="size-4" />
            Applications
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <DemoDataBanner />

        {decision ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-link/30 bg-secondary/60 px-5 py-4">
            <div>
              <p className="font-heading text-sm font-semibold text-primary">
                Decision recorded: {labelStatus(decision.status)}
              </p>
              <p className="mt-1 text-sm text-foreground/80">{decision.reason}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {decision.decidedBy} · {decision.decidedAt}
            </p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Tabs defaultValue="overview">
              <TabsList className="flex h-auto flex-wrap justify-start rounded-2xl bg-muted p-1.5">
                <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
                <TabsTrigger value="sections" className="rounded-xl">Review sections</TabsTrigger>
                <TabsTrigger value="risk" className="rounded-xl">Risk assessment</TabsTrigger>
                <TabsTrigger value="findings" className="rounded-xl">Inspection & findings</TabsTrigger>
                <TabsTrigger value="monitoring" className="rounded-xl">Monitoring</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-5 space-y-6">
                <Panel title="Company overview" description="Corporate identity as declared and verified against CAC and FIRS records.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Legal name" value={COMPANY_PROFILE.legalName} />
                    <Field label="CAC registration" value={COMPANY_PROFILE.cac} />
                    <Field label="Tax identification number" value={COMPANY_PROFILE.tin} />
                    <Field label="Incorporated" value={COMPANY_PROFILE.incorporated} />
                    <Field label="Company type" value={COMPANY_PROFILE.companyType} />
                    <Field label="Head office" value={COMPANY_PROFILE.headOffice} />
                    <Field label="Mineral title / licence" value={COMPANY_PROFILE.mineralTitle} />
                    <Field label="Bankers" value={COMPANY_PROFILE.bankers} />
                    <Field label="Annual turnover" value={COMPANY_PROFILE.annualTurnover} />
                    <Field label="Employees" value={`${COMPANY_PROFILE.staffCount} (48 at this facility)`} />
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="font-heading text-sm font-semibold text-primary">Directors</p>
                      <ul className="mt-2 space-y-2">
                        {COMPANY_PROFILE.directors.map((d) => (
                          <li key={d.name} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                            <span className="text-sm">
                              {d.name}
                              <span className="block text-xs text-muted-foreground">{d.role}</span>
                            </span>
                            <StatusPill tone={d.bvnVerified ? "success" : "warning"}>
                              {d.bvnVerified ? "ID verified" : "ID pending"}
                            </StatusPill>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold text-primary">Shareholding</p>
                      <ul className="mt-2 space-y-2">
                        {COMPANY_PROFILE.shareholding.map((s) => (
                          <li key={s.holder} className="rounded-xl bg-muted/60 px-3 py-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{s.holder}</span>
                              <span className="font-heading font-semibold">{s.percent}%</span>
                            </div>
                            <Progress value={s.percent} className="mt-2 h-1.5" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Panel>

                <Panel title="Facility overview" description="Site under application — Apapa Port Complex, Lagos.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Facility" value={FACILITY_PROFILE.name} />
                    <Field label="Address" value={FACILITY_PROFILE.address} />
                    <Field label="Coordinates" value={FACILITY_PROFILE.coordinates} />
                    <Field label="Land title" value={FACILITY_PROFILE.landTitle} />
                    <Field label="Built area" value={FACILITY_PROFILE.builtArea} />
                    <Field label="Licensed capacity" value={FACILITY_PROFILE.capacity} />
                    <Field label="Storage bays / docks" value={`${FACILITY_PROFILE.bays} bays · ${FACILITY_PROFILE.loadingDocks} docks`} />
                    <Field label="Weighbridges" value={FACILITY_PROFILE.weighbridges} />
                    <Field label="Laboratory" value={FACILITY_PROFILE.laboratory} />
                    <Field label="Security" value={FACILITY_PROFILE.security} />
                    <Field label="Fire systems" value={FACILITY_PROFILE.fireSystem} />
                    <Field label="Site contact" value={FACILITY_PROFILE.contact} />
                  </div>
                </Panel>

                <Panel title="Application timeline" description="Events recorded since submission.">
                  <ol className="space-y-4">
                    {APPLICATION_TIMELINE.map((t) => (
                      <li key={t.date} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className="mt-1 size-2.5 rounded-full bg-link" />
                          <span className="w-px flex-1 bg-border" />
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-medium text-foreground">{t.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.date} · {t.actor}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </TabsContent>

              <TabsContent value="sections" className="mt-5">
                <Panel
                  title="Review sections"
                  description="Nine mandatory sections. Expand each to inspect the submitted evidence and its verification state."
                >
                  <Accordion type="multiple" defaultValue={["corporate"]} className="space-y-3">
                    {REVIEW_SECTIONS.map((section) => {
                      const Icon = SECTION_ICONS[section.icon as keyof typeof SECTION_ICONS];
                      const attention = section.items.filter((i) => i.state !== "verified").length;
                      return (
                        <AccordionItem
                          key={section.id}
                          value={section.id}
                          className="overflow-hidden rounded-2xl border border-border/70 bg-card px-4"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex w-full items-center gap-3 pr-3 text-left">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                                <Icon className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-heading text-sm font-semibold text-primary">
                                  {section.title}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {section.summary}
                                </span>
                              </span>
                              <StatusPill tone={attention === 0 ? "success" : "warning"}>
                                {attention === 0 ? "All verified" : `${attention} to review`}
                              </StatusPill>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2 pb-2">
                              {section.items.map((item) => (
                                <li
                                  key={item.label}
                                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                      {item.document ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toast.info("Document preview (demo)", {
                                              description: `${item.document} — sample evidence file, no real document is opened.`,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 font-medium text-link hover:underline"
                                        >
                                          <FileText className="size-3.5" />
                                          {item.document}
                                        </button>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5">
                                          <AlertTriangle className="size-3.5" />
                                          No document attached
                                        </span>
                                      )}
                                      {item.issued ? <span>Issued {item.issued}</span> : null}
                                      {item.expires ? <span>Expires {item.expires}</span> : null}
                                    </div>
                                  </div>
                                  <StatusPill tone={toneForStatus(item.state)}>
                                    {EVIDENCE_LABEL[item.state]}
                                  </StatusPill>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </Panel>
              </TabsContent>

              <TabsContent value="risk" className="mt-5 space-y-6">
                <Panel
                  title="Risk assessment"
                  description="Weighted model across eight categories. 70 is the minimum passing score; below 55 triggers automatic rejection."
                >
                  <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-primary px-6 py-5 text-primary-foreground">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-secondary/80">Composite score</p>
                      <p className="font-heading text-5xl font-semibold">
                        {RISK_SCORE}
                        <span className="text-2xl text-secondary/70">/100</span>
                      </p>
                    </div>
                    <div className="min-w-52 flex-1">
                      <Progress value={RISK_SCORE} className="h-2.5" />
                      <p className="mt-3 text-sm text-secondary/85">
                        Rating: <span className="font-semibold text-primary-foreground">Low-moderate risk</span> —
                        suitable for approval subject to closure of environmental and security gaps.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {RISK_BREAKDOWN.map((r) => (
                      <div key={r.category} className="rounded-xl border border-border/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{r.category}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">weight {r.weight}%</span>
                            <StatusPill tone={r.score >= 88 ? "success" : r.score >= 75 ? "warning" : "danger"}>
                              {r.score}/100
                            </StatusPill>
                          </div>
                        </div>
                        <Progress value={r.score} className="mt-3 h-1.5" />
                        <p className="mt-2 text-xs text-muted-foreground">{r.note}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="findings" className="mt-5 space-y-6">
                <Panel
                  title="Physical inspection"
                  description="Order a site visit before deciding when evidence gaps cannot be closed on the desk."
                  actions={
                    <Button className="rounded-xl bg-link text-link-foreground hover:bg-link/90" onClick={() => setInspectionOpen(true)}>
                      <ClipboardCheck className="size-4" />
                      Mark inspection required
                    </Button>
                  }
                >
                  {inspection ? (
                    <div className="rounded-2xl border border-link/30 bg-secondary/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-heading text-sm font-semibold text-primary">
                          Inspection ordered — {inspection.inspector}
                        </p>
                        <StatusPill tone="info">Scheduled {inspection.date}</StatusPill>
                      </div>
                      <p className="mt-2 text-sm text-foreground/80">{inspection.note}</p>
                    </div>
                  ) : (
                    <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                      No physical inspection has been ordered for this application.
                    </p>
                  )}
                </Panel>

                <Panel
                  title="Non-conformities at this facility"
                  description="Findings raised against the applicant, tracked to corrective closure."
                  actions={
                    <Button variant="outline" className="rounded-xl" onClick={() => setNcOpen(true)}>
                      <AlertTriangle className="size-4" />
                      Create non-conformity
                    </Button>
                  }
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ref</TableHead>
                        <TableHead>Finding</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facilityNCs.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell className="font-medium text-primary">{n.id}</TableCell>
                          <TableCell className="max-w-72 text-sm">{n.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{n.section}</TableCell>
                          <TableCell>
                            <StatusPill tone={toneForStatus(n.severity)}>{n.severity}</StatusPill>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{n.due}</TableCell>
                          <TableCell>
                            <StatusPill tone={toneForStatus(n.status)}>{n.status}</StatusPill>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Panel>
              </TabsContent>

              <TabsContent value="monitoring" className="mt-5">
                <Panel
                  title="Continuous monitoring"
                  description="Automated signals from weighbridge reconciliation, insurance exposure and document expiry engines."
                >
                  <ul className="space-y-3">
                    {facilityAlerts.map((alert) => {
                      const ack = acknowledged.includes(alert.id);
                      return (
                        <li key={alert.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 p-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <StatusPill tone={alert.severity === "critical" ? "danger" : alert.severity === "warning" ? "warning" : "info"}>
                                {alert.severity}
                              </StatusPill>
                              <span className="text-xs text-muted-foreground">{alert.source}</span>
                            </div>
                            <p className="mt-2 text-sm text-foreground">{alert.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{alert.raised}</p>
                          </div>
                          {ack ? (
                            <StatusPill tone="success">
                              <CheckCircle2 className="size-3" /> Acknowledged
                            </StatusPill>
                          ) : (
                            <Button
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => {
                                acknowledgeAlert(alert.id, actor);
                                toast.success("Alert acknowledged", { description: alert.id });
                              }}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <Panel title="Review decision" description="Reasons are mandatory for anything other than a clean approval.">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Current status</span>
                  <StatusPill tone={toneForStatus(app.status)}>{labelStatus(app.status)}</StatusPill>
                </div>
                <Button
                  className="h-11 w-full justify-start rounded-xl bg-success text-success-foreground hover:bg-success/80"
                  onClick={() => {
                    setAction("approve");
                    setReason("");
                  }}
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
                <Button
                  className="h-11 w-full justify-start rounded-xl bg-warning/50 text-warning-foreground hover:bg-warning/70"
                  onClick={() => {
                    setAction("conditional");
                    setReason("");
                  }}
                >
                  <ShieldCheck className="size-4" />
                  Conditionally approve
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start rounded-xl"
                  onClick={() => {
                    setAction("info");
                    setReason("");
                  }}
                >
                  <Info className="size-4" />
                  Request more information
                </Button>
                <Button
                  className="h-11 w-full justify-start rounded-xl bg-destructive/25 text-destructive-foreground hover:bg-destructive/40"
                  onClick={() => {
                    setAction("reject");
                    setReason("");
                  }}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
                <Separator />
                <Button variant="outline" className="h-11 w-full justify-start rounded-xl" onClick={() => setInspectionOpen(true)}>
                  <ClipboardCheck className="size-4" />
                  Mark physical inspection required
                </Button>
                <Button variant="outline" className="h-11 w-full justify-start rounded-xl" onClick={() => setNcOpen(true)}>
                  <AlertTriangle className="size-4" />
                  Create non-conformity
                </Button>
              </div>
            </Panel>

            <Panel title="Review snapshot">
              <dl className="space-y-3 text-sm">
                {[
                  ["Risk score", `${RISK_SCORE}/100`],
                  ["Submitted", app.submitted],
                  ["SLA due", app.slaDue],
                  ["Declared capacity", `${app.capacityTonnes.toLocaleString()} t`],
                  ["Commodities", app.commodities],
                  ["Assigned reviewer", app.reviewer],
                  ["Evidence items", `${REVIEW_SECTIONS.reduce((n, s) => n + s.items.length, 0)} across 9 sections`],
                  [
                    "Items needing attention",
                    `${REVIEW_SECTIONS.reduce((n, s) => n + s.items.filter((i) => i.state !== "verified").length, 0)}`,
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </aside>
        </div>
      </div>

      <Dialog open={action !== null} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          {action ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-primary">{ACTION_COPY[action].title}</DialogTitle>
                <DialogDescription>{ACTION_COPY[action].description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reason">
                  {action === "conditional"
                    ? "Conditions and reason"
                    : action === "info"
                      ? "Information required"
                      : "Reason"}
                  {ACTION_COPY[action].needsReason ? <span className="text-destructive-foreground"> *</span> : null}
                </Label>
                <Textarea
                  id="reason"
                  rows={5}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === "conditional"
                      ? "e.g. Approved for 12 months conditional on: (1) CCTV retention raised to 90 days within 30 days; (2) bund wall at Bay B4 repaired and certified."
                      : action === "info"
                        ? "e.g. Provide notarised UBO declaration for Marama Resources BV and Q2 runoff sampling for discharge points 3 and 4."
                        : action === "reject"
                          ? "e.g. Security controls and stock custody records fall materially below the Beldium standard."
                          : "Optional note for the audit trail."
                  }
                  className="rounded-xl"
                />
                {ACTION_COPY[action].needsReason ? (
                  <p className="text-xs text-muted-foreground">
                    Required — the reason is stored on the file and shared with the applicant.
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setAction(null)}>
                  Cancel
                </Button>
                <Button className="rounded-xl bg-link text-link-foreground hover:bg-link/90" onClick={submitDecision}>
                  {ACTION_COPY[action].cta}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={inspectionOpen} onOpenChange={setInspectionOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Mark physical inspection required</DialogTitle>
            <DialogDescription>
              Assign a Beldium inspector and target date. The application stays open until the report is filed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assigned inspector</Label>
              <Select value={inspector ?? ""} onValueChange={setInspector}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTORS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insp-date">Target date</Label>
              <Input
                id="insp-date"
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insp-note">Inspection scope</Label>
              <Textarea
                id="insp-note"
                rows={3}
                value={inspectionNote}
                onChange={(e) => setInspectionNote(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setInspectionOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-link text-link-foreground hover:bg-link/90"
              onClick={() => {
                if (!inspectionDate) {
                  toast.error("Choose a target date for the inspection");
                  return;
                }
                requireInspection(id, FACILITY_PROFILE.name, inspector ?? "", inspectionDate, inspectionNote, actor);
                setInspectionOpen(false);
                toast.success("Physical inspection ordered", {
                  description: `${(inspector ?? "").split(" — ")[0]} assigned for ${inspectionDate}`,
                });
              }}
            >
              Order inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ncOpen} onOpenChange={setNcOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Create non-conformity</DialogTitle>
            <DialogDescription>
              Raised against {FACILITY_PROFILE.name}. The operator is notified and must submit corrective evidence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nc-title">Finding</Label>
              <Textarea
                id="nc-title"
                rows={3}
                value={ncTitle}
                onChange={(e) => setNcTitle(e.target.value)}
                placeholder="e.g. Stormwater heavy-metal sampling not performed at discharge points 3 and 4"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Review section</Label>
                <Select value={ncSection} onValueChange={setNcSection}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_SECTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.title}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={ncSeverity} onValueChange={(v) => setNcSeverity(v as typeof ncSeverity)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Minor", "Major", "Critical"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc-due">Corrective action due</Label>
              <Input id="nc-due" type="date" value={ncDue} onChange={(e) => setNcDue(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setNcOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-link text-link-foreground hover:bg-link/90"
              onClick={() => {
                if (ncTitle.trim().length < 10) {
                  toast.error("Describe the finding", { description: "At least a full sentence is required." });
                  return;
                }
                const ncId = addNonConformity(
                  {
                    facility: FACILITY_PROFILE.name,
                    title: ncTitle.trim(),
                    severity: ncSeverity,
                    due: ncDue,
                    owner: "Ibrahim Bello",
                    section: ncSection,
                  },
                  actor,
                );
                setNcTitle("");
                setNcOpen(false);
                toast.success(`Non-conformity ${ncId} raised`, {
                  description: `${ncSeverity} · ${ncSection} · corrective action due ${ncDue}`,
                });
              }}
            >
              Raise non-conformity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
