import { useState } from "react";
import { BadgeCheck } from "lucide-react";

import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Field, inputCls } from "@/components/beldium/auth-layout";
import {
  complianceApprove,
  complianceRequestInfo,
  respondToRequest,
  useOperator,
} from "@/lib/onboarding-store";

export function ApplicationStatusPanel() {
  const s = useOperator();
  const a = s.application;
  const [openId, setOpenId] = useState<string | null>(null);
  const [resp, setResp] = useState("");
  const [file, setFile] = useState("");

  if (!s.signedIn || !a) return null;

  if (a.status === "Approved" && a.approval) {
    return (
      <div className="mb-5">
        <Panel
          title="Verified Logistics Operator"
          description={`${s.organisation?.name} · Beldium Logistics ID ${a.approval.logisticsId}`}
          action={<BadgeCheck className="size-6 text-success" />}
        >
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Info k="Approved services" v={a.approval.services.join(", ") || "—"} />
            <Info k="Approved vehicle categories" v={a.approval.vehicleCategories} />
            <Info k="Approved geographic coverage" v={a.approval.coverage} />
            <Info k="Verified fleet" v={`${s.vehicles.length} vehicle(s): ${s.vehicles.map((v) => v.registration).join(", ")}`} />
            <Info k="Verified drivers" v={`${s.drivers.length} driver(s): ${s.drivers.map((d) => d.name).join(", ")}`} />
            <Info k="Approved capabilities" v={a.approval.capabilities.join(", ") || "—"} />
          </div>
        </Panel>
      </div>
    );
  }

  const done = Object.values(a.reviews).filter((r) => /approved|verified/i.test(r)).length;

  return (
    <div className="mb-5 space-y-5">
      <Panel
        title="Application Status"
        description="Full dashboard unlocks when Beldium Logistics Compliance approves your organisation."
        action={<StatusBadge value={a.status} />}
      >
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info k="Application reference" v={a.applicationId} />
          <Info k="Organisation" v={`${s.organisation?.name} (${a.organisationId})`} />
          <Info k="Submitted" v={a.submittedAt} />
          <Info k="Registration progress" v={`${done} of 5 reviews complete`} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {Object.entries(a.reviews).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border p-3">
              <p className="beldium-small">{k} review</p>
              <StatusBadge value={v} className="mt-1" />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Information Requests" description="Raised by Beldium Logistics Compliance on your submitted records.">
          {a.infoRequests.length === 0 ? (
            <p className="beldium-small">No information requests.</p>
          ) : (
            <ul className="space-y-3">
              {a.infoRequests.map((r) => (
                <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary">{r.area}</span>
                    <StatusBadge value={r.status} />
                  </div>
                  <p className="beldium-small">{r.requestedAt}</p>
                  <button type="button" className="mt-1 text-xs font-semibold text-colorLink" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                    View request
                  </button>
                  {openId === r.id && (
                    <div className="mt-2 space-y-3">
                      <p>{r.message}</p>
                      {r.status === "Open" ? (
                        <>
                          <Field label="Respond"><textarea className={inputCls} rows={3} value={resp} onChange={(e) => setResp(e.target.value)} /></Field>
                          <Field label="Upload evidence"><input type="file" className="text-xs" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} /></Field>
                          <button type="button" disabled={!resp.trim()} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                            onClick={() => { respondToRequest(r.id, resp.trim(), file); setResp(""); setFile(""); setOpenId(null); }}>
                            Submit response
                          </button>
                        </>
                      ) : (
                        <p className="beldium-small">Response: {r.response} {r.evidence ? `· Evidence: ${r.evidence}` : ""}</p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Review Timeline" description="Notifications from the Compliance Review Queue.">
          <ul className="space-y-2 text-sm">
            {a.timeline.map((t, i) => (
              <li key={i} className="border-l-2 border-secondary pl-3">
                <p className="font-medium">{t.event}</p>
                <p className="beldium-small">{t.at} · {t.by}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Demo only — simulate Beldium Logistics Compliance acting on these same records:{" "}
        <button type="button" className="font-semibold text-colorLink" onClick={complianceRequestInfo}>Request information</button>
        {" · "}
        <button type="button" className="font-semibold text-colorLink" onClick={complianceApprove}>Approve organisation</button>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="beldium-small">{k}</p>
      <p className="font-medium text-primary">{v}</p>
    </div>
  );
}
