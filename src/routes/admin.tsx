import { createFileRoute } from "@tanstack/react-router";
import { noindexMeta } from "@/lib/seo";
import { NotAvailable } from "@/components/NotAvailable";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Traction X — Internal Workspace" }, ...noindexMeta()],
  }),
  // Locked until authentication exists — no admin data renders for anyone.
  component: NotAvailable,
});
