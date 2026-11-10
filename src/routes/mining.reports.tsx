import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MINING_REPORT_KINDS,
  MINING_REPORT_PERIODS,
  downloadMiningReport,
  type MiningReportPeriod,
} from "@/lib/api/mining";
import { useStore } from "@/verticals/mining/store";
import { EmptyState, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { errorMessage, useMiningPermissions } from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/reports")({ component: ReportsPage });

/** Must match `mining.reports.ALL_REGIONS` on the server. */
const ALL_REGIONS = "All regions";

const DESCRIPTIONS: Record<string, string> = {
  national_compliance: "Sites, scores, risk bands and licence status across the register.",
  environmental_exceedances: "Every environmental reading on watch or in breach, by site.",
  inspection_programme: "Inspections booked, completed and overdue, with their results.",
  non_conformity_register: "Open and closed findings, severity, deadlines and corrective action.",
};

function ReportsPage() {
  const { isMiner } = useMiningPermissions();
  const { sites } = useStore();
  const [period, setPeriod] = useState<MiningReportPeriod>("last_quarter");
  const [scope, setScope] = useState(ALL_REGIONS);
  const [busy, setBusy] = useState<string | null>(null);
  const regions = [...new Set(sites.map((s) => s.state).filter(Boolean))].sort();

  if (isMiner) {
    return (
      <>
        <PageHeader title="Reports" />
        <Panel>
          <EmptyState
            title="Reports are compiled by the compliance desk and regulators"
            description="Your own figures are on the Production, Compliance and Inspections pages."
          />
        </Panel>
      </>
    );
  }

  const download = async (kind: string, label: string) => {
    setBusy(kind);
    try {
      const blob = await downloadMiningReport({ kind, period, scope });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label} - ${scope} - ${period}.pdf`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(`${label} downloaded`);
    } catch (err) {
      toast.error("Could not compile the report", { description: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Assurance"
        title="Reports"
        description="Compile a PDF from the live register. Nothing is stored; each download is built fresh."
      />
      <Panel title="Report settings" className="mb-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <div className="space-y-1.5">
            <Label htmlFor="rep-period">Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as MiningReportPeriod)}>
              <SelectTrigger id="rep-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINING_REPORT_PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep-scope">Region</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger id="rep-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_REGIONS}>{ALL_REGIONS}</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {MINING_REPORT_KINDS.map((r) => (
          <Panel key={r.kind} title={r.label} description={DESCRIPTIONS[r.kind] ?? ""}>
            <Button disabled={busy !== null} onClick={() => download(r.kind, r.label)}>
              <FileDown className="size-4" />
              {busy === r.kind ? "Compiling…" : "Download PDF"}
            </Button>
          </Panel>
        ))}
      </div>
    </>
  );
}
