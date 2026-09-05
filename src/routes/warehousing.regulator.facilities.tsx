import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { FACILITIES } from "@/verticals/warehousing/data";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/regulator/facilities")({
  head: () => ({
    meta: [
      { title: "Facility register | Beldium Regulatory Portal" },
      { name: "description", content: "Read-only register of licensed mineral warehouses with status, risk score, capacity and last inspection date." },
      { property: "og:title", content: "Facility register | Beldium Regulatory Portal" },
      { property: "og:description", content: "Every supervised warehouse in one register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegulatorFacilities,
});

function RegulatorFacilities() {
  const [q, setQ] = useState("");
  const rows = FACILITIES.filter((f) => `${f.name} ${f.company} ${f.state} ${f.status}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell role="regulator" title="Facility register" subtitle="Read-only: status changes are made by the compliance partner">
      <Panel
        title={`${rows.length} facilities`}
        description="Risk score is the partner's latest weighted assessment."
        actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search facility, operator, state" className="h-10 w-64 rounded-xl" />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="w-40">Utilisation</TableHead>
              <TableHead>Last inspection</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="text-sm font-medium text-primary">{f.id}</TableCell>
                <TableCell className="text-sm">{f.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.company}</TableCell>
                <TableCell className="text-sm">{f.state}</TableCell>
                <TableCell><StatusPill tone={toneForStatus(f.status)}>{f.status}</StatusPill></TableCell>
                <TableCell>
                  <StatusPill tone={f.risk >= 85 ? "success" : f.risk >= 70 ? "warning" : "danger"}>{f.risk}/100</StatusPill>
                </TableCell>
                <TableCell className="text-sm">{f.capacity.toLocaleString()} t</TableCell>
                <TableCell>
                  <Progress value={f.utilisation} className="h-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">{f.utilisation}%</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.lastInspection}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
