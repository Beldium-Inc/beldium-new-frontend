import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/transactions")({ component: () => <Outlet /> });
