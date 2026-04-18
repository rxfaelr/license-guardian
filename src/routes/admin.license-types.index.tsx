import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLicenseTypes } from "@/hooks/use-store";
import {
  deleteLicenseType,
  id as makeId,
  upsertLicenseType,
} from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { LicenseType } from "@/lib/types";

export const Route = createFileRoute("/admin/license-types/")({
  component: LicenseTypesPage,
});

function LicenseTypesPage() {
  const types = useLicenseTypes();

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Catálogo</p>
          <h1 className="font-display text-3xl sm:text-4xl">Tipos de Licença</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Cadastre as licenças e certificações que você exige dos seus fornecedores.
            Depois, associe-as a cada um deles.
          </p>
        </div>
        <TypeDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Novo tipo
            </Button>
          }
        />
      </header>

      {types.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum tipo de licença cadastrado ainda.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {types.map((t) => (
            <Card key={t.id} className="p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight">{t.name}</p>
                {t.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <TypeDialog
                  initial={t}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-danger hover:text-danger hover:bg-danger/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir “{t.name}”?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O tipo será removido de todos os fornecedores e os documentos enviados serão apagados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteLicenseType(t.id);
                          toast.success("Tipo removido.");
                        }}
                        className="bg-danger text-danger-foreground hover:bg-danger/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TypeDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: LicenseType;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar tipo de licença" : "Novo tipo de licença"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return toast.error("Informe um nome.");
            upsertLicenseType({
              id: initial?.id ?? makeId(),
              name: name.trim(),
              description: description.trim() || undefined,
              createdAt: initial?.createdAt ?? new Date().toISOString(),
            });
            toast.success(initial ? "Tipo atualizado." : "Tipo cadastrado.");
            setOpen(false);
            if (!initial) {
              setName("");
              setDescription("");
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Licença Ambiental de Operação (LO)"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
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
