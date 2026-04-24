import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  useLicenses,
  useLicenseTypes,
  useSession,
  useSuppliers,
} from "@/hooks/use-store";
import {
  findLicense,
  id as makeId,
  RENEWAL_WINDOW_DAYS,
  statusFor,
  upsertLicense,
} from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { PdfViewer } from "@/components/PdfViewer";
import { FileText, FileUp, ShieldCheck, AlertTriangle, XCircle, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { shortDate, daysUntil } from "@/lib/format";
import type { LicenseDocument, LicenseType } from "@/lib/types";

export const Route = createFileRoute("/supplier/")({
  component: SupplierPortal,
});

function SupplierPortal() {
  const session = useSession();
  const suppliers = useSuppliers();
  const types = useLicenseTypes();
  const licenses = useLicenses();
  const [editing, setEditing] = useState<LicenseType | null>(null);

  const supplier = suppliers.find((s) => s.id === session?.supplierId);

  const rows = useMemo(() => {
    if (!supplier) return [];
    return supplier.requiredLicenseTypeIds
      .map((tid) => {
        const type = types.find((t) => t.id === tid);
        const doc = licenses.find((l) => l.supplierId === supplier.id && l.licenseTypeId === tid);
        return { type, doc, status: statusFor(doc) };
      })
      .filter((r) => r.type)
      .sort((a, b) => {
        const order = { expired: 0, missing: 1, renewing: 2, valid: 3 };
        return order[a.status] - order[b.status];
      });
  }, [supplier, types, licenses]);

  const counts = useMemo(() => {
    return {
      valid: rows.filter((r) => r.status === "valid").length,
      renewing: rows.filter((r) => r.status === "renewing").length,
      expired: rows.filter((r) => r.status === "expired").length,
      missing: rows.filter((r) => r.status === "missing").length,
    };
  }, [rows]);

  if (!supplier) return null;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-muted-foreground">Portal do fornecedor</p>
        <h1 className="font-display text-3xl sm:text-4xl">{supplier.companyName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mantenha suas licenças sempre atualizadas. Você é alertado{" "}
          <span className="font-medium text-foreground">{RENEWAL_WINDOW_DAYS} dias</span> antes do vencimento.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini icon={<ShieldCheck className="h-4 w-4" />} tone="success" label="Válidas" value={counts.valid} />
        <Mini icon={<AlertTriangle className="h-4 w-4" />} tone="warning" label="Renovar em breve" value={counts.renewing} />
        <Mini icon={<XCircle className="h-4 w-4" />} tone="danger" label="Expiradas" value={counts.expired} />
        <Mini icon={<CircleDashed className="h-4 w-4" />} tone="muted" label="Pendentes" value={counts.missing} />
      </div>

      <section>
        <h2 className="font-display text-xl mb-3">Licenças exigidas</h2>
        {rows.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma licença foi exigida para sua empresa ainda.
          </Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => {
              const days = r.doc ? daysUntil(r.doc.expiryDate) : null;
              return (
                <Card key={r.type!.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg leading-tight">{r.type!.name}</h3>
                        <StatusBadge status={r.status} />
                      </div>
                      {r.type!.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{r.type!.description}</p>
                      )}
                      {r.doc ? (
                        <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                          <p className="text-muted-foreground">
                            Emissão:{" "}
                            <span className="text-foreground tabular-nums">{shortDate(r.doc.issueDate)}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Vencimento:{" "}
                            <span className="font-medium text-foreground tabular-nums">
                              {shortDate(r.doc.expiryDate)}
                            </span>
                            {days !== null && (
                              <span className="ml-2 text-xs">
                                ({days < 0 ? `há ${Math.abs(days)} dias` : `em ${days} dias`})
                              </span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Nenhum documento enviado.
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {r.doc && (
                        <a
                          href={r.doc.fileDataUrl}
                          download={r.doc.fileName}
                          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          PDF
                        </a>
                      )}
                      <Button onClick={() => setEditing(r.type!)} size="sm">
                        <FileUp className="h-4 w-4" />
                        {r.doc ? "Substituir" : "Enviar"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <UploadDialog
        open={!!editing}
        type={editing}
        supplierId={supplier.id}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function Mini({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: "success" | "warning" | "danger" | "muted";
  label: string;
  value: number;
}) {
  const c = {
    success: "text-success bg-success/10",
    warning: "text-warning-foreground bg-warning/15",
    danger: "text-danger bg-danger/10",
    muted: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <Card className="p-4">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${c}`}>{icon}</span>
      <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </Card>
  );
}

function UploadDialog({
  open,
  type,
  supplierId,
  onClose,
}: {
  open: boolean;
  type: LicenseType | null;
  supplierId: string;
  onClose: () => void;
}) {
  const existing = type ? findLicense(supplierId, type.id) : undefined;
  const [issueDate, setIssueDate] = useState(existing?.issueDate.slice(0, 10) ?? "");
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate.slice(0, 10) ?? "");
  const [fileName, setFileName] = useState(existing?.fileName ?? "");
  const [fileDataUrl, setFileDataUrl] = useState(existing?.fileDataUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-init when type changes
  useMemoOnTypeChange(type?.id, () => {
    setIssueDate(existing?.issueDate.slice(0, 10) ?? "");
    setExpiryDate(existing?.expiryDate.slice(0, 10) ?? "");
    setFileName(existing?.fileName ?? "");
    setFileDataUrl(existing?.fileDataUrl ?? "");
  });

  if (!type) return null;

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 5 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDate || !expiryDate) return toast.error("Informe as datas.");
    if (new Date(expiryDate) <= new Date(issueDate))
      return toast.error("O vencimento deve ser após a emissão.");
    if (!fileDataUrl || !fileName) return toast.error("Envie o arquivo PDF.");

    const doc: LicenseDocument = {
      id: existing?.id ?? makeId(),
      supplierId,
      licenseTypeId: type.id,
      issueDate: new Date(issueDate).toISOString(),
      expiryDate: new Date(expiryDate).toISOString(),
      fileName,
      fileDataUrl,
      uploadedAt: new Date().toISOString(),
    };
    upsertLicense(doc);
    toast.success("Licença atualizada.");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{type.name}</DialogTitle>
          <DialogDescription>
            {existing ? "Atualize os dados e o arquivo, se necessário." : "Envie o documento e informe as datas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="issue">Data de emissão</Label>
              <Input
                id="issue"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Data de vencimento</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arquivo PDF</Label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 p-6 text-center hover:bg-secondary/60"
            >
              <FileUp className="h-6 w-6 text-muted-foreground" />
              {fileName ? (
                <p className="text-sm font-medium">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Clique ou arraste um PDF</p>
                  <p className="text-xs text-muted-foreground">Máx. 5 MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar licença</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// tiny helper to re-run effect when key changes
function useMemoOnTypeChange(key: string | undefined, fn: () => void) {
  const last = useRef<string | undefined>(undefined);
  if (key !== last.current) {
    last.current = key;
    // schedule micro-task so state updates happen after render
    queueMicrotask(fn);
  }
}
