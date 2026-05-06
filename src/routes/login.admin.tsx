import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ADMIN_CREDENTIALS, loginAdmin } from "@/lib/storage";
import { useSeed, useSession } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import securussLogo from "@/assets/securuss-logo.png";
import { toast } from "sonner";

export const Route = createFileRoute("/login/admin")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Securuss" },
      {
        name: "description",
        content:
          "Entre como empresa matriz para gerenciar fornecedores, tipos de licença e o painel de conformidade.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  useSeed();
  const session = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session?.role === "admin") navigate({ to: "/admin" });
    if (session?.role === "supplier") navigate({ to: "/supplier" });
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background bg-paper">
      <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <img src={securussLogo} alt="Securuss" className="h-10 w-10 object-contain" />
          <span className="font-display text-2xl">Securuss</span>
        </Link>

        <Card className="p-6 sm:p-8 shadow-soft border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const s = loginAdmin(email, password);
              if (!s) return toast.error("Credenciais inválidas.");
              toast.success("Bem-vindo!");
              navigate({ to: "/admin" });
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-display text-2xl">Acesso administrativo</h1>
                <p className="text-sm text-muted-foreground">Empresa matriz</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar como administrador
            </Button>

            <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Credencial de demonstração</p>
              <p className="mt-1" suppressHydrationWarning>
                {ADMIN_CREDENTIALS.email} ·{" "}
                <span className="font-mono">{ADMIN_CREDENTIALS.password}</span>
              </p>
            </div>

            <p className="pt-2 text-center text-xs text-muted-foreground">
              É fornecedor?{" "}
              <Link to="/login/supplier" className="font-medium text-foreground hover:text-foreground">
                Acessar área do fornecedor
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
