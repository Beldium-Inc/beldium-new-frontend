import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { FACILITIES, REVIEW_SECTIONS } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileWarning, ShieldAlert, CheckCircle2, Plus } from "lucide-react";

export const Route = createFileRoute("/partner/non-conformities")({
  head: () => ({
    meta: [
      { title: "Non-conformities | Beldium Compliance Partner" },
      { name: "description", content: "Register of open, in-progress and closed warehouse non-conformities with severity, owner and corrective due dates." },
      { property: "og:title", content: "Non-conformities | Beldium Compliance Partner" },
      { property: "og:description", content: "Corrective action tracking across supervised facilities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NonConformitiesPage,
});

function NonConformitiesPage() {
  const { nonConformities, addNonConformity } = useDemo();
  const [open, setOpen] = useState(false);
  const [facility, setFacility] = useState(FACILITIES[0]?.name ?? "");
  const [title, setTitle] = useState("");
  const [section, setSection] = useState(REVIEW_SECTIONS[0]?.title ?? "");
  const [severity, setSeverity] = useState<"Minor" | "Major" | "Critical">("Major");
  const [due, setDue] = useState("2026-09-30");
  const [owner, setOwner] = useState("Facility manager");

  return (
    <AppShell
      role="partner"
      title="Non-conformities"
      subtitle="Findings raised by Beldium reviewers and inspectors"
      actions={
        <Button className="rounded-xl bg-link text-link-foreground hover:bg-link/90" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New non-conformity
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Open" value={nonConformities.filter((n) => n.status === "Open").length} tone="danger" icon={<FileWarning className="size-5" />} />
          <StatCard label="In progress" value={nonConformities.filter((n) => n.status === "In progress").length} tone="warning" icon={<ShieldAlert className="size-5" />} />
          <StatCard label="Closed" value={nonConformities.filter((n) => n.status === "Closed").length} tone="success" icon={<CheckCircle2 className="size-5" />} />
        </div>

        <Panel title="Non-conformity register">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Finding</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Raised</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonConformities.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium text-primary">{n.id}</TableCell>
                  <TableCell className="max-w-72 text-sm">{n.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.facility}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.section}</TableCell>
                  <TableCell>
                    <StatusPill tone={toneForStatus(n.severity)}>{n.severity}</StatusPill>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.raised}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.due}</TableCell>
                  <TableCell className="text-sm">{n.owner}</TableCell>
                  <TableCell>
                    <StatusPill tone={toneForStatus(n.status)}>{n.status}</StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Create non-conformity</DialogTitle>
            <DialogDescription>The operator is notified and must upload corrective evidence before the due date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Facility</Label>
              <Select value={facility} onValueChange={setFacility}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FACILITIES.map((f) => (
                    <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc-finding">Finding</Label>
              <Textarea id="nc-finding" rows={3} value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" placeholder="Describe the non-conformity and the requirement breached" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REVIEW_SECTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Minor", "Major", "Critical"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nc-owner">Corrective action owner</Label>
                <Input id="nc-owner" value={owner} onChange={(e) => setOwner(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nc-due-date">Due date</Label>
                <Input id="nc-due-date" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-link text-link-foreground hover:bg-link/90"
              onClick={() => {
                if (title.trim().length < 10) {
                  toast.error("Describe the finding", { description: "At least a full sentence is required." });
                  return;
                }
                const id = addNonConformity({ facility, title: title.trim(), severity, due, owner, section }, "Adaeze Nwachukwu");
                setTitle("");
                setOpen(false);
                toast.success(`Non-conformity ${id} raised`, { description: `${severity} · ${facility}` });
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
