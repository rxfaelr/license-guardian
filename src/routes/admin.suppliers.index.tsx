import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLicenses, useLicenseTypes, useSuppliers } from "@/hooks/use-store";
import {
  deleteSupplier,
  id as makeId,
  statusFor,
  upsertSupplier,
} from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowRight, Plus, Search, Trash2 } from "lucide-react";
import { StatusDot } from "@/components/StatusBadge";
import type { Supplier } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/suppliers/")({
  component: SuppliersPage,
});

function SuppliersPage() {
  const suppliers = useSuppliers();
  const licenses = useLicenses();
  const types = useLicenseTypes();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suppliers
      .filter(
        (s) =>
          !q ||
          s.companyName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.cnpj ?? "").toLowerCase().includes(q),
      )
      .map((s) => {
        const reqs = s.requiredLicenseTypeIds.map((tid) => {
          const doc = licenses.find((l) => l.supplierId === s.id && l.licenseTypeId === tid);
          return statusFor(doc);
        });
        const counts = {
          valid: reqs.filter((r) => r === "valid").length,
          renewing: reqs.filter((r) => r === "renewing").length,
          expired: reqs.filter((r) => r === "expired").length,
          missing: reqs.filter((r) => r === "missing").length,
        };
        const irregular = counts.expired + counts.missing;
        return { supplier: s, counts, irregular, total: reqs.length };
      })
      .sort((a, b) => b.irregular - a.irregular);
  }, [suppliers, query, licenses]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Cadastro</p>
          <h1 className="font-display text-3xl sm:text-4xl">Fornecedores</h1>
        </div>
        <SupplierFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Novo fornecedor
            </Button>
          }
        />
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {types.length === 0 && (
          <Link to="/admin/license-types" className="text-sm text-primary hover:underline">
            Cadastrar tipos de licença →
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum fornecedor encontrado.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ supplier, counts, irregular, total }) => (
            <Card key={supplier.id} className="p-5 hover:shadow-soft transition-shadow">
              <Link
                to="/admin/suppliers/$supplierId"
                params={{ supplierId: supplier.id }}
                className="block"
              >
                <p className="font-display text-lg leading-snug">{supplier.companyName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {supplier.cnpj ?? "Sem CNPJ"} · {supplier.email}
                </p>

                <div className="mt-4 grid grid-cols-4 gap-1 text-center">
                  <Mini count={counts.valid} tone="success" />
                  <Mini count={counts.renewing} tone="warning" />
                  <Mini count={counts.expired} tone="danger" />
                  <Mini count={counts.missing} tone="muted" />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {irregular > 0 ? (
                      <span className="font-medium text-danger">
                        {irregular} pendente{irregular > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="font-medium text-success">Tudo em ordem</span>
                    )}
                    <span className="text-muted-foreground"> · {total} exigidas</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    Detalhes <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Mini({ count, tone }: { count: number; tone: "success" | "warning" | "danger" | "muted" }) {
  const bg = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-danger/10 text-danger",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <div className={`rounded-md py-1.5 text-sm font-semibold tabular-nums ${bg}`}>
      {count}
    </div>
  );
}

export function SupplierFormDialog({
  trigger,
  initial,
  onSaved,
}: {
  trigger: React.ReactNode;
  initial?: Supplier;
  onSaved?: () => void;
}) {
  const types = useLicenseTypes();
  const [open, setOpen] = useState(false);

  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [required, setRequired] = useState<string[]>(initial?.requiredLicenseTypeIds ?? []);

  const reset = () => {
    if (initial) return;
    setCompanyName("");
    setCnpj("");
    setEmail("");
    setPhone("");
    setContactName("");
    setAddress("");
    setRequired([]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios.");
      return;
    }
    const payload: Supplier = {
      id: initial?.id ?? makeId(),
      companyName: companyName.trim(),
      cnpj: cnpj.trim() || undefined,
      email: email.trim(),
      phone: phone.trim() || undefined,
      contactName: contactName.trim() || undefined,
      address: address.trim() || undefined,
      requiredLicenseTypeIds: required,
      password: initial?.password,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    upsertSupplier(payload);
    toast.success(initial ? "Fornecedor atualizado." : "Fornecedor cadastrado.");
    setOpen(false);
    reset();
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar fornecedor" : "Novo fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Defina os dados de contato e quais licenças são obrigatórias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nome da empresa *</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email de acesso *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Responsável</Label>
            <Input
              id="contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Licenças obrigatórias</Label>
            {types.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                Nenhum tipo de licença cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-2 rounded-lg border border-border p-3">
                {types.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-1 hover:bg-secondary/50"
                  >
                    <Checkbox
                      checked={required.includes(t.id)}
                      onCheckedChange={(v) => {
                        if (v) setRequired((r) => [...r, t.id]);
                        else setRequired((r) => r.filter((x) => x !== t.id));
                      }}
                    />
                    <div className="text-sm">
                      <p className="font-medium leading-tight">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSupplierButton({ id, name }: { id: string; name: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10">
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação remove o fornecedor e todas as suas licenças. Não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteSupplier(id);
              toast.success("Fornecedor removido.");
            }}
            className="bg-danger text-danger-foreground hover:bg-danger/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
