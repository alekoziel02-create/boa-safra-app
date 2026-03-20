import { Badge } from "@/components/ui/badge";
import type { StatusPlantio } from "@/types";

const STATUS_CONFIG: Record<StatusPlantio, { label: string; variant: "green" | "yellow" | "orange" | "gray" | "purple" | "blue" }> = {
  CULTIVANDO: { label: "Cultivando", variant: "green" },
  COLHENDO: { label: "Colhendo", variant: "yellow" },
  COLHIDO: { label: "Colhido", variant: "orange" },
  FINALIZADO: { label: "Finalizado", variant: "gray" },
  AGUARDANDO: { label: "Aguardando", variant: "purple" },
};

export function StatusBadge({ status }: { status: StatusPlantio | null | undefined }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const cfg = STATUS_CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
