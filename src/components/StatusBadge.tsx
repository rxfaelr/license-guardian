import { cn } from "@/lib/utils";
import type { LicenseStatus } from "@/lib/types";
import { statusLabel } from "@/lib/storage";
import { CheckCircle2, AlertTriangle, XCircle, CircleDashed } from "lucide-react";

const styles: Record<LicenseStatus, string> = {
  valid: "bg-success/10 text-success border-success/30",
  renewing: "bg-warning/15 text-warning-foreground border-warning/40",
  expired: "bg-danger/10 text-danger border-danger/30",
  missing: "bg-muted text-muted-foreground border-border",
};

const Icon = {
  valid: CheckCircle2,
  renewing: AlertTriangle,
  expired: XCircle,
  missing: CircleDashed,
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: LicenseStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const I = Icon[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      {showIcon && <I className="h-3.5 w-3.5" />}
      {statusLabel(status)}
    </span>
  );
}

export function StatusDot({ status }: { status: LicenseStatus }) {
  const color = {
    valid: "bg-success",
    renewing: "bg-warning",
    expired: "bg-danger",
    missing: "bg-muted-foreground/40",
  }[status];
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}
