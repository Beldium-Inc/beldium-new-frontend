import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload } from "lucide-react";
import { WAREHOUSING_DOMAIN_KEYS, WAREHOUSING_DOMAIN_LABELS, type WarehousingDomainKey } from "@/lib/api/warehousing";

export const Route = createFileRoute("/warehousing/operator/documents")({
  head: () => ({
    meta: [
      { title: "Document library | Beldium Warehouse Operator" },
      { name: "description", content: "Compliance documents submitted against your admission application." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { state, myApplication, uploadDocument } = useDemo();
  const documents = state.documents.filter((d) => d.application === myApplication?.id);
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<WarehousingDomainKey>(WAREHOUSING_DOMAIN_KEYS[0]!);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);

  return (
    <AppShell
      role="operator"
      title="Document library"
      subtitle="Everything Beldium can request during review or surveillance"
      actions={
        <Button className="rounded-xl bg-link text-link-foreground hover:bg-link/90" onClick={() => setOpen(true)} disabled={!myApplication}>
          <Upload className="mr-2 size-4" /> Upload document
        </Button>
      }
    >
      <Panel title="Registered documents" description="Renewal reminders are sent before expiry.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-sm">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    {d.title}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{WAREHOUSING_DOMAIN_LABELS[d.domain]}</TableCell>
                <TableCell className="text-sm">{d.expires_on ?? "-"}</TableCell>
                <TableCell>
                  <StatusPill tone={toneForStatus(d.status)}>{d.status}</StatusPill>
                </TableCell>
              </TableRow>
            ))}
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No documents uploaded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Upload document</DialogTitle>
            <DialogDescription>Attached to your admission application for review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Domain</Label>
              <select
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={domain}
                onChange={(e) => setDomain(e.target.value as WarehousingDomainKey)}
              >
                {WAREHOUSING_DOMAIN_KEYS.map((k) => (
                  <option key={k} value={k}>{WAREHOUSING_DOMAIN_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document type</Label>
              <Input id="doc-type" value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="rounded-xl" placeholder="e.g. fire_certificate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">File</Label>
              <Input id="doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-link text-link-foreground hover:bg-link/90"
              onClick={() => {
                if (!myApplication || !file || !title.trim() || !documentType.trim()) {
                  toast.error("Fill in the document details and choose a file");
                  return;
                }
                uploadDocument(myApplication.id, { domain, document_type: documentType.trim(), title: title.trim(), file });
                setOpen(false);
                setTitle("");
                setDocumentType("");
                setFile(null);
                toast.success("Document uploaded for review");
              }}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
