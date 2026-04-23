import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  findSupplierByEmail,
  loginSupplier,
  setupSupplierPassword,
} from "@/lib/storage";
import { useSeed, useSession } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LeafIcon, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login/supplier")({
  head: () => ({
    meta: [
      { title: "Acesso do fornecedor — Securuss" },
      {
        name: "description",
        content:
          "Entre com o email cadastrado pela empresa contratante para enviar e acompanhar suas licenças ambientais.",
      },
    ],
  }),
  component: SupplierLoginPage,
});

function SupplierLoginPage() {
  useSeed();
  const session = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"check" | "login" | "setup">("check");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (session?.role === "admin") navigate({ to: "/admin" });
    if (session?.role === "supplier") navigate({ to: "/supplier" });
  }, [session, navigate]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const s = findSupplierByEmail(email);
    if (!s) {
      toast.error("Email não cadastrado. Solicite acesso ao administrador.");
      return;
    }
    setCompanyName(s.companyName);
    setStep(s.password ? "login" : "setup");
  };

  return (
    <div className="min-h-screen bg-background bg-paper">
      <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LeafIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl">Securuss</span>
        </Link>

        <Card className="p-6 sm:p-8 shadow-soft border-border">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl">Acesso do fornecedor</h1>
              <p className="text-sm text-muted-foreground">
                {step === "check" && "Use o email cadastrado pela contratante"}
                {step === "setup" && "Primeiro acesso — defina sua senha"}
                {step === "login" && companyName}
              </p>
            </div>
          </div>

          {step === "check" && (
            <form onSubmit={handleCheck} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sup-email">Email corporativo</Label>
                <Input
                  id="sup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@empresa.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Continuar
              </Button>
              <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Demo</p>
                <p className="mt-1" suppressHydrationWarning>
                  contato@ecotransporte.com · <span className="font-mono">demo123</span>
                </p>
              </div>
            </form>
          )}

          {step === "setup" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password.length < 6)
                  return toast.error("A senha precisa de ao menos 6 caracteres.");
                if (password !== confirm) return toast.error("As senhas não coincidem.");
                const sess = setupSupplierPassword(email, password);
                if (!sess) return toast.error("Não foi possível definir a senha.");
                toast.success("Senha definida — bem-vindo!");
                navigate({ to: "/supplier" });
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Olá, <span className="font-medium text-foreground">{companyName}</span>. Defina
                uma senha para seu acesso.
              </p>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pass">Nova senha</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pass">Confirmar senha</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full">
                Criar senha e entrar
              </Button>
              <button
                type="button"
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setStep("check")}
              >
                ← Trocar email
              </button>
            </form>
          )}

          {step === "login" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const sess = loginSupplier(email, password);
                if (!sess) return toast.error("Senha incorreta.");
                toast.success(`Bem-vindo, ${companyName}!`);
                navigate({ to: "/supplier" });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-pass">Senha</Label>
                <Input
                  id="sup-pass"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
              <button
                type="button"
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setStep("check")}
              >
                ← Trocar email
              </button>
            </form>
          )}

          <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            É administrador?{" "}
            <Link to="/login/admin" className="font-medium text-foreground hover:text-primary">
              Acessar área administrativa
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
