import { createClient } from "@/lib/supabase/client";
import type { IntegradoInsert, IntegradoUpdate } from "@/types";

interface IntegradoFilters {
  search?: string;
  safra?: string;
  uf?: string;
  status_plantio?: string;
  tipo_campo?: string;
  page?: number;
  pageSize?: number;
}

export async function getIntegradoList({
  search = "",
  safra = "",
  uf = "",
  status_plantio = "",
  tipo_campo = "",
  page = 1,
  pageSize = 20,
}: IntegradoFilters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("integrado")
    .select("*", { count: "exact" })
    .order("nome_produtor")
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`nome_produtor.ilike.%${search}%,cultivar.ilike.%${search}%,municipio.ilike.%${search}%`);
  }
  if (safra) query = query.eq("safra", safra);
  if (uf) query = query.eq("uf", uf);
  if (status_plantio) query = query.eq("status_plantio", status_plantio);
  if (tipo_campo) query = query.eq("tipo_campo", tipo_campo);

  return query;
}

export async function getIntegradoKpis() {
  const supabase = createClient();
  const query = supabase.from("integrado_kpis").select("*");
  return query.single();
}

export async function getIntegradoFilters() {
  const supabase = createClient();
  const [safras, ufs] = await Promise.all([
    supabase.from("integrado").select("safra").order("safra"),
    supabase.from("integrado").select("uf").order("uf"),
  ]);
  const uniqueSafras = [...new Set(safras.data?.map((r) => r.safra).filter(Boolean))];
  const uniqueUfs = [...new Set(ufs.data?.map((r) => r.uf).filter(Boolean))];
  return { safras: uniqueSafras, ufs: uniqueUfs };
}

export async function createIntegrado(data: IntegradoInsert) {
  const supabase = createClient();
  return supabase.from("integrado").insert(data).select().single();
}

export async function updateIntegrado(id: string, data: IntegradoUpdate) {
  const supabase = createClient();
  return supabase.from("integrado").update(data).eq("id", id).select().single();
}

export async function deleteIntegrado(id: string) {
  const supabase = createClient();
  return supabase.from("integrado").delete().eq("id", id);
}
