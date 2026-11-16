import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** The API pages lists 20 rows at a time (common/pagination.py). */
export const SERVER_PAGE_SIZE = 20;

/**
 * Previous and next for a list the server pages. The page number lives in
 * the caller's query, so filters and paging go to the server together and the
 * browser never filters a partial list.
 */
export function ServerPager({
  page,
  count,
  pageSize = SERVER_PAGE_SIZE,
  hasNext,
  busy,
  onPage,
}: {
  page: number;
  count: number;
  pageSize?: number;
  hasNext: boolean;
  busy?: boolean;
  onPage: (page: number) => void;
}) {
  if (count <= pageSize && page === 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-3 text-xs text-muted-foreground">
      <span>
        {first} to {last} of {count}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || busy}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || busy}
          onClick={() => onPage(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
