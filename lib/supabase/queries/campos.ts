import { createClient } from "@/lib/supabase/client";
import type { CampoInsert, CampoUpdate } from "@/types";

interface CamposFilters {
  search?: string;
  safra?: string;
  uf?: string;
  situacao?: string;
  page?: number;
  pageSize?: number;
}

export async function getCamposList({
  search = "",
  safra = "",
  uf = "",
  situacao = "",
  page = 1,
  pageSize = 20,
}: CamposFilters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("campos")
    .select("*", { count: "exact" })
    .order("produtor")
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`produtor.ilike.%${search}%,propriedade.ilike.%${search}%,municipio.ilike.%${search}%`);
  }
  if (safra) query = query.eq("safra", safra);
  if (uf) query = query.eq("uf", uf);
  if (situacao) query = query.eq("situacao", situacao);

  return query;
}

export async function getCamposWithCoords() {
  const supabase = createClient();
  return supabase
    .from("campos")
    .select("id, produtor, propriedade, municipio, uf, area_ha, cultivar, situacao, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null);
}

export async function createCampo(data: CampoInsert) {
  const supabase = createClient();
  return supabase.from("campos").insert(data).select().single();
}

export async function updateCampo(id: string, data: CampoUpdate) {
  const supabase = createClient();
  return supabase.from("campos").update(data).eq("id", id).select().single();
}

export async function deleteCampo(id: string) {
  const supabase = createClient();
  return supabase.from("campos").delete().eq("id", id);
}

export async function bulkInsertCampos(rows: CampoInsert[]) {
  const supabase = createClient();
  return supabase.from("campos").insert(rows).select();
}
