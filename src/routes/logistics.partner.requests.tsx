import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileText, Paperclip, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";

export const Route = createFileRoute("/logistics/partner/requests")({
  head: () => ({
    meta: [
      { title: "Information requests | Beldium Logistics Partner Portal" },
      { name: "description", content: "Respond to Beldium compliance information requests and upload the exact missing documents." },
      { property: "og:title", content: "Information requests | Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Upload missing compliance documents and reply to reviewers." },
    ],
  }),
  component: PartnerRequests,
});

function PartnerRequests() {
  const { requests, myCompany } = useApp();
  const mine = requests.filter((r) => r.companyId === myCompany?.id);

  return (
    <AppShell role="partner" breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd", to: "/logistics/partner" }, { label: "Information requests" }]}>
      <PageHeader title="Information requests" description="Beldium compliance has asked for the items below. Upload each document and reply to close the request." />
      <div className="space-y-4">
        {mine.map((r) => (
          <RequestCard key={r.id} id={r.id} />
        ))}
      </div>
    </AppShell>
  );
}

function RequestCard({ id }: { id: string }) {
  const { requests, respondToRequest } = useApp();
  const req = requests.find((r) => r.id === id)!;
  const [files, setFiles] = React.useState<string[]>(req.response?.files ?? []);
  const [message, setMessage] = React.useState("");

  const attach = (item: string) => {
    const filename = `${item.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40)}.pdf`;
    setFiles((f) => (f.includes(filename) ? f : [...f, filename]));
    toast.success(`${filename} attached`);
  };

  const submit = () => {
    if (files.length === 0) {
      toast.error("Attach at least one document before replying.");
      return;
    }
    respondToRequest(req.id, message || "Requested documents attached for review.", files);
    setMessage("");
    toast.success("Response sent to Beldium compliance");
  };

  return (
    <Panel bodyClassName="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-sm font-semibold text-[var(--brand)]">{req.reason}</h3>
        <Pill tone={req.status === "Open" ? "warning" : req.status === "Responded" ? "info" : "success"}>{req.status}</Pill>
        <span className="ml-auto text-xs text-muted-foreground">
          {req.id} · raised by {req.raisedBy} on {req.raisedAt} · due {req.due}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{req.message}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Exactly what is missing</p>
          <ul className="mt-2 space-y-2">
            {req.items.map((item) => {
              const attached = files.some((f) => f.startsWith(item.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 12)));
              return (
                <li key={item} className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
                  <span className="flex-1 text-xs text-[var(--brand)]">{item}</span>
                  {attached ? (
                    <Pill tone="success">
                      <CheckCircle2 className="h-3 w-3" /> Attached
                    </Pill>
                  ) : (
                    <button
                      type="button"
                      disabled={req.status !== "Open"}
                      onClick={() => attach(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-[var(--brand)] hover:border-[var(--link)]/60 disabled:opacity-50"
                    >
                      <Upload className="h-3 w-3" /> Upload
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Reply to reviewer</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={req.status !== "Open"}
            rows={5}
            placeholder="Add context for the compliance reviewer…"
            className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--link)] disabled:bg-muted"
          />
          {files.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {files.map((f) => (
                <li key={f}>
                  <Pill tone="info">
                    <Paperclip className="h-3 w-3" /> {f}
                  </Pill>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={req.status !== "Open"}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Submit response
          </button>
        </div>
      </div>

      {req.response ? (
        <div className="mt-4 rounded-lg border border-[#b9d3fb] bg-[var(--brand-soft)]/50 px-3 py-2 text-xs">
          <p className="font-medium text-[var(--brand)]">Submitted {req.response.at}</p>
          <p className="mt-0.5 text-muted-foreground">{req.response.message}</p>
        </div>
      ) : null}
    </Panel>
  );
}
