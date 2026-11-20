import { operatorStatus } from "./model";
import { useIndependent } from "./store";

export interface IndependentNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
}

/** Derived from the workspace: application status, information requests and trip updates. */
export function useIndependentNotifications(): IndependentNotification[] {
  const { workspace } = useIndependent();
  const { application: a, review, trips, read } = workspace;
  const status = operatorStatus(a, review);
  const items = [
    {
      // Keyed by status so a status change shows as a new, unread notification.
      id: `application:${status}`,
      title: "Application status",
      body: `${status} · ${a.reference ?? "Complete your eight-step application"}`,
    },
    ...(review?.requests ?? []).map((r) => ({
      id: `request:${r.id}:${r.status}`,
      title: `Information requested: ${r.reason}`,
      body: `${r.message} · ${r.status}`,
    })),
    ...trips.map((t) => ({
      id: `trip:${t.id}:${t.milestones.length}`,
      title: "Transport status updated",
      body: `${t.id} · ${t.status}`,
    })),
  ];
  return items.map((n) => ({ ...n, read: read.includes(n.id) }));
}
