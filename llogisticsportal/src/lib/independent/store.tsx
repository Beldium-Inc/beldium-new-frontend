import * as React from "react";

import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import {
  applyDelivery,
  applyEvent,
  type DeliveryInput,
  type EventInput,
  type TransportAssignment,
} from "@/lib/trips/model";
import {
  DEMO_OPENINGS,
  SEED_IND_APP,
  driverIdFor,
  indSubmissionMissing,
  materiallyChanged,
  newIndependentApplication,
  openingRestrictions,
  pendingReview,
  seedReview,
  type IndependentApplication,
  type OperatorReview,
} from "./model";

// Browser-local state for the independent operator workspace.
//
// The backend has no independent-operator, review or trip endpoints yet (see
// docs/logistics-backend-gaps.md), so each signed-in account keeps its
// application, the review record and its trips in localStorage. The browser
// owner can edit this, so it is a demo record, never an authority. The
// account itself, sign-in and email verification are real.

export type Subject = "mine" | "demo";

export interface IndependentWorkspace {
  application: IndependentApplication;
  /** Officer-owned. Absent until submission; the operator never edits it. */
  review?: OperatorReview | undefined;
  trips: TransportAssignment[];
  read: string[];
}

interface Persisted {
  subject: Subject;
  mine: IndependentWorkspace | null;
  demo: IndependentWorkspace;
}

const seedDemo = (): IndependentWorkspace => ({
  application: structuredClone(SEED_IND_APP),
  review: seedReview(),
  trips: [],
  read: [],
});

const storageKey = (userId: string) => `beldium-portal-independent-v1:${userId}`;

function load(user: User): Persisted {
  const fresh: Persisted = { subject: "mine", mine: null, demo: seedDemo() };
  try {
    const raw = window.localStorage.getItem(storageKey(user.id));
    if (raw) return { ...fresh, ...(JSON.parse(raw) as Partial<Persisted>) };
  } catch {
    // Unreadable or blocked storage: start fresh.
  }
  return fresh;
}

