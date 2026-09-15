import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLicences, useMiningDocuments } from "@/lib/api/mining-queries";

export const Route = createFileRoute("/miner/documents")({ component: DocumentsPage });

const statusTone: Record<string, string> = {
  verified: "bg-success/10 text-success",
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  expiring: "bg-warning/10 text-warning",
  rejected: "bg-danger/10 text-danger",
  expired: "bg-danger/10 text-danger",
  suspended: "bg-danger/10 text-danger",
};

function DocumentsPage() {
  const docsQuery = useMiningDocuments();
  const licencesQuery = useLicences();
  const docs = docsQuery.data?.results ?? [];
  const licences = licencesQuery.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">Licences and supporting documents for your site.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Licences</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {licences.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No licences on file.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Authority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licences.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.number}</TableCell>
                      <TableCell className="text-sm">{l.type}</TableCell>
                      <TableCell className="text-sm">{l.authority}</TableCell>
                      <TableCell>
                        <Badge className={statusTone[l.status] ?? ""}>{l.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{l.expires_on ?? "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Other documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No documents uploaded.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{d.name}</TableCell>
                      <TableCell className="text-sm">{d.category}</TableCell>
                      <TableCell>
                        <Badge className={statusTone[d.status] ?? ""}>{d.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.expires_on ?? "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
