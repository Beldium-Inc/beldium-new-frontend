import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account · Beldium Mining Compliance" },
      {
        name: "description",
        content:
          "Register your mining organisation, inspection body or oversight account on the Beldium mining compliance platform.",
      },
      { property: "og:title", content: "Create your account · Beldium Mining Compliance" },
      { property: "og:description", content: "Role-based onboarding for the Beldium mining compliance platform." },
    ],
  }),
  component: () => <Outlet />,
});