function newWorkspace(user: User): IndependentWorkspace {
  const operatorId = `BLC-IND-${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  return {
    application: newIndependentApplication(operatorId, user.id, {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone_number,
    }),
    trips: [],
    read: [],
  };
}

interface IndependentContext {
  user: User;
  subject: Subject;
  setSubject: (s: Subject) => void;
  /** The workspace being viewed: the account's own, or the seeded demo operator. */
  workspace: IndependentWorkspace;
  isDemo: boolean;
  save: (a: IndependentApplication) => void;
  submit: (a: IndependentApplication) => string;
  acceptOpening: (openingId: string, vehicleId: string) => string;
  recordEvent: (tripId: string, input: EventInput) => void;
  deliver: (tripId: string, d: DeliveryInput) => void;
  respond: (requestId: string, message: string, filename: string) => void;
  markRead: (id: string) => void;
  resetDemo: () => void;
}

const Context = React.createContext<IndependentContext | null>(null);

export function IndependentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <IndependentStateProvider key={user.id} user={user}>
      {children}
    </IndependentStateProvider>
  );
}

function IndependentStateProvider({ user, children }: { user: User; children: React.ReactNode }) {
  const [state, setState] = React.useState<Persisted>(() => load(user));

  React.useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(user.id), JSON.stringify(state));
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  }, [state, user.id]);

  const mine = state.mine ?? newWorkspace(user);
  const workspace = state.subject === "demo" ? state.demo : mine;
  const actorName =
    state.subject === "demo"
      ? `${SEED_IND_APP.personal["firstName"]} ${SEED_IND_APP.personal["lastName"]}`
      : `${user.first_name} ${user.last_name}`.trim() || user.email;
  const actor = { name: actorName, canClose: true };

  const update = (fn: (w: IndependentWorkspace) => IndependentWorkspace) =>
    setState((s) =>
      s.subject === "demo"
        ? { ...s, demo: fn(s.demo) }
        : { ...s, mine: fn(s.mine ?? newWorkspace(user)) },
    );

  const updateTrip = (tripId: string, fn: (t: TransportAssignment) => TransportAssignment) => {
    const trip = workspace.trips.find((t) => t.id === tripId);
    if (!trip) throw Error("This trip is not in your workspace.");
    const next = fn(trip); // throws before any state change when a rule refuses it
    update((w) => ({ ...w, trips: w.trips.map((t) => (t.id === tripId ? next : t)) }));
  };

  const value: IndependentContext = {
    user,
    subject: state.subject,
    isDemo: state.subject === "demo",
    setSubject: (subject) => setState((s) => ({ ...s, subject })),
    workspace,

    save: (a) =>
      update((w) => ({
        ...w,
        application: a,
        // Changing reviewed declarations sends the record back for separate review.
        review: w.review && materiallyChanged(w.application, a) ? pendingReview(a) : w.review,
      })),

    submit: (a) => {
      const missing = indSubmissionMissing(a);
      if (missing.length || !a.declarations["submit"])
        throw Error(missing.length ? missing.join("; ") : "Confirm submission.");
      const reference = a.reference ?? `BLC-IND-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const next: IndependentApplication = {
        ...a,
        status: "Submitted",
        reference,
        submittedAt: new Date().toISOString(),
        completed: [0, 1, 2, 3, 4, 5, 6, 7],
      };
      // A resubmission without material changes keeps the existing review;
      // material changes were already sent back for review by `save`.
      update((w) => ({ ...w, application: next, review: w.review ?? pendingReview(next) }));
      return reference;
    },

    acceptOpening: (openingId, vehicleId) => {
      const o = DEMO_OPENINGS.find((x) => x.id === openingId);
      if (!o) throw Error("This assignment is no longer available.");
      const a = workspace.application;
      const reasons = openingRestrictions(o, a, workspace.review, workspace.trips, vehicleId);
      if (reasons.length) throw Error(reasons.join("; "));
      const vehicle = a.vehicles.find((x) => x.id === vehicleId);
      const id = `BLC-TRP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const at = new Date().toISOString();
      const trip: TransportAssignment = {
        id,
        operatorId: a.operatorId,
        sector: "Demo Marketplace",
        rfq: o.id,
        cargo: {
          reference: `DEMO-CARGO-${o.id}`,
          mineral: o.mineral,
          description: "Simulated cargo only",
          quantity: o.quantity,
          unit: o.unit,
        },
        pickupOrganization: o.client,
        pickup: o.pickup,
        deliveryOrganization: "Demo receiving facility",
        destination: o.destination,
        pickupDate: o.date,
        service: "Independent haulage",
        vehicleId,
        vehicleLabel: vehicle ? `${vehicle.registration} · ${vehicle.type}` : vehicleId,
        driverId: driverIdFor(a.operatorId),
        status: "Accepted",
        milestones: (["Requested", "Accepted"] as const).map((type) => ({
          id: crypto.randomUUID(),
          type,
          at,
          actor: actorName,
          location: o.pickup,
          notes: "Demo assignment; no real movement",
          evidence: "",
        })),
        deliveries: [],
        exceptions: [],
      };
      update((w) => ({ ...w, trips: [trip, ...w.trips] }));
      return id;
    },

    recordEvent: (tripId, input) => updateTrip(tripId, (t) => applyEvent(t, input, actor)),

    deliver: (tripId, d) => updateTrip(tripId, (t) => applyDelivery(t, d, actor)),

    respond: (requestId, message, filename) => {
      if (!message.trim()) throw Error("Enter your response.");
      update((w) =>
        w.review
          ? {
              ...w,
              review: {
                ...w.review,
                requests: w.review.requests.map((r) =>
                  r.id === requestId
                    ? {
                        ...r,
                        status: "Responded",
                        response: { message, filename, at: new Date().toISOString() },
                      }
                    : r,
                ),
              },
            }
          : w,
      );
    },

    markRead: (id) => update((w) => (w.read.includes(id) ? w : { ...w, read: [...w.read, id] })),

    resetDemo: () => setState((s) => ({ ...s, demo: seedDemo() })),
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIndependent(): IndependentContext {
  const context = React.useContext(Context);
  if (!context) throw new Error("useIndependent must be used within an IndependentProvider");
  return context;
}
