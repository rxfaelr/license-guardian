import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSeed, useSession } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { LeafIcon, ShieldCheck, Truck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Securuss — Conformidade ambiental sem ruído" },
      {
        name: "description",
        content:
          "Centralize as licenças ambientais dos seus fornecedores e transportadores. Saiba o que está válido, em renovação ou expirado em um único olhar.",
      },
      { property: "og:title", content: "Securuss — Conformidade ambiental sem ruído" },
      {
        property: "og:description",
        content:
          "Painel único para acompanhar a validade das licenças ambientais dos seus fornecedores.",
      },
    ],
  }),
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
            <span className="font-display text-2xl">Securuss</span>
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
        </section>

        <section className="flex flex-col justify-center gap-4">
          <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">
            Escolha seu acesso
          </p>

          <RoleCard
            to="/login/supplier"
            icon={<Truck className="h-6 w-6" />}
            title="Sou fornecedor"
            description="Envie e acompanhe a validade das suas licenças ambientais para a empresa contratante."
          />

          <RoleCard
            to="/login/admin"
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Sou da empresa matriz"
            description="Gerencie fornecedores, tipos de licença e veja o painel de conformidade."
          />
        </section>
      </div>
    </div>
  );
}

function RoleCard({
  to,
  icon,
  title,
  description,
}: {
  to: "/login/admin" | "/login/supplier";
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="group block">
      <Card className="border-border p-6 shadow-soft transition-all group-hover:border-primary/40 group-hover:shadow-md">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            {icon}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl">{title}</h2>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
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
