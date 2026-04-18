import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { useLicenses, useLicenseTypes, useSuppliers } from "@/hooks/use-store";
import { statusFor, statusLabel } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { StatusBadge, StatusDot } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, AlertTriangle, ShieldCheck, XCircle, CircleDashed } from "lucide-react";
import { shortDate, daysUntil } from "@/lib/format";
import type { LicenseStatus } from "@/lib/types";

const STATUS_ORDER: LicenseStatus[] = ["valid", "renewing", "expired", "missing"];
const STATUS_COLORS: Record<LicenseStatus, string> = {
  valid: "var(--success)",
  renewing: "var(--warning)",
  expired: "var(--danger)",
  missing: "var(--muted-foreground)",
};

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const suppliers = useSuppliers();
  const types = useLicenseTypes();
  const licenses = useLicenses();
  const [filter, setFilter] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<LicenseStatus | null>(null);

  const filteredSuppliers = filter === "all" ? suppliers : suppliers.filter((s) => s.id === filter);

  const allRequirements = useMemo(() => {
    return filteredSuppliers.flatMap((s) =>
      s.requiredLicenseTypeIds.map((tid) => {
        const doc = licenses.find((l) => l.supplierId === s.id && l.licenseTypeId === tid);
        const type = types.find((t) => t.id === tid);
        return { supplier: s, type, doc, status: statusFor(doc) };
      }),
    );
  }, [filteredSuppliers, licenses, types]);

  const counts = useMemo(() => {
    const c = { valid: 0, renewing: 0, expired: 0, missing: 0 };
    for (const r of allRequirements) c[r.status]++;
    return c;
  }, [allRequirements]);

  const total = allRequirements.length;

  const pieData = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        name: statusLabel(status),
        value: counts[status],
        color: STATUS_COLORS[status],
      })).filter((d) => d.value > 0),
    [counts],
  );

  const upcomingSource = activeStatus
    ? allRequirements.filter((r) => r.status === activeStatus)
    : allRequirements.filter((r) => r.status === "renewing" || r.status === "expired");

  const upcoming = upcomingSource
    .sort((a, b) => {
      const order = (s: LicenseStatus) =>
        s === "expired" ? 0 : s === "renewing" ? 1 : s === "missing" ? 2 : 3;
      const oa = order(a.status);
      const ob = order(b.status);
      if (oa !== ob) return oa - ob;
      const da = a.doc ? new Date(a.doc.expiryDate).getTime() : Infinity;
      const db = b.doc ? new Date(b.doc.expiryDate).getTime() : Infinity;
      return da - db;
    })
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Painel de conformidade</p>
          <h1 className="font-display text-3xl sm:text-4xl">Visão geral</h1>
        </div>
        <div className="w-full sm:w-72">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os fornecedores</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          tone="success"
          icon={<ShieldCheck className="h-4 w-4" />}
          label={statusLabel("valid")}
          value={counts.valid}
        />
        <KpiCard
          tone="warning"
          icon={<AlertTriangle className="h-4 w-4" />}
          label={statusLabel("renewing")}
          value={counts.renewing}
        />
        <KpiCard
          tone="danger"
          icon={<XCircle className="h-4 w-4" />}
          label={statusLabel("expired")}
          value={counts.expired}
        />
        <KpiCard
          tone="muted"
          icon={<CircleDashed className="h-4 w-4" />}
          label={statusLabel("missing")}
          value={counts.missing}
        />
      </div>

      {/* Risk & list */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <p className="text-sm font-medium text-muted-foreground">Indicador de risco</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-5xl tracking-tight">{riskPct}%</span>
            <span className="text-sm text-muted-foreground">irregular</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-danger transition-all"
              style={{ width: `${riskPct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {irregular} de {total} licenças exigidas estão expiradas ou pendentes de envio.
          </p>

          <div className="mt-6 space-y-2 border-t border-border pt-4">
            <Row label="Total de licenças exigidas" value={total} />
            <Row label="Em renovação (≤120 dias)" value={counts.renewing} />
            <Row label="Fornecedores monitorados" value={filteredSuppliers.length} />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Atenção imediata</h2>
            <Link
              to="/admin/suppliers"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver fornecedores <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
              Tudo em ordem por aqui. ✅
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {upcoming.map((r) => {
                const days = r.doc ? daysUntil(r.doc.expiryDate) : null;
                return (
                  <li key={`${r.supplier.id}-${r.type?.id}`} className="py-3">
                    <Link
                      to="/admin/suppliers/$supplierId"
                      params={{ supplierId: r.supplier.id }}
                      className="group flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <StatusDot status={r.status} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                            {r.supplier.companyName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.type?.name ?? "Tipo removido"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="hidden text-right sm:block">
                          {r.doc ? (
                            <>
                              <p className="text-sm tabular-nums">{shortDate(r.doc.expiryDate)}</p>
                              <p className="text-xs text-muted-foreground">
                                {days !== null && days < 0
                                  ? `há ${Math.abs(days)} dias`
                                  : `em ${days} dias`}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">sem documento</p>
                          )}
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  tone,
  icon,
  label,
  value,
}: {
  tone: "success" | "warning" | "danger" | "muted";
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const colors = {
    success: "text-success",
    warning: "text-warning-foreground",
    danger: "text-danger",
    muted: "text-muted-foreground",
  }[tone];
  const bg = {
    success: "bg-success/10",
    warning: "bg-warning/15",
    danger: "bg-danger/10",
    muted: "bg-muted",
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${bg} ${colors}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
