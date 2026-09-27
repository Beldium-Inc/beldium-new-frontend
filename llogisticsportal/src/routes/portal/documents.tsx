import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { FieldGrid, RowAction } from "@/components/beldium/data-table";
import { Btn, FormField, IdLink, Modal, QueueView, fieldCls, tabSearch } from "@/components/beldium/ops-ui";
import { docState, fmtDate, renewDocument, reviewDocument, uploadDocument, useOps, type RelatedKind } from "@/lib/ops-store";
import { useOperator } from "@/lib/onboarding-store";

export const Route = createFileRoute("/portal/documents")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Document Register - Beldium Logistics Hub" },
      { name: "description", content: "Organisation, vehicle, driver and movement documents with verification and expiry status." },
      { property: "og:title", content: "Document Register - Beldium Logistics Hub" },
      { property: "og:description", content: "Every logistics document and its compliance state." },
    ],
  }),
  component: Page,
});

type Row = { id: string; name: string; type: string; relatedKind: RelatedKind; relatedId: string; number: string; authority: string; issue: string; expiry?: string | undefined; status: string; source: "register" | "onboarding" };

function Page() {
  const s = useOps();
  const op = useOperator();
  const { tab } = Route.useSearch();
  const [view, setView] = useState<string | null>(null);
  const [renew, setRenew] = useState<string | null>(null);
  const [upload, setUpload] = useState(false);
  const [rf, setRf] = useState({ expiry: "", number: "" });
  const [uf, setUf] = useState({ name: "", type: "Insurance", relatedKind: "Vehicle" as RelatedKind, relatedId: s.vehicles[0]?.id ?? "", number: "", authority: "", issueDate: new Date().toISOString().slice(0, 10), expiryDate: "" });

  const rows: Row[] = [
    ...s.documents.map((d) => ({ id: d.id, name: d.name, type: d.type, relatedKind: d.relatedKind, relatedId: d.relatedId, number: d.number, authority: d.authority, issue: d.issueDate, expiry: d.expiryDate, status: docState(d), source: "register" as const })),
    ...op.documents.map((d) => ({
      id: d.id,
      name: d.type,
      type: d.group,
      relatedKind: (d.group.startsWith("Vehicle") ? "Vehicle" : d.group.startsWith("Driver") ? "Driver" : "Organisation") as RelatedKind,
      relatedId: d.related || op.organisation?.name || "Organisation",
      number: d.number,
      authority: d.issuingAuthority,
      issue: d.issueDate,
      expiry: d.expiryDate || undefined,
      status: d.status === "Uploaded" ? "Under Review" : d.status,
      source: "onboarding" as const,
    })),
  ];
  const doc = s.documents.find((d) => d.id === view);
  const obDoc = rows.find((r) => r.id === view && r.source === "onboarding");
  const relatedOptions = uf.relatedKind === "Vehicle" ? s.vehicles.map((v) => ({ id: v.id, label: `${v.id} · ${v.registration}` })) : uf.relatedKind === "Driver" ? s.drivers.map((d) => ({ id: d.id, label: d.name })) : uf.relatedKind === "Movement" ? s.movements.map((m) => ({ id: m.id, label: m.id })) : [{ id: "LOG-00412", label: "Trans Sahel Haulage Ltd" }];

  return (
    <>
      <PageHeader title="Documents">
        <Btn onClick={() => setUpload(true)}>Upload Document</Btn>
      </PageHeader>
      <Panel title="Document Register">
        <QueueView
          rows={rows}
          getKey={(r) => r.source + r.id}
          initialTab={tab ?? "All"}
          tabs={["All", "Verified", "Under Review", "Expiring", "Expired", "Action Required"].map((l) => ({ label: l, test: (r: Row) => l === "All" || r.status === l || (l === "Action Required" && ["Rejected", "Information Required"].includes(r.status)) }))}
          columns={[
            { key: "id", header: "Document ID", render: (r) => <span className="beldium-mono">{r.id}</span>, sort: (r) => r.id },
            { key: "name", header: "Document", render: (r) => r.name, sort: (r) => r.name },
            { key: "type", header: "Type", render: (r) => r.type },
            { key: "rel", header: "Related", render: (r) => (r.relatedKind === "Vehicle" && r.source === "register" ? <IdLink kind="vehicle" id={r.relatedId} /> : r.relatedKind === "Driver" && r.source === "register" ? <IdLink kind="driver" id={r.relatedId} /> : r.relatedKind === "Movement" ? <IdLink kind="movement" id={r.relatedId} /> : r.relatedId) },
            { key: "kind", header: "Category", render: (r) => r.relatedKind },
            { key: "issue", header: "Issued", render: (r) => fmtDate(r.issue), sort: (r) => r.issue },
            { key: "exp", header: "Expiry", render: (r) => fmtDate(r.expiry), sort: (r) => r.expiry ?? "9999" },
            { key: "src", header: "Source", render: (r) => (r.source === "onboarding" ? "Onboarding" : "Register") },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} />, sort: (r) => r.status },
          ]}
          searchText={(r) => `${r.id} ${r.name} ${r.type} ${r.relatedId} ${r.number}`}
          filters={[
            { label: "Category", get: (r) => r.relatedKind },
            { label: "Type", get: (r) => r.type },
          ]}
          onOpen={(r) => setView(r.id)}
          actions={(r) =>
            r.source === "register" ? (
              <>
                <RowAction onClick={() => setView(r.id)}>View</RowAction>
                {r.expiry ? (
                  <RowAction
                    onClick={() => {
                      setRf({ expiry: "", number: "" });
                      setRenew(r.id);
                    }}
                  >
                    Renew
                  </RowAction>
                ) : null}
              </>
            ) : (
              <RowAction onClick={() => setView(r.id)}>View</RowAction>
            )
          }
        />
      </Panel>

      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title={doc?.name ?? obDoc?.name ?? ""}
        footer={
          doc && doc.verification === "Under Review" ? (
            <>
              <Btn variant="outline" onClick={() => { reviewDocument(doc.id, "Action Required"); toast.success("Information requested"); setView(null); }}>
                Request Information
              </Btn>
              <Btn variant="danger" onClick={() => { reviewDocument(doc.id, "Rejected"); toast.success("Rejected"); setView(null); }}>
                Reject
              </Btn>
              <Btn onClick={() => { reviewDocument(doc.id, "Verified"); toast.success("Verified by Beldium Compliance"); setView(null); }}>
                Verify
              </Btn>
            </>
          ) : (
            <Btn variant="outline" onClick={() => setView(null)}>
              Close
            </Btn>
          )
        }
      >
        {doc ? (
          <FieldGrid
            items={[
              { label: "Document ID", value: doc.id },
              { label: "Type", value: doc.type },
              { label: "Number", value: doc.number },
              { label: "Issuing authority", value: doc.authority },
              { label: "Issue date", value: fmtDate(doc.issueDate) },
              { label: "Expiry date", value: fmtDate(doc.expiryDate) },
              { label: "Related", value: `${doc.relatedKind} ${doc.relatedId}` },
              { label: "Verification", value: <StatusBadge value={doc.verification} /> },
              { label: "Current status", value: <StatusBadge value={docState(doc)} /> },
            ]}
          />
        ) : obDoc ? (
          <FieldGrid
            items={[
              { label: "Document ID", value: obDoc.id },
              { label: "Group", value: obDoc.type },
              { label: "Number", value: obDoc.number || "-" },
              { label: "Issuing authority", value: obDoc.authority || "-" },
              { label: "Expiry", value: fmtDate(obDoc.expiry) },
              { label: "Status", value: <StatusBadge value={obDoc.status} /> },
            ]}
          />
        ) : null}
      </Modal>

      <Modal
        open={!!renew}
        onClose={() => setRenew(null)}
        title="Renew Document"
        footer={
          <>
            <Btn variant="outline" onClick={() => setRenew(null)}>
              Cancel
            </Btn>
            <Btn
              disabled={!rf.expiry}
              onClick={() => {
                renewDocument(renew!, rf.expiry, rf.number);
                toast.success("Renewal submitted for review");
                setRenew(null);
              }}
            >
              Submit Renewal
            </Btn>
          </>
        }
      >
        <div className="grid gap-3">
          <FormField label="New document number">
            <input value={rf.number} onChange={(e) => setRf({ ...rf, number: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="New expiry date">
            <input type="date" value={rf.expiry} onChange={(e) => setRf({ ...rf, expiry: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="File">
            <input type="file" className={fieldCls} />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={upload}
        onClose={() => setUpload(false)}
        title="Upload Document"
        wide
        footer={
          <>
            <Btn variant="outline" onClick={() => setUpload(false)}>
              Cancel
            </Btn>
            <Btn
              disabled={!uf.name.trim() || !uf.relatedId}
              onClick={() => {
                uploadDocument({ ...uf, name: uf.name.trim(), expiryDate: uf.expiryDate || undefined });
                toast.success("Document submitted for review");
                setUpload(false);
              }}
            >
              Upload
            </Btn>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Document name">
            <input value={uf.name} onChange={(e) => setUf({ ...uf, name: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Document type">
            <select value={uf.type} onChange={(e) => setUf({ ...uf, type: e.target.value })} className={fieldCls}>
              {["Insurance", "Roadworthiness", "Licence", "Medical", "Safety", "Registration", "Tax", "Proof of Delivery", "Other"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Related to">
            <select
              value={uf.relatedKind}
              onChange={(e) => {
                const k = e.target.value as RelatedKind;
                const first = k === "Vehicle" ? s.vehicles[0]?.id : k === "Driver" ? s.drivers[0]?.id : k === "Movement" ? s.movements[0]?.id : "LOG-00412";
                setUf({ ...uf, relatedKind: k, relatedId: first ?? "" });
              }}
              className={fieldCls}
            >
              {["Organisation", "Vehicle", "Driver", "Movement"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Record">
            <select value={uf.relatedId} onChange={(e) => setUf({ ...uf, relatedId: e.target.value })} className={fieldCls}>
              {relatedOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Document number">
            <input value={uf.number} onChange={(e) => setUf({ ...uf, number: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Issuing authority">
            <input value={uf.authority} onChange={(e) => setUf({ ...uf, authority: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Issue date">
            <input type="date" value={uf.issueDate} onChange={(e) => setUf({ ...uf, issueDate: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Expiry date">
            <input type="date" value={uf.expiryDate} onChange={(e) => setUf({ ...uf, expiryDate: e.target.value })} className={fieldCls} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="File">
              <input type="file" className={fieldCls} />
            </FormField>
          </div>
        </div>
      </Modal>
    </>
  );
}
