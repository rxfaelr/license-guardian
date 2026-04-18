import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ensureSeed, getSession } from "@/lib/storage";

export const Route = createFileRoute("/supplier")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    ensureSeed();
    const s = getSession();
    if (!s) throw redirect({ to: "/" });
    if (s.role !== "supplier") throw redirect({ to: "/admin" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
