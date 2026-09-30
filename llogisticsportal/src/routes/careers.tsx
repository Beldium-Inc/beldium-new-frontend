import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

const title = "Beldium Logistics Talent Portal: Careers & Partnerships";
const description =
  "Join Beldium's Logistics Department through our Internship, Volunteer, or Strategic Partnership pathways. Help build the people powering Africa's digital logistics infrastructure.";
const ogImage =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/70f8509e-612a-4a56-b0f8-4a18c501d61e";

/**
 * Layout for the Logistics Talent Portal (formerly the standalone Beldium Careers Hub).
 * Its pages use their own look (Inter/Sora, rounded navy theme), scoped under
 * `.careers-theme` in styles.css so it never leaks into the operator hub.
 */
export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#0f1b3d" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  component: CareersLayout,
});

function CareersLayout() {
  // Portalled UI (select menus, dialogs) renders on <body>, outside the wrapper,
  // so the theme is also applied there while a careers page is open.
  useEffect(() => {
    document.body.classList.add("careers-theme");
    return () => document.body.classList.remove("careers-theme");
  }, []);

  return (
    <div className="careers-theme">
      <Outlet />
    </div>
  );
}
