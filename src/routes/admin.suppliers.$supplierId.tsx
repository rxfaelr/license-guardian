import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLicenses, useLicenseTypes, useSuppliers } from "@/hooks/use-store";
import { statusFor } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { PdfViewer } from "@/components/PdfViewer";
import { ArrowLeft, Building2, Mail, Phone, MapPin, User2, FileText, Pencil } from "lucide-react";
import { shortDate, daysUntil } from "@/lib/format";
import type { LicenseDocument } from "@/lib/types";
import {
  DeleteSupplierButton,
  SupplierFormDialog,
} from "./admin.suppliers.index";

export const Route = createFileRoute("/admin/suppliers/$supplierId")({
  component: SupplierDetail,
});

function SupplierDetail() {
  const { supplierId } = Route.useParams();
  const navigate = useNavigate();
  const suppliers = useSuppliers();
  const licenses = useLicenses();
  const types = useLicenseTypes();
  const [viewing, setViewing] = useState<LicenseDocument | null>(null);

  const supplier = suppliers.find((s) => s.id === supplierId);

  const rows = useMemo(() => {
    if (!supplier) return [];
    return supplier.requiredLicenseTypeIds
      .map((tid) => {
        const doc = licenses.find((l) => l.supplierId === supplier.id && l.licenseTypeId === tid);
        const type = types.find((t) => t.id === tid);
        return { type, doc, status: statusFor(doc) };
      })
      .sort((a, b) => {
        const order = { expired: 0, missing: 1, renewing: 2, valid: 3 };
        return order[a.status] - order[b.status];
      });
  }, [supplier, licenses, types]);

  if (!supplier) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin/suppliers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">Fornecedor não encontrado.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/suppliers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para fornecedores
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
          <h1 className="font-display text-3xl sm:text-4xl">{supplier.companyName}</h1>
          {supplier.cnpj && <p className="mt-1 text-sm text-muted-foreground">CNPJ {supplier.cnpj}</p>}
        </div>
        <div className="flex items-center gap-2">
          <SupplierFormDialog
            initial={supplier}
            trigger={
              <Button variant="outline">
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            }
          />
          <DeleteSupplierButton
            id={supplier.id}
            name={supplier.companyName}
          />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contato
          </p>
          <ul className="space-y-2 text-sm">
            <Info icon={<Mail className="h-4 w-4" />} value={supplier.email} />
            {supplier.phone && <Info icon={<Phone className="h-4 w-4" />} value={supplier.phone} />}
            {supplier.contactName && <Info icon={<User2 className="h-4 w-4" />} value={supplier.contactName} />}
            {supplier.address && <Info icon={<MapPin className="h-4 w-4" />} value={supplier.address} />}
          </ul>
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resumo
          </p>
          <ul className="space-y-2 text-sm">
            <Info
              icon={<Building2 className="h-4 w-4" />}
              value={`${supplier.requiredLicenseTypeIds.length} licença(s) exigida(s)`}
            />
            <li className="text-xs text-muted-foreground">
              Senha:{" "}
              {supplier.password
                ? "definida pelo fornecedor"
                : "aguardando primeiro acesso"}
            </li>
            <li className="text-xs text-muted-foreground">
              Cadastrado em {shortDate(supplier.createdAt)}
            </li>
          </ul>
        </Card>
      </div>

      <section>
        <h2 className="font-display text-xl mb-3">Licenças</h2>
        {rows.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma licença obrigatória definida. Edite o fornecedor para adicionar.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const days = r.doc ? daysUntil(r.doc.expiryDate) : null;
                return (
                  <li
                    key={r.type?.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{r.type?.name ?? "Tipo removido"}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      {r.doc ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Emissão {shortDate(r.doc.issueDate)} · Vencimento{" "}
                          <span className="font-medium text-foreground">
                            {shortDate(r.doc.expiryDate)}
                          </span>
                          {days !== null && (
                            <span className="ml-2">
                              ({days < 0 ? `há ${Math.abs(days)} dias` : `em ${days} dias`})
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Aguardando envio do fornecedor.
                        </p>
                      )}
                    </div>
                    {r.doc && (
                      <a
                        href={r.doc.fileDataUrl}
                        download={r.doc.fileName}
                        className="inline-flex items-center gap-2 self-start rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary sm:self-auto"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        {r.doc.fileName}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function Info({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span>{value}</span>
    </li>
  );
}
