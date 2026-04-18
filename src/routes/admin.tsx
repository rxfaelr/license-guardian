import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ensureSeed, getSession } from "@/lib/storage";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    ensureSeed();
    const s = getSession();
    if (!s) throw redirect({ to: "/" });
    if (s.role !== "admin") throw redirect({ to: "/supplier" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
