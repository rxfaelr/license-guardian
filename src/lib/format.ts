import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function shortDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

export function daysUntil(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return d;
}
