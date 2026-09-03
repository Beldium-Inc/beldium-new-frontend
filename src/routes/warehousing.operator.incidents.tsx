import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Incident } from "@/verticals/warehousing/data";

export const Route = createFileRoute("/warehousing/operator/incidents")({
  head: () => ({
    meta: [
      { title: "Incident reporting | Beldium Warehouse Operator" },
      { name: "description", content: "Report and track safety, environmental, security and stock integrity incidents visible to Beldium reviewers." },
      { property: "og:title", content: "Incident reporting | Beldium Warehouse Operator" },
      { property: "og:description", content: "Log warehouse incidents and follow investigation status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IncidentsPage,
});

const CATEGORIES: Incident["category"][] = ["Safety", "Environmental", "Security", "Stock integrity"];
const SEVERITIES: Incident["severity"][] = ["Low", "Medium", "High"];

function IncidentsPage() {
  const { incidents, reportIncident } = useDemo();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Incident["category"]>("Safety");
  const [severity, setSeverity] = useState<Incident["severity"]>("Medium");
  const [location, setLocation] = useState("A-BAY-02");
  const [detail, setDetail] = useState("");

  return (
    <AppShell
      role="operator"
      title="Incidents"
      subtitle="Reportable events are mirrored to Beldium continuous monitoring"
      actions={
        <Button className="rounded-xl bg-link text-link-foreground hover:bg-link/90" onClick={() => setOpen(true)}>
          Report incident
        </Button>
      }
    >
      <Panel title="Incident register" description="High-severity incidents trigger a Beldium for-cause inspection review.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Incident</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reported by</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium text-primary">{i.id}</TableCell>
                <TableCell className="max-w-80 text-sm">{i.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.category}</TableCell>
                <TableCell><StatusPill tone={toneForStatus(i.severity)}>{i.severity}</StatusPill></TableCell>
                <TableCell className="text-sm">{i.date}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.location}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.reportedBy}</TableCell>
                <TableCell><StatusPill tone={toneForStatus(i.status)}>{i.status}</StatusPill></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Report an incident</DialogTitle>
            <DialogDescription>Submitted immediately to the compliance record for this facility.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="it">What happened?</Label>
              <Input id="it" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spillage during big-bag transfer at dock 2" className="rounded-xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ic">Category</Label>
                <select id="ic" value={category} onChange={(e) => setCategory(e.target.value as Incident["category"])} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is">Severity</Label>
                <select id="is" value={severity} onChange={(e) => setSeverity(e.target.value as Incident["severity"])} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="il">Location</Label>
                <Input id="il" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="id">Immediate action taken</Label>
              <Textarea id="id" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Describe containment and who was notified." className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-link text-link-foreground hover:bg-link/90"
              onClick={() => {
                if (title.trim().length < 8) {
                  toast.error("Describe the incident in a little more detail");
                  return;
                }
                const id = reportIncident(
                  {
                    title: title.trim(),
                    category,
                    severity,
                    date: new Date().toISOString().slice(0, 10),
                    location,
                    reportedBy: "Ibrahim Bello",
                  },
                  "Ibrahim Bello",
                );
                setOpen(false);
                setTitle("");
                setDetail("");
                toast.success(`Incident ${id} logged`, {
                  description: severity === "High" ? "Beldium notified: a for-cause inspection may follow." : "Visible to Beldium reviewers.",
                });
              }}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
