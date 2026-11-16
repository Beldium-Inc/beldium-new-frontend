import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/errors";
import type { QualitySetting, SettingValue } from "@/lib/api/quality-admin";
import {
  useChangeSetting,
  useQualitySettings,
  useSettingChanges,
} from "@/lib/api/quality-admin-queries";
import { ServerPager } from "@/components/shared/server-pager";
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
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/verticals/quality/shell";
import { useBeldium } from "@/verticals/quality/store";
import { EmptyState, PageHeader, Pill, SectionTitle, Surface } from "@/verticals/quality/ui";

export const Route = createFileRoute("/quality/settings")({
  head: () => ({ meta: [{ title: "Rule settings | Beldium Quality & Control" }] }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

// Who reads and changes settings follows the API contract until Q&C confirms
// it: Q&C, CEO and the Technical Lead read, Q&C changes.
const READERS = ["QC", "CEO", "TL"];

function showValue(setting: { value: SettingValue; unit: string | null }): string {
  const { value, unit } = setting;
  if (value === null) return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return unit ? `${text} ${unit}` : text;
}

/** Turn the typed text into the value the API expects for this setting, or undefined. */
function parseValue(setting: QualitySetting, text: string): SettingValue | undefined {
  const raw = text.trim();
  switch (setting.value_type) {
    case "positive_int": {
      const n = Number(raw);
      return Number.isInteger(n) && n > 0 ? n : undefined;
    }
    case "positive_int_list": {
      const parts = raw.split(",").map((part) => Number(part.trim()));
      return parts.length && parts.every((n) => Number.isInteger(n) && n > 0) ? parts : undefined;
    }
    case "boolean":
      return raw === "yes" ? true : raw === "no" ? false : undefined;
    case "text":
      return raw || undefined;
    case "text_list": {
      const parts = raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      return parts.length ? parts : undefined;
    }
    case "json":
      try {
        const parsed = JSON.parse(raw) as SettingValue;
        return parsed && typeof parsed === "object" ? parsed : undefined;
      } catch {
        return undefined;
      }
  }
}

function SettingsPage() {
  const { roleCodes } = useBeldium();
  const allowed = roleCodes.some((code) => READERS.includes(code));
  const canChange = roleCodes.includes("QC");
  const settings = useQualitySettings(allowed);
  const [history, setHistory] = React.useState<QualitySetting | null>(null);
  const [editing, setEditing] = React.useState<QualitySetting | null>(null);

  if (!allowed) {
    return (
      <Surface>
        <EmptyState title="Your role does not read rule settings" />
      </Surface>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Rules"
        title="Rule settings"
        description="Every Q&C rule value lives here with an effective date and a change history. A value is never edited: a change is a new entry that takes effect on its date and starts a new rule version, and every decision stores the version it used."
        actions={
          settings.data ? <Pill tone="navy">Rule version {settings.data.rule_version}</Pill> : null
        }
      />
      <Surface>
        <SectionTitle
          title="Settings"
          hint="Not set means Q&C has not given the value yet. Any check that needs it refuses to run."
        />
        {settings.isPending ? (
          <EmptyState title="Loading…" />
        ) : settings.isError ? (
          <EmptyState
            title={
              settings.error instanceof ApiError
                ? settings.error.message
                : "Settings could not be loaded."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {settings.data.results.map((setting) => (
              <div
                key={setting.setting_key}
                className="flex flex-wrap items-start justify-between gap-3 px-6 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-navy">{setting.label}</p>
                    {setting.is_placeholder ? <Pill tone="warning">Not set</Pill> : null}
                    {setting.pending_change ? <Pill tone="info">Change waiting</Pill> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {showValue(setting)} · decided by {setting.owner}
                    {setting.effective_from
                      ? ` · since ${new Date(setting.effective_from).toLocaleDateString()}`
                      : ""}
                  </p>
                  {setting.pending_change ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Next: {showValue({ value: setting.pending_change.value, unit: setting.unit })}{" "}
                      from {new Date(setting.pending_change.effective_from).toLocaleString()}
                    </p>
                  ) : null}
                  {setting.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">{setting.note}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setHistory(setting)}>
                    History
                  </Button>
                  {canChange ? (
                    <Button
                      size="sm"
                      onClick={() => setEditing(setting)}
                      disabled={Boolean(setting.pending_change)}
                    >
                      Change
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>
      {history ? <HistoryDialog setting={history} onClose={() => setHistory(null)} /> : null}
      {editing ? <ChangeDialog setting={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function HistoryDialog({ setting, onClose }: { setting: QualitySetting; onClose: () => void }) {
  const [page, setPage] = React.useState(1);
  const changes = useSettingChanges(setting.setting_key, page);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{setting.label}</DialogTitle>
          <DialogDescription>Every value this setting has had, newest first.</DialogDescription>
        </DialogHeader>
        {changes.data ? (
          <div className="max-h-[60vh] divide-y divide-border overflow-auto">
            {changes.data.results.map((change) => (
              <div key={change.id} className="py-3 text-sm">
                <p className="font-medium text-navy">
                  {showValue({ value: change.new_value, unit: change.unit })} · version{" "}
                  {change.rule_version}
                </p>
                <p className="text-xs text-muted-foreground">
                  From {new Date(change.effective_from).toLocaleString()} ·{" "}
                  {change.changed_by_name || "Seeded"} · {change.reason}
                </p>
              </div>
            ))}
            <ServerPager
              page={page}
              count={changes.data.count}
              hasNext={Boolean(changes.data.next)}
              onPage={setPage}
            />
          </div>
        ) : (
          <EmptyState title={changes.isError ? "History could not be loaded." : "Loading…"} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function hint(setting: QualitySetting): string {
  switch (setting.value_type) {
    case "positive_int":
      return "A whole number above zero.";
    case "positive_int_list":
      return "Whole numbers separated by commas, for example 90, 60, 30.";
    case "boolean":
      return "Type yes or no.";
    case "text":
      return "Text.";
    case "text_list":
      return "Items separated by commas.";
    case "json":
      return "A JSON object or list, as agreed with Q&C.";
  }
}

function ChangeDialog({ setting, onClose }: { setting: QualitySetting; onClose: () => void }) {
  const change = useChangeSetting();
  const [text, setText] = React.useState("");
  const [when, setWhen] = React.useState(() => {
    const soon = new Date(Date.now() + 5 * 60_000);
    soon.setSeconds(0, 0);
    return new Date(soon.getTime() - soon.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [reason, setReason] = React.useState("");
  const value = parseValue(setting, text);

  const submit = async () => {
    if (value === undefined || !reason.trim() || !when) return;
    try {
      await change.mutateAsync({
        key: setting.setting_key,
        value,
        effective_from: new Date(when).toISOString(),
        reason: reason.trim(),
      });
      toast.success("Change recorded. It takes effect on its date.");
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The change was not saved.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change {setting.label.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Now: {showValue(setting)}. The new value takes effect on the date you set and starts a
            new rule version.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="setting-value">New value</Label>
            <Input id="setting-value" value={text} onChange={(e) => setText(e.target.value)} />
            <p
              className={
                value === undefined && text
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {hint(setting)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setting-when">Takes effect</Label>
            <Input
              id="setting-when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setting-reason">Reason</Label>
            <Textarea
              id="setting-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={change.isPending || value === undefined || !reason.trim() || !when}
          >
            {change.isPending ? "Saving…" : "Record change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
