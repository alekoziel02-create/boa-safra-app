import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatHa = (n: number | null | undefined): string => {
  if (n == null) return "-";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + " ha";
};

export const formatCurrency = (n: number | null | undefined): string => {
  if (n == null) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const formatNumber = (n: number | null | undefined): string => {
  if (n == null) return "-";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
};

export const formatCPF = (s: string | null | undefined): string => {
  if (!s) return "-";
  const clean = s.replace(/\D/g, "");
  if (clean.length !== 11) return s;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatCNPJ = (s: string | null | undefined): string => {
  if (!s) return "-";
  const clean = s.replace(/\D/g, "");
  if (clean.length !== 14) return s;
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export const excelDateToISO = (serial: number | string | null | undefined): string | null => {
  if (serial == null || serial === "") return null;
  const num = typeof serial === "string" ? parseFloat(serial) : serial;
  if (isNaN(num)) return null;
  if (num < 1000) return null; // not a valid serial
  const date = new Date(Date.UTC(1899, 11, 30) + num * 86400000);
  return date.toISOString().split("T")[0];
};
