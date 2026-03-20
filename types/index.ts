export interface Cadastro {
  id: string;
  nome: string;
  codigo_postal: string | null;
  regiao: string | null;
  rua: string | null;
  cidade: string | null;
  bairro: string | null;
  cnpj: string | null;
  cpf: string | null;
  inscricao_estadual: string | null;
  cpf_cnpj: string | null;
  created_at: string;
  updated_at: string;
}

export type CadastroInsert = Omit<Cadastro, "id" | "created_at" | "updated_at">;
export type CadastroUpdate = Partial<CadastroInsert>;

export type StatusPlantio = "CULTIVANDO" | "COLHENDO" | "COLHIDO" | "FINALIZADO" | "AGUARDANDO";

export interface Integrado {
  id: string;
  cod_fornecedor: string | null;
  codigo: string | null;
  codigo_coop: string | null;
  renasem: string | null;
  art: string | null;
  nome_produtor: string | null;
  tipo_contrato: string | null;
  local_beneficiamento: string | null;
  safra: string | null;
  inscricao_estadual: string | null;
  integrado: boolean | null;
  propriedade: string | null;
  municipio: string | null;
  uf: string | null;
  cod_responsavel: string | null;
  responsavel: string | null;
  assistente: string | null;
  cultivar: string | null;
  obtentor: string | null;
  tecnologia: string | null;
  area_ha: number | null;
  meta_ha: number | null;
  area_plantada_ha: number | null;
  diferenca: number | null;
  yield_val: number | null;
  toneladas: number | null;
  status_plantio: StatusPlantio | null;
  tipo_campo: "SEQUEIRO" | "IRRIGADO" | null;
  produtividade_est_ton: number | null;
  status_pedido: string | null;
  numero_pedido: string | null;
  numero_contrato: string | null;
  cultivar_uf: string | null;
  populacao_recomendada: number | null;
  populacao_plantada: number | null;
  volume_calculado_bag: number | null;
  volume_bag: number | null;
  volume_diferenca_bag: number | null;
  tratamento: string | null;
  valor_total: number | null;
  valor_ha: number | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export type IntegradoInsert = Omit<Integrado, "id" | "created_at" | "updated_at">;
export type IntegradoUpdate = Partial<IntegradoInsert>;

export interface IntegradoKpis {
  total: number;
  cultivando: number;
  colhendo: number;
  colhido: number;
  finalizado: number;
  aguardando: number;
  area_total_ha: number;
  prod_est_total_ton: number;
  valor_total_rs: number;
}

export interface Campo {
  id: string;
  codigo_campo: string | null;
  codigo_coop: string | null;
  renasem: string | null;
  produtor: string | null;
  local_beneficiamento: string | null;
  safra: string | null;
  cooperado: string | null;
  cpf_cnpj: string | null;
  propriedade: string | null;
  inscricao_estadual: string | null;
  talhao: string | null;
  tipo: "SEQUEIRO" | "IRRIGADO" | null;
  municipio: string | null;
  uf: string | null;
  responsavel: string | null;
  assistente: string | null;
  cultivar: string | null;
  obtentor: string | null;
  tecnologia: string | null;
  cat_base: string | null;
  cat_inscricao: string | null;
  area_ha: number | null;
  estande_pl_m: number | null;
  cultura_anterior: string | null;
  produtividade_sc60kg: number | null;
  volume_kg: number | null;
  ciclo: number | null;
  data_base: string | null;
  data_plantio_inicio: string | null;
  data_plantio_fim: string | null;
  mes_plantio: string | null;
  semana_plantio: string | null;
  latitude: number | null;
  longitude: number | null;
  prazo_inscricao: string | null;
  prev_florescimento: string | null;
  prev_enchimento: string | null;
  estadio_fenologico: string | null;
  prev_colheita: string | null;
  prev_semana_colheita: string | null;
  situacao: string | null;
  data_colheita: string | null;
  area_colhida_ha: number | null;
  area_descartada_ha: number | null;
  nota: string | null;
  motivo: string | null;
  integrado_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CampoInsert = Omit<Campo, "id" | "created_at" | "updated_at">;
export type CampoUpdate = Partial<CampoInsert>;

export type UserRole = "admin" | "operador" | "visualizador";

export interface AppUser {
  id: string;
  email: string | null;
  nome: string | null;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
}
