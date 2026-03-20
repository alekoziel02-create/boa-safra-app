"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getCamposList, createCampo, updateCampo, deleteCampo } from "@/lib/supabase/queries/campos";
import { useAuth } from "@/hooks/useAuth";
import { formatHa } from "@/lib/utils";
import { Map, Plus, Search, Pencil, Trash2, Loader2, Table, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Campo, CampoInsert } from "@/types";

// Dynamic import for Leaflet (SSR disabled)
const CamposMap = dynamic(() => import("@/components/campos/CamposMap"), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center bg-gray-100 rounded-xl animate-pulse text-gray-400 text-sm">Carregando mapa...</div>,
});

const SITUACAO_COLORS: Record<string, string> = {
  "MATURAÇÃO": "bg-yellow-100 text-yellow-800",
  "COLHIDO": "bg-green-100 text-green-800",
  "EM CAMPO": "bg-blue-100 text-blue-800",
  "DESCARTADO": "bg-red-100 text-red-800",
};

const EMPTY_FORM: CampoInsert = {
  codigo_campo: null, codigo_coop: null, renasem: null, produtor: null,
  local_beneficiamento: null, safra: null, cooperado: null, cpf_cnpj: null,
  propriedade: null, inscricao_estadual: null, talhao: null, tipo: null,
  municipio: null, uf: null, responsavel: null, assistente: null, cultivar: null,
  obtentor: null, tecnologia: null, cat_base: null, cat_inscricao: null,
  area_ha: null, estande_pl_m: null, cultura_anterior: null, produtividade_sc60kg: null,
  volume_kg: null, ciclo: null, data_base: null, data_plantio_inicio: null,
  data_plantio_fim: null, mes_plantio: null, semana_plantio: null,
  latitude: null, longitude: null, prazo_inscricao: null, prev_florescimento: null,
  prev_enchimento: null, estadio_fenologico: null, prev_colheita: null,
  prev_semana_colheita: null, situacao: null, data_colheita: null,
  area_colhida_ha: null, area_descartada_ha: null, nota: null, motivo: null,
  integrado_id: null,
};

export default function CamposPage() {
  const { canWrite, isAdmin } = useAuth();
  const [data, setData] = useState<Campo[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "map">("table");
  const [search, setSearch] = useState("");
  const [filterSafra, setFilterSafra] = useState("");
  const [safras, setSafras] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Campo | null>(null);
  const [form, setForm] = useState<CampoInsert>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows, count: total } = await getCamposList({ search, safra: filterSafra, page, pageSize });
    setData(rows ?? []);
    setCount(total ?? 0);

    const uniqueSafras = [...new Set(rows?.map((r: Campo) => r.safra).filter(Boolean) as string[])];
    if (uniqueSafras.length > 0) setSafras(prev => [...new Set([...prev, ...uniqueSafras])]);
    setLoading(false);
  }, [search, filterSafra, page]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: Campo) {
    setEditing(row);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = row;
    setForm(rest);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) await updateCampo(editing.id, form);
    else await createCampo(form);
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteCampo(deleteId);
    setDeleteId(null);
    load();
  }

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Map className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Campos</h1>
            <p className="text-sm text-gray-500">{count} campos cadastrados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === "table" ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <Table className="h-3.5 w-3.5" /> Tabela
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === "map" ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <MapPin className="h-3.5 w-3.5" /> Mapa
            </button>
          </div>
          {canWrite && (
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Novo campo
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar produtor, propriedade, município..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <select value={filterSafra} onChange={e => { setFilterSafra(e.target.value); setPage(1); }} className="px-3 py-2 border border-input rounded-md text-sm bg-background">
          <option value="">Todas as safras</option>
          {safras.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Map View */}
      {view === "map" && (
        <CamposMap campos={data} />
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produtor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Propriedade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Município/UF</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cultivar</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Safra</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Área</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Situação</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Previsão Colheita</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">Coords</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 10 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}</tr>
                )) : data.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Nenhum campo encontrado</td></tr>
                ) : (
                  data.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.produtor ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{row.propriedade ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{[row.municipio, row.uf].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{row.cultivar ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{row.safra ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{formatHa(row.area_ha)}</td>
                      <td className="px-4 py-3">
                        {row.situacao ? (
                          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${SITUACAO_COLORS[row.situacao] ?? "bg-gray-100 text-gray-700"}`}>
                            {row.situacao}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{row.prev_colheita ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {row.latitude && row.longitude ? (
                          <span title={`${row.latitude}, ${row.longitude}`}><MapPin className="h-3.5 w-3.5 text-green-600 mx-auto" /></span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {canWrite && <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil className="h-3.5 w-3.5" /></button>}
                          {isAdmin && <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
              <span>Página {page} de {totalPages} ({count} registros)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar campo" : "Novo campo"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Produtor</label><Input value={form.produtor ?? ""} onChange={e => setForm(f => ({ ...f, produtor: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Propriedade</label><Input value={form.propriedade ?? ""} onChange={e => setForm(f => ({ ...f, propriedade: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Talhão</label><Input value={form.talhao ?? ""} onChange={e => setForm(f => ({ ...f, talhao: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Município</label><Input value={form.municipio ?? ""} onChange={e => setForm(f => ({ ...f, municipio: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">UF</label><Input value={form.uf ?? ""} onChange={e => setForm(f => ({ ...f, uf: e.target.value || null }))} maxLength={2} /></div>
            <div><label className="block text-sm font-medium mb-1">Cultivar</label><Input value={form.cultivar ?? ""} onChange={e => setForm(f => ({ ...f, cultivar: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Safra</label><Input value={form.safra ?? ""} onChange={e => setForm(f => ({ ...f, safra: e.target.value || null }))} placeholder="2025-2026" /></div>
            <div><label className="block text-sm font-medium mb-1">Área (ha)</label><Input type="number" value={form.area_ha ?? ""} onChange={e => setForm(f => ({ ...f, area_ha: e.target.value ? parseFloat(e.target.value) : null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={form.tipo ?? ""} onChange={e => setForm(f => ({ ...f, tipo: (e.target.value || null) as "SEQUEIRO" | "IRRIGADO" | null }))} className="w-full px-3 py-2 border border-input rounded-md text-sm">
                <option value="">Selecione</option>
                <option value="SEQUEIRO">SEQUEIRO</option>
                <option value="IRRIGADO">IRRIGADO</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Situação</label><Input value={form.situacao ?? ""} onChange={e => setForm(f => ({ ...f, situacao: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Data Plantio Início</label><Input type="date" value={form.data_plantio_inicio ?? ""} onChange={e => setForm(f => ({ ...f, data_plantio_inicio: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Previsão Colheita</label><Input type="date" value={form.prev_colheita ?? ""} onChange={e => setForm(f => ({ ...f, prev_colheita: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Latitude</label><Input type="number" step="0.000001" value={form.latitude ?? ""} onChange={e => setForm(f => ({ ...f, latitude: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="-22.123456" /></div>
            <div><label className="block text-sm font-medium mb-1">Longitude</label><Input type="number" step="0.000001" value={form.longitude ?? ""} onChange={e => setForm(f => ({ ...f, longitude: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="-51.123456" /></div>
            <div><label className="block text-sm font-medium mb-1">Responsável</label><Input value={form.responsavel ?? ""} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Assistente</label><Input value={form.assistente ?? ""} onChange={e => setForm(f => ({ ...f, assistente: e.target.value || null }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Tem certeza que deseja excluir este campo?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
