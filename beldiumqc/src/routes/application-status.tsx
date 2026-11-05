import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, FileText, Lock, Unlock, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/beldium/shell";
import { PageHeader, SectionTitle, StatusPill, Surface, Stat } from "@/components/beldium/ui";
import { Btn, Label, inputClass } from "@/components/beldium/auth";
import { useAccounts, type Account, type InfoRequest } from "@/lib/beldium/accounts";
import { directory, roleDefs, type AppStatus } from "@/lib/beldium/onboarding";
import { cn } from "@/lib/utils";
import { can } from "@/lib/beldium/compliance";
import { useBeldium } from "@/lib/beldium/store";

export const Route = createFileRoute("/application-status")({
  head: () => ({
    meta: [
      { title: "Application status — Beldium Quality & Control" },
      { name: "description", content: "Track your Beldium Quality & Control application, documents, information requests and unlocked permissions." },
      { property: "og:title", content: "Application status — Beldium" },
      { property: "og:description", content: "Review progress, respond to information requests and see what your account can do." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <StatusPage />
    </AppShell>
  ),
});

const pipeline: AppStatus[] = ["submitted", "under_review", "inspection_required", "conditionally_approved", "approved"];

const statusCopy: Record<AppStatus, string> = {
  submitted: "We have your application and will open the review shortly.",
  under_review: "A compliance officer is checking your documents and declared capability.",
  information_required: "The reviewer needs more information. Respond below to continue the review.",
  inspection_required: "A physical inspection of your facility or equipment will be scheduled.",
  conditionally_approved: "You can operate with limited permissions while conditions are cleared.",
  approved: "Your account is verified. Permissions are unlocked based on your scope.",
  rejected: "Your application was not approved. Review the timeline for the reason.",
  suspended: "Your access is suspended pending resolution of expired or disputed evidence.",
};

function StatusPage() {
  const { current, markNotificationsRead } = useAccounts();
  const { user } = useBeldium();
  const navigate = useNavigate();
  if (!current?.application || !current.roleKey) {
    return (
      <Surface className="p-8 text-center">
        <p className="text-sm text-navy">This account has no Quality &amp; Control application.</p>
        <Btn className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>Go to dashboard</Btn>
      </Surface>
    );
  }
  const app = current.application;
  const def = roleDefs[current.roleKey];
  const idx = pipeline.indexOf(app.status);
  const progress = app.status === "approved" ? 100 : idx >= 0 ? Math.round(((idx + 0.5) / pipeline.length) * 100) : app.status === "information_required" ? 40 : 0;
  const verified = app.documents.filter((d) => d.status === "verified").length;
  const unread = app.notifications.filter((n) => !n.read).length;
  const unlocked = can(user, "view") && app.status === "approved" ? def.permissions.length : 0;

  return (
    <>
      <PageHeader
        eyebrow={def.applicationType}
        title={app.status === "approved" ? "Application & access" : "Your application"}
        description={def.workspaceRole === "regulator" ? "Application review does not grant oversight access. Separate delegated authorisation is required." : statusCopy[app.status]}
        actions={
          app.status === "approved" && can(user, "view") ? (
            <Btn onClick={() => navigate({ to: "/dashboard" })}>Open workspace</Btn>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Reference" value={<span className="text-xl">{app.ref}</span>} sub={def.title} />
        <Stat label="Submitted" value={<span className="text-xl">{app.submittedAt}</span>} sub={app.type} />
        <Surface className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Current status</p>
          <StatusPill value={app.status} className="mt-3 text-sm uppercase" />
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", app.status === "rejected" || app.status === "suspended" ? "bg-danger" : "bg-link")} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{progress}% through review</p>
        </Surface>
        <Stat label="Documents verified" value={`${verified}/${app.documents.length}`} tone="pale" sub={`${unread} unread notification(s)`} />
      </div>

      <Surface className="mt-6 p-6">
        <ol className="grid gap-3 sm:grid-cols-5">
          {pipeline.map((p, i) => {
            const done = app.status === "approved" || (idx >= 0 && i < idx);
            const cur = p === app.status;
            return (
              <li key={p} className={cn("rounded-2xl border p-3", cur ? "border-navy bg-pale/50" : "border-border")}>
                <span className={cn("grid size-6 place-items-center rounded-full text-[11px] font-semibold", done ? "bg-success text-success-foreground" : cur ? "bg-navy text-navy-foreground" : "bg-muted text-muted-foreground")}>
                  {done ? "✓" : i + 1}
                </span>
                <p className="mt-2 text-xs font-semibold text-navy capitalize">{p.replace(/_/g, " ")}</p>
              </li>
            );
          })}
        </ol>
      </Surface>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Requests account={current} />
          <Documents account={current} />
          <Records account={current} />
        </div>
        <div className="space-y-6">
          <Surface>
            <SectionTitle title="Permissions" hint={`${unlocked} of ${def.permissions.length} unlocked`} />
            <ul className="divide-y divide-border">
              {def.permissions.map((p, i) => {
                const on = i < unlocked;
                return (
                  <li key={p} className="flex items-center gap-3 px-6 py-3 text-sm">
                    {on ? <Unlock className="size-4 text-success-foreground" /> : <Lock className="size-4 text-muted-foreground" />}
                    <span className={on ? "text-navy" : "text-muted-foreground"}>{p}</span>
                  </li>
                );
              })}
            </ul>
            <p className="px-6 pb-4 text-xs text-muted-foreground">
              Permissions are scoped by role, organisation membership, accreditation scope, testing capability and geographic coverage.
            </p>
          </Surface>

          <Surface>
            <SectionTitle
              title="Notifications"
              action={unread ? <button type="button" onClick={() => markNotificationsRead(current.id)} className="text-xs font-semibold text-link">Mark all read</button> : null}
            />
            <ul className="divide-y divide-border">
              {app.notifications.map((n) => (
                <li key={n.id} className="flex gap-3 px-6 py-3">
                  <Bell className={cn("mt-0.5 size-4 shrink-0", n.read ? "text-muted-foreground" : "text-link")} />
                  <span>
                    <span className={cn("block text-sm", n.read ? "text-muted-foreground" : "font-medium text-navy")}>{n.text}</span>
                    <span className="text-xs text-muted-foreground">{n.at}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface>
            <SectionTitle title="Review activity & timeline" />
            <ol className="space-y-4 px-6 py-5">
              {[...app.timeline].reverse().map((t) => (
                <li key={t.id} className="relative border-l-2 border-pale pl-4">
                  <span className="absolute top-1 -left-[5px] size-2 rounded-full bg-link" />
                  <p className="text-sm font-semibold text-navy">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                  <p className="text-[11px] text-muted-foreground">{t.at} · {t.actor}</p>
                </li>
              ))}
            </ol>
          </Surface>


        </div>
      </div>
    </>
  );
}

function Requests({ account }: { account: Account }) {
  const reqs = account.application!.requests;
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <Surface>
      <SectionTitle title="Information requests" hint={reqs.length ? `${reqs.filter((r) => r.status === "open").length} awaiting your response` : "No requests from the reviewer"} />
      {reqs.length === 0 ? (
        <p className="px-6 py-6 text-sm text-muted-foreground">You'll see requests here if the reviewer needs anything else.</p>
      ) : (
        <ul className="divide-y divide-border">
          {reqs.map((r) => (
            <li key={r.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-navy">{r.title}</p>
                  <p className="text-xs text-muted-foreground">Requested {r.requestedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={r.status === "open" ? "information_required" : "responded"} />
                  <Btn variant="outline" className="py-1.5 text-xs" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    {open === r.id ? "Close" : r.status === "open" ? "View request" : "View response"}
                  </Btn>
                </div>
              </div>
              {open === r.id ? <RequestDetail account={account} req={r} onDone={() => setOpen(null)} /> : null}
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

function RequestDetail({ account, req, onDone }: { account: Account; req: InfoRequest; onDone: () => void }) {
  const { respondToRequest } = useAccounts();
  const [responding, setResponding] = React.useState(false);
  const [text, setText] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [err, setErr] = React.useState("");
  return (
    <div className="mt-3 rounded-2xl bg-muted/50 p-4">
      <p className="text-sm text-navy">{req.detail}</p>
      {req.status === "responded" ? (
        <div className="mt-3 rounded-xl border border-border bg-card p-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Your response</p>
          <p className="mt-1 text-navy">{req.response}</p>
          {req.evidence.length ? <p className="mt-1 text-xs text-muted-foreground">Evidence: {req.evidence.join(", ")}</p> : null}
        </div>
      ) : !responding ? (
        <Btn className="mt-3" onClick={() => setResponding(true)}>Respond</Btn>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <Label htmlFor={`resp-${req.id}`}>Response</Label>
            <textarea id={`resp-${req.id}`} rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-pale px-3 py-2 text-xs font-semibold text-navy">
              <Upload className="size-3.5" /> Upload evidence
              <input type="file" multiple className="sr-only" aria-label="Upload evidence" onChange={(e) => {
                const list = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024).map((f) => f.name);
                e.target.value = "";
                setFiles((x) => [...x, ...list]);
              }} />
            </label>
            {files.map((f) => (
              <p key={f} className="mt-1 flex items-center gap-2 text-xs text-navy">
                <FileText className="size-3.5" /> {f}
                <button type="button" className="text-danger-foreground" onClick={() => setFiles((x) => x.filter((y) => y !== f))}>remove</button>
              </p>
            ))}
          </div>
          {err ? <p className="text-xs text-danger-foreground">{err}</p> : null}
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => setResponding(false)}>Cancel</Btn>
            <Btn onClick={() => {
              if (text.trim().length < 5) return setErr("Write a short response (at least 5 characters).");
              if (!files.length) return setErr("Upload at least one evidence file.");
              respondToRequest(account.id, req.id, text.trim(), files);
              toast.success("Response submitted to the reviewer");
              onDone();
            }}>Submit response</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Documents({ account }: { account: Account }) {
  const { reuploadDocument } = useAccounts();
  const docs = account.application!.documents;
  return (
    <Surface>
      <SectionTitle title="Document review" hint="Uploading is not verification — each file is checked by a reviewer." />
      <ul className="divide-y divide-border">
        {docs.map((d) => {
          const fixable = ["information_required", "rejected", "expired", "expiring"].includes(d.status);
          return (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">{d.type}</p>
                <p className="truncate text-xs text-muted-foreground">{d.fileName} · {(d.size / 1024).toFixed(0)} KB</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill value={d.status} />
                {fixable ? (
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs font-semibold text-navy hover:border-link">
                    <Upload className="size-3" /> Replace
                    <input type="file" className="sr-only" aria-label={`Replace ${d.type}`} onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      reuploadDocument(account.id, d.id, f.name, f.size);
                      toast.success("Document replaced and sent for review");
                    }} />
                  </label>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}

function Records({ account }: { account: Account }) {
  const v = account.application!.values;
  const join = (v["organisation"] ?? v["laboratory"] ?? v["authority"]) as { id: string; name: string } | undefined;
  const dirOrg = join ? directory.find((o) => o.id === join.id || o.laboratories.some((l) => l.id === join.id)) : undefined;
  const labs =
    (v["laboratories"] as { name: string; location: string; registration: string }[] | undefined)?.map((l) => ({
      name: l.name,
      location: l.location,
      accreditation: (v["accNumber"] as string) ?? "—",
      scope: (v["methods"] as string[]) ?? [],
      equipment: ((v["equipment"] as { name: string }[]) ?? []).map((e) => e.name),
      personnel: ((v["personnel"] as { name: string }[]) ?? []).map((p) => p.name),
    })) ??
    dirOrg?.laboratories.filter((l) => !v["laboratory"] || l.id === join?.id) ??
    [];
  return (
    <Surface>
      <SectionTitle title="Connected records" hint="Organisation → Laboratory → Accreditation scope → Methods → Equipment → Personnel" />
      <div className="px-6 py-5">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-[11px] text-muted-foreground uppercase">Organisation{join ? " membership (requested)" : ""}</p>
          <p className="font-display font-semibold text-navy">{dirOrg?.name ?? account.orgName}</p>
          <p className="text-xs text-muted-foreground">User: {account.name} · {account.email} · Role: {roleDefs[account.roleKey!].title}</p>
        </div>
        {labs.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No laboratories linked to this record.</p>
        ) : (
          <div className="mt-3 space-y-3 border-l-2 border-pale pl-4">
            {labs.map((l) => (
              <div key={l.name} className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-navy">{l.name} <span className="font-normal text-muted-foreground">· {l.location}</span></p>
                <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Accreditation</dt><dd className="text-navy">{l.accreditation}</dd></div>
                  <div><dt className="text-muted-foreground">Methods in scope</dt><dd className="text-navy">{l.scope.join(", ") || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Equipment</dt><dd className="text-navy">{l.equipment.join(", ") || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Personnel</dt><dd className="text-navy">{l.personnel.join(", ") || "—"}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </Surface>
  );
}

