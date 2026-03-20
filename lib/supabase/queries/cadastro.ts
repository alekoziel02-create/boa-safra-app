import { createClient } from "@/lib/supabase/client";
import type { CadastroInsert, CadastroUpdate } from "@/types";

export async function getCadastroList(search = "", page = 1, pageSize = 20) {
  const supabase = createClient();
  let query = supabase
    .from("cadastro")
    .select("*", { count: "exact" })
    .order("nome")
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`nome.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,cidade.ilike.%${search}%`);
  }

  return query;
}

export async function createCadastro(data: CadastroInsert) {
  const supabase = createClient();
  return supabase.from("cadastro").insert(data).select().single();
}

export async function updateCadastro(id: string, data: CadastroUpdate) {
  const supabase = createClient();
  return supabase.from("cadastro").update(data).eq("id", id).select().single();
}

export async function deleteCadastro(id: string) {
  const supabase = createClient();
  return supabase.from("cadastro").delete().eq("id", id);
}

export async function bulkInsertCadastro(rows: CadastroInsert[]) {
  const supabase = createClient();
  return supabase.from("cadastro").insert(rows).select();
}

export async function getCadastroNomes() {
  const supabase = createClient();
  return supabase.from("cadastro").select("id, nome").order("nome");
}
