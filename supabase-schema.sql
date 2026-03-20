-- =====================================================
-- BOA SAFRA SEMENTES - Schema SQL para Supabase
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela CADASTRO
CREATE TABLE IF NOT EXISTS cadastro (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                TEXT NOT NULL,
  codigo_postal       TEXT,
  regiao              TEXT,
  rua                 TEXT,
  cidade              TEXT,
  bairro              TEXT,
  cnpj                TEXT,
  cpf                 TEXT,
  inscricao_estadual  TEXT,
  cpf_cnpj            TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cadastro_nome ON cadastro(nome);
CREATE INDEX IF NOT EXISTS idx_cadastro_cpf_cnpj ON cadastro(cpf_cnpj);

-- 3. Enum Status Plantio
DO $$ BEGIN
  CREATE TYPE status_plantio_enum AS ENUM (
    'CULTIVANDO', 'COLHENDO', 'COLHIDO', 'FINALIZADO', 'AGUARDANDO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Tabela INTEGRADO
CREATE TABLE IF NOT EXISTS integrado (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cod_fornecedor            TEXT,
  codigo                    TEXT,
  codigo_coop               TEXT,
  renasem                   TEXT,
  art                       TEXT,
  nome_produtor             TEXT,
  tipo_contrato             TEXT,
  local_beneficiamento      TEXT,
  safra                     TEXT,
  inscricao_estadual        TEXT,
  integrado                 BOOLEAN DEFAULT TRUE,
  propriedade               TEXT,
  municipio                 TEXT,
  uf                        TEXT,
  cod_responsavel           TEXT,
  responsavel               TEXT,
  assistente                TEXT,
  cultivar                  TEXT,
  obtentor                  TEXT,
  tecnologia                TEXT,
  area_ha                   NUMERIC(10,2),
  meta_ha                   NUMERIC(10,2),
  area_plantada_ha          NUMERIC(10,2),
  diferenca                 NUMERIC(10,2),
  yield_val                 NUMERIC(10,2),
  toneladas                 NUMERIC(10,2),
  status_plantio            status_plantio_enum DEFAULT 'AGUARDANDO',
  tipo_campo                TEXT CHECK (tipo_campo IN ('SEQUEIRO', 'IRRIGADO', NULL)),
  produtividade_est_ton     NUMERIC(10,2),
  status_pedido             TEXT,
  numero_pedido             TEXT,
  numero_contrato           TEXT,
  cultivar_uf               TEXT,
  populacao_recomendada     NUMERIC(10,2),
  populacao_plantada        NUMERIC(10,2),
  volume_calculado_bag      NUMERIC(10,2),
  volume_bag                NUMERIC(10,2),
  volume_diferenca_bag      NUMERIC(10,2),
  tratamento                TEXT,
  valor_total               NUMERIC(12,2),
  valor_ha                  NUMERIC(10,2),
  obs                       TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrado_safra ON integrado(safra);
CREATE INDEX IF NOT EXISTS idx_integrado_status ON integrado(status_plantio);
CREATE INDEX IF NOT EXISTS idx_integrado_nome_produtor ON integrado(nome_produtor);
CREATE INDEX IF NOT EXISTS idx_integrado_uf ON integrado(uf);

-- 5. Tabela CAMPOS
CREATE TABLE IF NOT EXISTS campos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_campo          TEXT,
  codigo_coop           TEXT,
  renasem               TEXT,
  produtor              TEXT,
  local_beneficiamento  TEXT,
  safra                 TEXT,
  cooperado             TEXT,
  cpf_cnpj              TEXT,
  propriedade           TEXT,
  inscricao_estadual    TEXT,
  talhao                TEXT,
  tipo                  TEXT CHECK (tipo IN ('SEQUEIRO', 'IRRIGADO', NULL)),
  municipio             TEXT,
  uf                    TEXT,
  responsavel           TEXT,
  assistente            TEXT,
  cultivar              TEXT,
  obtentor              TEXT,
  tecnologia            TEXT,
  cat_base              TEXT,
  cat_inscricao         TEXT,
  area_ha               NUMERIC(10,2),
  estande_pl_m          NUMERIC(10,2),
  cultura_anterior      TEXT,
  produtividade_sc60kg  NUMERIC(10,2),
  volume_kg             NUMERIC(12,2),
  ciclo                 INTEGER,
  data_base             DATE,
  data_plantio_inicio   DATE,
  data_plantio_fim      DATE,
  mes_plantio           TEXT,
  semana_plantio        TEXT,
  latitude              NUMERIC(10,7),
  longitude             NUMERIC(10,7),
  prazo_inscricao       DATE,
  prev_florescimento    DATE,
  prev_enchimento       DATE,
  estadio_fenologico    TEXT,
  prev_colheita         DATE,
  prev_semana_colheita  TEXT,
  situacao              TEXT,
  data_colheita         DATE,
  area_colhida_ha       NUMERIC(10,2),
  area_descartada_ha    NUMERIC(10,2),
  nota                  TEXT,
  motivo                TEXT,
  integrado_id          UUID REFERENCES integrado(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campos_safra ON campos(safra);
CREATE INDEX IF NOT EXISTS idx_campos_uf ON campos(uf);
CREATE INDEX IF NOT EXISTS idx_campos_integrado ON campos(integrado_id);

-- 6. Trigger atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_cadastro_updated_at
  BEFORE UPDATE ON cadastro FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_integrado_updated_at
  BEFORE UPDATE ON integrado FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_campos_updated_at
  BEFORE UPDATE ON campos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. View KPIs para dashboard
CREATE OR REPLACE VIEW integrado_kpis AS
SELECT
  COUNT(*)                                                AS total,
  COUNT(*) FILTER (WHERE status_plantio = 'CULTIVANDO')  AS cultivando,
  COUNT(*) FILTER (WHERE status_plantio = 'COLHENDO')    AS colhendo,
  COUNT(*) FILTER (WHERE status_plantio = 'COLHIDO')     AS colhido,
  COUNT(*) FILTER (WHERE status_plantio = 'FINALIZADO')  AS finalizado,
  COUNT(*) FILTER (WHERE status_plantio = 'AGUARDANDO')  AS aguardando,
  COALESCE(SUM(area_ha), 0)                              AS area_total_ha,
  COALESCE(SUM(produtividade_est_ton), 0)                AS prod_est_total_ton,
  COALESCE(SUM(valor_total), 0)                          AS valor_total_rs
FROM integrado;

-- 8. Row Level Security
ALTER TABLE cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrado ENABLE ROW LEVEL SECURITY;
ALTER TABLE campos ENABLE ROW LEVEL SECURITY;

-- Helper: pega a role do usuário logado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'visualizador'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies: SELECT para todos autenticados
CREATE POLICY "leitura_autenticados" ON cadastro FOR SELECT TO authenticated USING (true);
CREATE POLICY "leitura_autenticados" ON integrado FOR SELECT TO authenticated USING (true);
CREATE POLICY "leitura_autenticados" ON campos FOR SELECT TO authenticated USING (true);

-- Policies: INSERT para admin e operador
CREATE POLICY "escrita_admin_operador" ON cadastro FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'operador'));
CREATE POLICY "escrita_admin_operador" ON integrado FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'operador'));
CREATE POLICY "escrita_admin_operador" ON campos FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'operador'));

-- Policies: UPDATE para admin e operador
CREATE POLICY "edicao_admin_operador" ON cadastro FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'operador'));
CREATE POLICY "edicao_admin_operador" ON integrado FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'operador'));
CREATE POLICY "edicao_admin_operador" ON campos FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'operador'));

-- Policies: DELETE apenas admin
CREATE POLICY "exclusao_admin" ON cadastro FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "exclusao_admin" ON integrado FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "exclusao_admin" ON campos FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- =====================================================
-- PRONTO! Agora preencha .env.local com as credenciais
-- do seu projeto Supabase e inicie com: npm run dev
-- =====================================================
