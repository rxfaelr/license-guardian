import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ADMIN_CREDENTIALS,
  findSupplierByEmail,
  loginAdmin,
  loginSupplier,
  setupSupplierPassword,
} from "@/lib/storage";
import { useSeed, useSession } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeafIcon, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  useSeed();
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.role === "admin") navigate({ to: "/admin" });
    if (session?.role === "supplier") navigate({ to: "/supplier" });
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-20">
        <section className="flex flex-col justify-center">
          <Link to="/" className="mb-8 inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LeafIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl">Verdor</span>
          </Link>

          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Conformidade ambiental,{" "}
            <span className="italic text-primary">sem ruído.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Centralize as licenças dos seus fornecedores e transportadores em um
            só lugar. Saiba o que está válido, o que vence em 120 dias, e o que
            já expirou — em um único olhar.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            <Stat color="success" label="Válidas" />
            <Stat color="warning" label="Em renovação" />
            <Stat color="danger" label="Expiradas" />
          </div>

          <div className="mt-10 rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Credenciais de demonstração</p>
            <p className="mt-1">
              <span className="font-medium">Admin:</span> {ADMIN_CREDENTIALS.email} ·{" "}
              <span className="font-mono">{ADMIN_CREDENTIALS.password}</span>
            </p>
            <p>
              <span className="font-medium">Fornecedor:</span> contato@ecotransporte.com ·{" "}
              <span className="font-mono">demo123</span>
            </p>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full p-6 sm:p-8 shadow-soft border-border">
            <LoginPanel />
          </Card>
        </section>
      </div>
    </div>
  );
}

function Stat({ color, label }: { color: "success" | "warning" | "danger"; label: string }) {
  const dot = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[color];
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
      <p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function LoginPanel() {
  return (
    <Tabs defaultValue="supplier" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="supplier" className="gap-2">
          <Truck className="h-4 w-4" />
          Fornecedor
        </TabsTrigger>
        <TabsTrigger value="admin" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Empresa Matriz
        </TabsTrigger>
      </TabsList>

      <TabsContent value="supplier" className="mt-6">
        <SupplierLogin />
      </TabsContent>

      <TabsContent value="admin" className="mt-6">
        <AdminLogin />
      </TabsContent>
    </Tabs>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
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
      <div>
        <h2 className="font-display text-2xl">Acesso administrativo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie fornecedores, tipos de licença e veja o painel de conformidade.
        </p>
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
    </form>
  );
}

function SupplierLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"check" | "login" | "setup">("check");
  const [companyName, setCompanyName] = useState("");

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

  if (step === "check") {
    return (
      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <h2 className="font-display text-2xl">Acesso do fornecedor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use o email cadastrado pela empresa contratante.
          </p>
        </div>
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
      </form>
    );
  }

  if (step === "setup") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (password.length < 6) return toast.error("A senha precisa de ao menos 6 caracteres.");
          if (password !== confirm) return toast.error("As senhas não coincidem.");
          const sess = setupSupplierPassword(email, password);
          if (!sess) return toast.error("Não foi possível definir a senha.");
          toast.success("Senha definida — bem-vindo!");
          navigate({ to: "/supplier" });
        }}
        className="space-y-4"
      >
        <div>
          <h2 className="font-display text-2xl">Primeiro acesso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Olá, <span className="font-medium text-foreground">{companyName}</span>. Defina uma
            senha para seu acesso.
          </p>
        </div>
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
    );
  }

  // login
  return (
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
      <div>
        <h2 className="font-display text-2xl">{companyName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Informe sua senha para entrar.</p>
      </div>
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
  );
}
