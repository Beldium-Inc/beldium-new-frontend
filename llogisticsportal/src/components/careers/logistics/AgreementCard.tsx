import { FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgreementCardProps {
  title: string;
  summary: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  signedName: string;
  onSignedNameChange: (name: string) => void;
  error?: string | undefined;
}

export function AgreementCard({
  title,
  summary,
  checked,
  onCheckedChange,
  signedName,
  onSignedNameChange,
  error,
}: AgreementCardProps) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-mist text-brand-navy-deep">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h4 className="font-display text-base font-semibold text-brand-navy-deep">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-xl bg-brand-mist/50 p-4">
        <label className="flex items-start gap-3 text-sm text-brand-navy-deep">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => onCheckedChange(!!v)}
            className="mt-0.5"
          />
          <span>I have read and agree to the {title}.</span>
        </label>

        <div className="space-y-1.5">
          <Label htmlFor={`signature-${title}`} className="text-xs">
            Typed signature (full name)
          </Label>
          <Input
            id={`signature-${title}`}
            placeholder="Type your full name to sign"
            value={signedName}
            onChange={(e) => onSignedNameChange(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
