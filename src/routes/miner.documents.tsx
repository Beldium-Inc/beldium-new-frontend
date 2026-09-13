import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/errors";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, EmptyState } from "@/verticals/miner/components/primitives";
import { StatusChip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/documents")({ component: DocumentsPage });

function DocumentsPage() {
  const { primarySite, documents, uploadDocument } = useMiner();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!primarySite || !name || !file) {
      toast.error("Provide a document name and a file.");
      return;
    }
    setSubmitting(true);
    try {
      await uploadDocument({ site: primarySite.id, name, ...(category ? { category } : {}), file });
      toast.success("Document uploaded.");
      setName("");
      setCategory("");
      setFile(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Documents" description="Licences, certificates and other compliance documents." />

      {primarySite && (
        <Panel title="Upload a document" className="mb-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Button className="mt-4" size="sm" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Uploading…" : "Upload"}
          </Button>
        </Panel>
      )}

      <Panel bodyClassName="p-0">
        {documents.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No documents uploaded yet" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell>{d.uploaded}</TableCell>
                  <TableCell>{d.expiry ?? "—"}</TableCell>
                  <TableCell><StatusChip value={d.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
