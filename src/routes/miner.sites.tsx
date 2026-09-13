import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/miner/sites")({ component: () => <Outlet /> });
