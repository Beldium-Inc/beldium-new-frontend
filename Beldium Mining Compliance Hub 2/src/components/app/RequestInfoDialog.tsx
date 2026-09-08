import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/prototype/store";
import type { SectionKey } from "@/lib/prototype/types";

export function RequestInfoDialog({
  open,
  onOpenChange,
  siteId,
  section,
  requestedFrom,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  siteId: string;
  section: SectionKey | "general";
  requestedFrom: string;
}) {
  const { requestInformation } = useStore();
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [dueBy, setDueBy] = useState("2026-09-06");
  const [priority, setPriority] = useState<"Low" | "Normal" | "High">("Normal");

  const submit = () => {
    if (!subject.trim()) {
      toast.error("Add a subject for the information request");
      return;
    }
    requestInformation({ siteId, section, subject: subject.trim(), details: details.trim(), dueBy, priority, requestedFrom });
    toast.success("Information request sent", { description: `${requestedFrom} notified — due ${dueBy}.` });
    setSubject("");
    setDetails("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Request information</SheetTitle>
          <SheetDescription>
            Sent to {requestedFrom} against {siteId} · {section === "general" ? "general" : `${section} section`}.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="ri-subject">Subject</Label>
            <Input
              id="ri-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Certified turbidity results for weeks 33–34"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ri-details">What is required</Label>
            <Textarea
              id="ri-details"
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Specify the documents, dates and accreditation expected."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ri-due">Response due by</Label>
              <Input id="ri-due" type="date" value={dueBy} onChange={(e) => setDueBy(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={submit}>Send request</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
