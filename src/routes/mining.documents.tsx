import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Upload } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ExpiryBadge } from "@/components/shared/expiry-badge";
import {
  downloadDocumentUrl,
  downloadLicenceUrl,
  type DocumentRecord,
  type LicenceDoc,
} from "@/lib/api/mining";
import {
  useLicences,
  useMiningDocuments,
  useReviewMiningDocument,
  useUploadLicence,
  useUploadMiningDocument,
} from "@/lib/api/mining-queries";
import { PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  ListState,
  ListToolbar,
  errorMessage,
  fmtDate,
  matchesFilters,
  openProtectedFile,
  SitePicker,
  useListFilters,
  useMiningPermissions,
  useSiteNames,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/documents")({ component: DocumentsPage });

const LICENCE_STATUS: Record<LicenceDoc["status"], string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  suspended: "Suspended",
};
const DOCUMENT_STATUS: Record<DocumentRecord["status"], string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
  superseded: "Replaced",
};

function DocumentsPage() {
  const { isMiner, isRegulator } = useMiningPermissions();
  const licences = useLicences();
  const documents = useMiningDocuments();
  const [filters, setFilters] = useListFilters();
  const siteName = useSiteNames();
  const [upload, setUpload] = useState<"licence" | "document" | null>(null);

  const licenceRows = (licences.data?.results ?? []).filter((l) =>
    matchesFilters(filters, { siteId: l.site }, [l.number, l.type, l.authority, l.site_name]),
  );
  const documentRows = (documents.data?.results ?? []).filter((d) =>
    matchesFilters(filters, { siteId: d.site }, [
      d.name,
      d.category,
      d.original_name,
      siteName(d.site),
    ]),
  );
  // Live documents only: a replaced copy no longer counts.
  const pendingDocs = documentRows.filter((d) => d.status === "pending");
  const expiring = licenceRows
    .filter((l) => l.days_to_expiry !== null && l.days_to_expiry <= 90)
    .sort((a, b) => (a.days_to_expiry ?? 0) - (b.days_to_expiry ?? 0));

  return (
    <>
      <PageHeader
        eyebrow={isMiner ? "Company" : "Register"}
        title={
          isMiner
            ? "Licences & documents"
            : isRegulator
              ? "Licence & compliance"
              : "Documents & licences"
        }
        description={
          isMiner
            ? "Your mining licences and site documents. Upload a new copy before one expires."
            : "Licences and site documents across the register, with expiry and review status."
        }
        actions={
          isMiner && (
            <>
              <Button variant="outline" onClick={() => setUpload("document")}>
                <Upload className="size-4" /> Upload document
              </Button>
              <Button onClick={() => setUpload("licence")}>
                <Upload className="size-4" /> Add licence
              </Button>
            </>
          )
        }
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        placeholder="Search number, name or authority"
      />
      <Tabs defaultValue="licences">
        <TabsList>
          <TabsTrigger value="licences">Licences ({licenceRows.length})</TabsTrigger>
          <TabsTrigger value="documents">Site documents ({documentRows.length})</TabsTrigger>
          {!isMiner && !isRegulator && (
            <TabsTrigger value="pending">Awaiting review ({pendingDocs.length})</TabsTrigger>
          )}
          <TabsTrigger value="expiring">Expiring in 90 days ({expiring.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="licences" className="mt-4">
          <ListState
            loading={licences.isPending}
            error={licences.error}
            empty={licenceRows.length === 0}
            emptyTitle="No licences on record"
          >
            <LicenceTable rows={licenceRows} />
          </ListState>
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <ListState
            loading={documents.isPending}
            error={documents.error}
            empty={documentRows.length === 0}
            emptyTitle="No site documents on record"
          >
            <DocumentTable rows={documentRows} />
          </ListState>
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <ListState
            loading={documents.isPending}
            empty={pendingDocs.length === 0}
            emptyTitle="Nothing waiting for review"
          >
            <DocumentTable rows={pendingDocs} />
          </ListState>
        </TabsContent>
        <TabsContent value="expiring" className="mt-4">
          <ListState
            loading={licences.isPending}
            empty={expiring.length === 0}
            emptyTitle="No licence expires in the next 90 days"
          >
            <LicenceTable rows={expiring} />
          </ListState>
        </TabsContent>
      </Tabs>
      <UploadLicenceDialog open={upload === "licence"} onClose={() => setUpload(null)} />
      <UploadDocumentDialog open={upload === "document"} onClose={() => setUpload(null)} />
    </>
  );
}

function DownloadButton({ path, name }: { path: string; name: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        openProtectedFile(path, name)
          .catch((err) =>
            toast.error("Could not open the file", { description: errorMessage(err) }),
          )
          .finally(() => setBusy(false));
      }}
    >
      <Download className="size-4" /> View
    </Button>
  );
}

