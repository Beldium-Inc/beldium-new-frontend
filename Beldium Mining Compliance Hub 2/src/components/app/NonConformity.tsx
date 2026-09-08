import { useState } from "react";
import { CalendarClock, Paperclip, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/prototype/store";
import type { NonConformity, Severity } from "@/lib/prototype/types";
import { Chip, StatusChip } from "./chips";
import { Field } from "./primitives";

const categories = ["Environmental", "Safety", "Licence", "Site & GPS", "Production", "Equipment", "Corporate", "Financial", "Quality"];

export function CreateNonConformity({ siteId, trigger }: { siteId: string; trigger?: React.ReactNode }) {
  const { raiseNonConformity } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Environmental");
  const [severity, setSeverity] = useState<Severity>("Major");
  const [requiredAction, setRequiredAction] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [deadline, setDeadline] = useState("2026-09-30");

  const submit = () => {
    if (!title.trim() || !requiredAction.trim() || !responsiblePerson.trim()) {
      toast.error("Title, required action and responsible person are all needed");
      return;
    }
    raiseNonConformity({ siteId, title: title.trim(), category, severity, requiredAction: requiredAction.trim(), responsiblePerson: responsiblePerson.trim(), deadline });
    toast.success("Non-conformity raised", { description: `${severity} · due ${deadline}` });
    setTitle("");
    setRequiredAction("");
    setResponsiblePerson("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline" size="sm">Raise non-conformity</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Raise non-conformity</DialogTitle>
          <DialogDescription>Recorded against {siteId} and issued to the responsible person with a corrective-action deadline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nc-title">Non-conformity title</Label>
            <Input id="nc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Silt containment inadequate at discharge point" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Minor">Minor</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nc-action">Required corrective action</Label>
            <Textarea id="nc-action" rows={4} value={requiredAction} onChange={(e) => setRequiredAction(e.target.value)} placeholder="Describe the action and the evidence expected on close-out." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nc-person">Responsible person</Label>
              <Input id="nc-person" value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} placeholder="e.g. Ibrahim Danladi (Managing Director)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc-deadline">Close-out deadline</Label>
              <Input id="nc-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Issue non-conformity</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NonConformityCard({ nc, canDecide, canRespond }: { nc: NonConformity; canDecide: boolean; canRespond: boolean }) {
  const { decideCorrectiveAction, submitCorrectiveAction } = useStore();
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");
  const [attachment, setAttachment] = useState("");
  const latest = nc.submissions[nc.submissions.length - 1];
  const awaiting = latest && !latest.decision;

  const decide = (decision: "Accepted" | "Rejected" | "More Info Requested") => {
    if (!latest) return;
    decideCorrectiveAction(nc.id, latest.id, decision, note.trim());
    toast.success(`Corrective action ${decision.toLowerCase()}`);
    setNote("");
  };

  const respond = () => {
    if (!response.trim()) {
      toast.error("Describe the corrective action taken");
      return;
    }
    submitCorrectiveAction(nc.id, response.trim(), attachment.trim() ? attachment.split(",").map((a) => a.trim()) : ["Evidence pack.pdf"]);
    toast.success("Corrective action submitted for review");
    setResponse("");
    setAttachment("");
  };

  return (
    <article className="rounded-lg border border-border bg-surface shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{nc.ref}</span>
            <StatusChip value={nc.severity} />
            <StatusChip value={nc.status} />
            <Chip tone="info">{nc.category}</Chip>
          </div>
          <h3 className="mt-1.5 font-display text-sm font-semibold">{nc.title}</h3>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-3.5" /> Due {nc.deadline}
          </p>
          <p className="mt-1">Site {nc.siteId}</p>
        </div>
      </header>

      <div className="grid gap-5 px-5 py-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <Field label="Required corrective action" value={<span className="font-normal text-muted-foreground">{nc.requiredAction}</span>} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Responsible person">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5 text-muted-foreground" /> {nc.responsiblePerson}
              </span>
            </Field>
            <Field label="Raised by" value={<span className="font-normal text-muted-foreground">{`${nc.raisedBy} · ${nc.raisedAt}`}</span>} />
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-border bg-background p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Corrective action history</p>
          {nc.submissions.length === 0 && <p className="text-xs text-muted-foreground">No submission received yet.</p>}
          {nc.submissions.map((s) => (
            <div key={s.id} className="rounded-md bg-surface p-3 text-xs shadow-card">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{s.by}</p>
                <span className="text-muted-foreground">{s.at}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{s.message}</p>
              {s.attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {s.attachments.map((a) => (
                    <li key={a} className="inline-flex items-center gap-1.5 text-brand">
                      <Paperclip className="size-3" /> {a}
                    </li>
                  ))}
                </ul>
              )}
              {s.decision && (
                <p className="mt-2 rounded-sm bg-muted px-2 py-1.5">
                  <StatusChip value={s.decision} /> <span className="ml-1 text-muted-foreground">{s.decisionNote}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {canDecide && awaiting && (
        <div className="border-t border-border bg-brand-soft/40 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Reviewer decision on submitted corrective action</p>
          <Textarea className="mt-2 bg-surface" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Decision note recorded in the audit trail." />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide("Accepted")}>
              Accept &amp; close
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("Rejected")}>
              Reject &amp; escalate
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("More Info Requested")}>
              Request more information
            </Button>
          </div>
        </div>
      )}

      {canRespond && nc.status !== "Closed" && (
        <div className="border-t border-border bg-background px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Respond with corrective action evidence</p>
          <Textarea className="mt-2 bg-surface" rows={3} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Describe what was done, when, and by whom." />
          <Input
            className="mt-2 bg-surface"
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
            placeholder="Attach evidence file names, comma separated (demo upload)"
          />
          <Button className="mt-3" size="sm" onClick={respond}>
            Submit corrective action
          </Button>
        </div>
      )}
    </article>
  );
}
