import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-store";
import { setSession } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import securussLogo from "@/assets/securuss-logo.png";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!session) return <>{children}</>;

  const nav: NavItem[] =
    session.role === "admin"
      ? [
          { to: "/admin", label: "Dashboard" },
          { to: "/admin/suppliers", label: "Fornecedores" },
          { to: "/admin/license-types", label: "Tipos de Licença" },
        ]
      : [{ to: "/supplier", label: "Minhas Licenças" }];

  return (
    <div className="min-h-screen bg-background bg-paper">
      <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <img src={securussLogo} alt="Securuss" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg leading-none text-sidebar-foreground">
              Securuss
              <span className="ml-1 text-xs font-sans font-normal text-sidebar-foreground/60">
                {session.role === "admin" ? "Admin" : "Fornecedor"}
              </span>
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active =
                pathname === item.to ||
                (item.to !== "/admin" && item.to !== "/supplier" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-sidebar-foreground/70 sm:inline">
              {session.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => {
                setSession(null);
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-t border-sidebar-border px-4 py-2 md:hidden">
          {nav.map((item) => {
            const active =
              pathname === item.to ||
              (item.to !== "/admin" && item.to !== "/supplier" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
