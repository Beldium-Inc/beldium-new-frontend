import { useState } from "react";
import { AlertTriangle, CheckCircle2, HardHat, Info, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type SectionDecision } from "@/verticals/mining/store";
import type { SectionKey } from "@/verticals/mining/types";

const meta: Record<Exclude<SectionDecision, "Request Information">, { title: string; prompt: string; cta: string }> = {
  Verify: { title: "Verify section", prompt: "Confirm the evidence supports compliance. Add a reviewer note for the audit trail.", cta: "Record verification" },
  Reject: { title: "Reject section", prompt: "State the deficiency. The organisation will see this reason.", cta: "Record rejection" },
  "Request Inspection": { title: "Request inspection", prompt: "Describe what the field inspector should verify on site.", cta: "Raise inspection request" },
  Flag: { title: "Flag for escalation", prompt: "Flagging moves the site to Suspended and notifies oversight.", cta: "Flag section" },
};

export function ReviewActions({
  siteId,
  section,
  onRequestInfo,
  size = "sm",
}: {
  siteId: string;
  section: SectionKey;
  onRequestInfo: () => void;
  size?: "sm" | "default";
}) {
  const { decideSection } = useStore();
  const [open, setOpen] = useState<Exclude<SectionDecision, "Request Information"> | null>(null);
  const [note, setNote] = useState("");

  const submit = () => {
    if (!open) return;
    decideSection(siteId, section, open, note.trim());
    toast.success(`${open} recorded`, { description: `${section} section updated on ${siteId}.` });
    setNote("");
    setOpen(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size={size} onClick={() => setOpen("Verify")}>
          <CheckCircle2 className="size-4" /> Verify
        </Button>
        <Button size={size} variant="outline" onClick={() => setOpen("Reject")}>
          <XCircle className="size-4" /> Reject
        </Button>
        <Button size={size} variant="outline" onClick={onRequestInfo}>
          <Info className="size-4" /> Request information
        </Button>
        <Button size={size} variant="outline" onClick={() => setOpen("Request Inspection")}>
          <HardHat className="size-4" /> Request inspection
        </Button>
        <Button size={size} variant="outline" className="text-danger-foreground" onClick={() => setOpen("Flag")}>
          <AlertTriangle className="size-4" /> Flag
        </Button>
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{meta[open].title}</DialogTitle>
                <DialogDescription>{meta[open].prompt}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="decision-note">Reviewer note</Label>
                <Textarea
                  id="decision-note"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Lease certificate and fee receipt cross-checked against cadastre record."
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(null)}>
                  Cancel
                </Button>
                <Button onClick={submit}>{meta[open].cta}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