function LicenceTable({ rows }: { rows: LicenceDoc[] }) {
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Licence</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Authority</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">
                  <span className="font-mono">{l.number}</span>
                  <p className="text-xs text-muted-foreground">{l.type}</p>
                </TableCell>
                <TableCell className="text-sm">{l.site_name}</TableCell>
                <TableCell className="text-sm">{l.authority || "—"}</TableCell>
                <TableCell className="text-sm">{fmtDate(l.issued_on)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{fmtDate(l.expires_on)}</p>
                    <ExpiryBadge date={l.expires_on} days={l.days_to_expiry} compact />
                  </div>
                </TableCell>
                <TableCell>
                  <StatusChip value={LICENCE_STATUS[l.status]} />
                </TableCell>
                <TableCell className="text-right">
                  {l.file_url ? (
                    <DownloadButton path={downloadLicenceUrl(l.id)} name={`${l.number}.pdf`} />
                  ) : (
                    <span className="text-xs text-muted-foreground">No file</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

function DocumentTable({ rows }: { rows: DocumentRecord[] }) {
  const siteName = useSiteNames();
  const { canDecide } = useMiningPermissions();
  const [reviewing, setReviewing] = useState<DocumentRecord | null>(null);
  return (
    <>
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.name}
                    <p className="text-xs text-muted-foreground">
                      {d.category || "Uncategorised"}
                      {d.uploaded_by_name ? ` · ${d.uploaded_by_name}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{siteName(d.site)}</TableCell>
                  <TableCell className="text-sm">{fmtDate(d.created_at)}</TableCell>
                  <TableCell>
                    {d.expires_on ? (
                      <ExpiryBadge date={d.expires_on} compact />
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip value={DOCUMENT_STATUS[d.status]} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canDecide && d.status === "pending" && (
                        <Button size="sm" onClick={() => setReviewing(d)}>
                          Review
                        </Button>
                      )}
                      {d.file_url && (
                        <DownloadButton
                          path={downloadDocumentUrl(d.id)}
                          name={d.original_name || d.name}
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
      <ReviewDocumentDialog doc={reviewing} onClose={() => setReviewing(null)} />
    </>
  );
}

function ReviewDocumentDialog({
  doc,
  onClose,
}: {
  doc: DocumentRecord | null;
  onClose: () => void;
}) {
  const review = useReviewMiningDocument();
  const [notes, setNotes] = useState("");

  const decide = async (status: "verified" | "rejected") => {
    if (!doc) return;
    if (status === "rejected" && !notes.trim()) {
      toast.error("Say why the document is rejected", {
        description: "The miner is told this when they are asked for a replacement.",
      });
      return;
    }
    try {
      await review.mutateAsync({
        id: doc.id,
        status,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(
        status === "verified" ? "Document verified" : "Document rejected; replacement requested",
      );
      setNotes("");
      onClose();
    } catch (err) {
      toast.error("Could not record the review", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={doc !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {doc?.name}</DialogTitle>
          <DialogDescription>
            Rejecting opens an information request asking the miner for a replacement.
          </DialogDescription>
        </DialogHeader>
        {doc?.file_url && (
          <DownloadButton path={downloadDocumentUrl(doc.id)} name={doc.original_name || doc.name} />
        )}
        <div className="space-y-1.5">
          <Label htmlFor="review-notes">Notes</Label>
          <Textarea
            id="review-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Required when rejecting"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={review.isPending} onClick={() => decide("rejected")}>
            Reject
          </Button>
          <Button disabled={review.isPending} onClick={() => decide("verified")}>
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadLicenceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const upload = useUploadLicence();
  const [form, setForm] = useState({
    site: "",
    number: "",
    type: "",
    authority: "",
    issued_on: "",
    expires_on: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.site || !form.number.trim() || !form.type.trim()) {
      toast.error("Site, licence number and type are required");
      return;
    }
    try {
      await upload.mutateAsync({
        site: form.site,
        number: form.number.trim(),
        type: form.type.trim(),
        authority: form.authority.trim() || undefined,
        issued_on: form.issued_on || null,
        expires_on: form.expires_on || null,
        file,
      });
      toast.success("Licence added");
      setForm({ site: "", number: "", type: "", authority: "", issued_on: "", expires_on: "" });
      setFile(null);
      onClose();
    } catch (err) {
      toast.error("Could not add the licence", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a licence</DialogTitle>
          <DialogDescription>
            Upload the licence and its dates. The desk verifies it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="site">Site</Label>
            <SitePicker value={form.site} onChange={(site) => set({ site })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lic-number">Licence number</Label>
            <Input
              id="lic-number"
              value={form.number}
              onChange={(e) => set({ number: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lic-type">Type</Label>
            <Input
              id="lic-type"
              value={form.type}
              onChange={(e) => set({ type: e.target.value })}
              placeholder="Mining Lease"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lic-authority">Issuing authority</Label>
            <Input
              id="lic-authority"
              value={form.authority}
              onChange={(e) => set({ authority: e.target.value })}
              placeholder="Mining Cadastre Office"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lic-issued">Issued on</Label>
            <Input
              id="lic-issued"
              type="date"
              value={form.issued_on}
              onChange={(e) => set({ issued_on: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lic-expires">Expires on</Label>
            <Input
              id="lic-expires"
              type="date"
              value={form.expires_on}
              onChange={(e) => set({ expires_on: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lic-file">File</Label>
            <Input
              id="lic-file"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={upload.isPending} onClick={submit}>
            {upload.isPending ? "Uploading…" : "Add licence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDocumentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const upload = useUploadMiningDocument();
  const [form, setForm] = useState({ site: "", name: "", category: "", expires_on: "" });
  const [file, setFile] = useState<File | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.site || !form.name.trim() || !file) {
      toast.error("Site, document name and file are required");
      return;
    }
    try {
      await upload.mutateAsync({
        site: form.site,
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        expires_on: form.expires_on || null,
        file,
      });
      toast.success("Document uploaded for review");
      setForm({ site: "", name: "", category: "", expires_on: "" });
      setFile(null);
      onClose();
    } catch (err) {
      toast.error("Could not upload the document", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a site document</DialogTitle>
          <DialogDescription>
            Permits, plans, certificates and reports. The desk reviews each one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="site">Site</Label>
            <SitePicker value={form.site} onChange={(site) => set({ site })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="doc-name">Document name</Label>
            <Input
              id="doc-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Environmental Impact Assessment"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-category">Category</Label>
            <Input
              id="doc-category"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
              placeholder="Environmental"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-expires">Expires on</Label>
            <Input
              id="doc-expires"
              type="date"
              value={form.expires_on}
              onChange={(e) => set({ expires_on: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="doc-file">File</Label>
            <Input
              id="doc-file"
              type="file"
              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={upload.isPending} onClick={submit}>
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
