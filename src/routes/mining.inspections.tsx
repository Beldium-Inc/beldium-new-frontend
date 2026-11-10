import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { InspectionResult, InspectionType, MiningInspection } from "@/lib/api/mining";
import {
  useCreateInspection,
  useMiningInspections,
  useUpdateMiningInspection,
} from "@/lib/api/mining-queries";
import { CreateNonConformity } from "@/verticals/mining/components/NonConformity";
import { KpiCard, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  ListState,
  ListToolbar,
  SitePicker,
  errorMessage,
  fmtDate,
  matchesFilters,
  useListFilters,
  useMiningPermissions,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/inspections")({ component: InspectionsPage });

const TYPE_LABEL: Record<InspectionType, string> = {
  pre_approval: "Pre-approval",
  routine: "Routine",
  follow_up: "Follow-up",
  incident_triggered: "Incident-triggered",
};
const STATUS_LABEL: Record<MiningInspection["status"], string> = {
  requested: "Requested",
  scheduled: "Scheduled",
  completed: "Completed",
  overdue: "Overdue",
};
const RESULT_LABEL: Record<Exclude<InspectionResult, "">, string> = {
  pass: "Pass",
  pass_with_observations: "Pass with Observations",
  fail: "Fail",
};

/** Old rows may hold something other than a list; treat that as no findings. */
function findingsOf(i: MiningInspection) {
  return Array.isArray(i.findings) ? i.findings : [];
}

function InspectionsPage() {
  const { canDecide, isMiner } = useMiningPermissions();
  const inspections = useMiningInspections();
  const [filters, setFilters] = useListFilters();
  const [scheduling, setScheduling] = useState(false);
  const [recording, setRecording] = useState<MiningInspection | null>(null);

  const all = inspections.data?.results ?? [];
  const rows = all
    .filter((i) =>
      matchesFilters(filters, { siteId: i.site, status: STATUS_LABEL[i.status] }, [
        i.reference,
        i.site_name,
        i.inspector_display,
        TYPE_LABEL[i.type],
      ]),
    )
    .sort((a, b) =>
      (b.scheduled_for ?? b.created_at).localeCompare(a.scheduled_for ?? a.created_at),
    );

  const count = (s: MiningInspection["status"]) => all.filter((i) => i.status === s).length;

  return (
    <>
      <PageHeader
        eyebrow={isMiner ? "Compliance" : "Field"}
        title="Inspections"
        description={
          isMiner
            ? "Inspections of your sites: what is booked, what was found and the result."
            : "Schedule site inspections, record the outcome and raise findings."
        }
        actions={
          canDecide && (
            <Button onClick={() => setScheduling(true)}>
              <CalendarPlus className="size-4" /> Schedule inspection
            </Button>
          )
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Requested" value={count("requested")} tone="warning" />
        <KpiCard label="Scheduled" value={count("scheduled")} />
        <KpiCard label="Overdue" value={count("overdue")} tone="danger" />
        <KpiCard label="Completed" value={count("completed")} tone="success" />
      </div>
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        statuses={Object.values(STATUS_LABEL)}
        placeholder="Search reference, site or inspector"
      />
      <ListState
        loading={inspections.isPending}
        error={inspections.error}
        empty={rows.length === 0}
        emptyTitle="No inspections match"
      >
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.reference}</TableCell>
                    <TableCell className="text-sm font-medium">{i.site_name}</TableCell>
                    <TableCell className="text-sm">{TYPE_LABEL[i.type]}</TableCell>
                    <TableCell className="text-sm">
                      {fmtDate(i.completed_at ?? i.scheduled_for)}
                    </TableCell>
                    <TableCell className="text-sm">{i.inspector_display}</TableCell>
                    <TableCell>
                      <StatusChip value={STATUS_LABEL[i.status]} />
                    </TableCell>
                    <TableCell>
                      {i.result ? (
                        <StatusChip value={RESULT_LABEL[i.result]} />
                      ) : (
                        <span className="text-sm">—</span>
                      )}
                      {findingsOf(i).length > 0 && (
                        <p
                          className="mt-1 max-w-xs truncate text-xs text-muted-foreground"
                          title={findingsOf(i)
                            .map((f) => `${f.area}: ${f.observation}`)
                            .join("\n")}
                        >
                          {findingsOf(i).length} finding{findingsOf(i).length === 1 ? "" : "s"}:{" "}
                          {findingsOf(i)[0]!.area || findingsOf(i)[0]!.observation}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canDecide && i.status !== "completed" && (
                          <Button size="sm" onClick={() => setRecording(i)}>
                            Record outcome
                          </Button>
                        )}
                        {canDecide && i.result && i.result !== "pass" && (
                          <CreateNonConformity
                            siteId={i.site}
                            trigger={
                              <Button size="sm" variant="outline">
                                Raise finding
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </ListState>
      <ScheduleDialog open={scheduling} onClose={() => setScheduling(false)} />
      <OutcomeDialog inspection={recording} onClose={() => setRecording(null)} />
    </>
  );
}

function ScheduleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateInspection();
  const [site, setSite] = useState("");
  const [type, setType] = useState<InspectionType>("routine");
  const [date, setDate] = useState("");
  const [inspector, setInspector] = useState("");

  const submit = async () => {
    if (!site || !date) {
      toast.error("Choose a site and a date");
      return;
    }
    try {
      await create.mutateAsync({
        site,
        type,
        scheduled_for: date,
        inspector_name: inspector.trim() || "Unassigned",
      });
      toast.success("Inspection scheduled");
      setSite("");
      setDate("");
      setInspector("");
      onClose();
    } catch (err) {
      toast.error("Could not schedule the inspection", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule an inspection</DialogTitle>
          <DialogDescription>
            The miner sees the booking on their Inspections page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="insp-site">Site</Label>
            <SitePicker id="insp-site" value={site} onChange={setSite} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="insp-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as InspectionType)}>
              <SelectTrigger id="insp-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="insp-date">Date</Label>
            <Input
              id="insp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="insp-inspector">Inspector</Label>
            <Input
              id="insp-inspector"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              placeholder="Leave blank to assign later"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={create.isPending} onClick={submit}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OutcomeDialog({
  inspection,
  onClose,
}: {
  inspection: MiningInspection | null;
  onClose: () => void;
}) {
  const update = useUpdateMiningInspection();
  const [result, setResult] = useState<Exclude<InspectionResult, "">>("pass");
  const [findings, setFindings] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!inspection) return;
    if (result !== "pass" && !findings.trim()) {
      toast.error("Describe the findings", {
        description: "Required unless the result is a clean pass.",
      });
      return;
    }
    try {
      await update.mutateAsync({
        id: inspection.id,
        patch: {
          status: "completed",
          result,
          // One finding per line, "Area: what was seen".
          findings: findings
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [area, ...rest] = line.split(":");
              return rest.length
                ? { area: area!.trim(), observation: rest.join(":").trim(), severity: "Minor" }
                : { area: "General", observation: line, severity: "Minor" };
            }),
          notes: notes.trim(),
        },
      });
      toast.success("Outcome recorded");
      setFindings("");
      setNotes("");
      onClose();
    } catch (err) {
      toast.error("Could not record the outcome", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={inspection !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record outcome · {inspection?.reference}</DialogTitle>
          <DialogDescription>{inspection?.site_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="out-result">Result</Label>
            <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
              <SelectTrigger id="out-result">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESULT_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="out-findings">Findings, one per line ("Area: what was seen")</Label>
            <Textarea
              id="out-findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="out-notes">Internal notes</Label>
            <Textarea id="out-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={submit}>
            Save outcome
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
