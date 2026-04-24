import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, ExternalLink } from "lucide-react";

interface PdfViewerProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  fileDataUrl: string;
  title?: string;
}

export function PdfViewer({ open, onClose, fileName, fileDataUrl, title }: PdfViewerProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-border py-3 pl-5 pr-20 space-y-0">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base font-medium">
              {title ?? fileName}
            </DialogTitle>
            {title && (
              <p className="truncate text-xs text-muted-foreground">{fileName}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={fileDataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-secondary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir
            </a>
            <a
              href={fileDataUrl}
              download={fileName}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <FileDown className="h-3.5 w-3.5" />
              Baixar
            </a>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted">
          <object
            data={fileDataUrl}
            type="application/pdf"
            className="h-full w-full"
            aria-label={fileName}
          >
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não foi possível exibir o PDF neste navegador.
              </p>
              <a href={fileDataUrl} download={fileName}>
                <Button size="sm">
                  <FileDown className="h-4 w-4" />
                  Baixar {fileName}
                </Button>
              </a>
            </div>
          </object>
        </div>
      </DialogContent>
    </Dialog>
  );
}
