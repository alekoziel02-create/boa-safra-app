"use client";

import { useCallback, useEffect, useState } from "react";
import { getIntegradoList, createIntegrado, updateIntegrado, deleteIntegrado } from "@/lib/supabase/queries/integrado";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatHa, formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/integrado/StatusBadge";
import {
  LayoutDashboard, Plus, Search, Pencil, Trash2, Loader2,
  Wheat, Tractor, CheckCircle2, Clock, BarChart3, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Integrado, IntegradoInsert, IntegradoKpis, StatusPlantio } from "@/types";

const STATUS_OPTIONS: StatusPlantio[] = ["CULTIVANDO", "COLHENDO", "COLHIDO", "FINALIZADO", "AGUARDANDO"];
const TIPO_OPTIONS = ["SEQUEIRO", "IRRIGADO"];

const EMPTY_FORM: IntegradoInsert = {
  cod_fornecedor: null, codigo: null, codigo_coop: null, renasem: null, art: null,
  nome_produtor: null, tipo_contrato: null, local_beneficiamento: null, safra: null,
  inscricao_estadual: null, integrado: true, propriedade: null, municipio: null, uf: null,
  cod_responsavel: null, responsavel: null, assistente: null, cultivar: null, obtentor: null,
  tecnologia: null, area_ha: null, meta_ha: null, area_plantada_ha: null, diferenca: null,
  yield_val: null, toneladas: null, status_plantio: "AGUARDANDO", tipo_campo: null,
  produtividade_est_ton: null, status_pedido: null, numero_pedido: null, numero_contrato: null,
  cultivar_uf: null, populacao_recomendada: null, populacao_plantada: null,
  volume_calculado_bag: null, volume_bag: null, volume_diferenca_bag: null,
  tratamento: null, valor_total: null, valor_ha: null, obs: null,
};

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegradoPage() {
  const { canWrite, isAdmin } = useAuth();
  const [data, setData] = useState<Integrado[]>([]);
  const [count, setCount] = useState(0);
  const [kpis, setKpis] = useState<IntegradoKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSafra, setFilterSafra] = useState("");
  const [safras, setSafras] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Integrado | null>(null);
  const [form, setForm] = useState<IntegradoInsert>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [listResult, kpiResult, safraResult] = await Promise.all([
      getIntegradoList({ search, status_plantio: filterStatus, safra: filterSafra, page, pageSize }),
      supabase.from("integrado_kpis").select("*").single(),
      supabase.from("integrado").select("safra").order("safra"),
    ]);

    setData(listResult.data ?? []);
    setCount(listResult.count ?? 0);
    setKpis(kpiResult.data ?? null);

    const uniqueSafras = [...new Set(safraResult.data?.map((r: { safra: string | null }) => r.safra).filter(Boolean) as string[])];
    setSafras(uniqueSafras);
    setLoading(false);
  }, [search, filterStatus, filterSafra, page]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: Integrado) {
    setEditing(row);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = row;
    setForm(rest);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) await updateIntegrado(editing.id, form);
    else await createIntegrado(form);
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteIntegrado(deleteId);
    setDeleteId(null);
    load();
  }

  const pieData = kpis ? [
    { name: "Cultivando", value: kpis.cultivando, color: "#16a34a" },
    { name: "Colhendo", value: kpis.colhendo, color: "#ca8a04" },
    { name: "Colhido", value: kpis.colhido, color: "#ea580c" },
    { name: "Finalizado", value: kpis.finalizado, color: "#6b7280" },
    { name: "Aguardando", value: kpis.aguardando, color: "#9333ea" },
  ].filter(d => d.value > 0) : [];

  const cultivarData = data
    .filter(r => r.cultivar && r.area_ha)
    .reduce((acc, r) => {
      const existing = acc.find(a => a.cultivar === r.cultivar);
      if (existing) existing.area += r.area_ha!;
      else acc.push({ cultivar: r.cultivar!, area: r.area_ha! });
      return acc;
    }, [] as { cultivar: string; area: number }[])
    .sort((a, b) => b.area - a.area)
    .slice(0, 8);

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <LayoutDashboard className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Integrado</h1>
            <p className="text-sm text-gray-500">Dashboard de produção</p>
          </div>
        </div>
        {canWrite && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Novo integrado
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <KpiCard label="Total" value={kpis?.total ?? 0} icon={BarChart3} color="bg-blue-100 text-blue-700" />
            <KpiCard label="Cultivando" value={kpis?.cultivando ?? 0} icon={Wheat} color="bg-green-100 text-green-700" />
            <KpiCard label="Colhendo" value={kpis?.colhendo ?? 0} icon={Tractor} color="bg-yellow-100 text-yellow-700" />
            <KpiCard label="Colhido" value={kpis?.colhido ?? 0} icon={CheckCircle2} color="bg-orange-100 text-orange-700" />
            <KpiCard label="Finalizado" value={kpis?.finalizado ?? 0} icon={CheckCircle2} color="bg-gray-100 text-gray-700" />
            <KpiCard label="Aguardando" value={kpis?.aguardando ?? 0} icon={Clock} color="bg-purple-100 text-purple-700" />
            <KpiCard label="Área Total" value={formatHa(kpis?.area_total_ha ?? 0)} icon={TrendingUp} color="bg-teal-100 text-teal-700" />
            <KpiCard label="Prod. Est." value={`${formatNumber(kpis?.prod_est_total_ton ?? 0)} ton`} icon={BarChart3} color="bg-indigo-100 text-indigo-700" />
          </>
        )}
      </div>

      {/* Charts */}
      {!loading && (pieData.length > 0 || cultivarData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Área por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={undefined} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {cultivarData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Área por Cultivar (ha)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cultivarData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="cultivar" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={undefined} />
                    <Bar dataKey="area" fill="#16a34a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar produtor, cultivar, município..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <select value={filterSafra} onChange={e => { setFilterSafra(e.target.value); setPage(1); }} className="px-3 py-2 border border-input rounded-md text-sm bg-background">
          <option value="">Todas as safras</option>
          {safras.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-input rounded-md text-sm bg-background">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Produtor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Safra</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cultivar</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Município/UF</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Área</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}</tr>
              )) : data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Nenhum registro encontrado</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.nome_produtor ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{row.safra ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{row.cultivar ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{[row.municipio, row.uf].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{formatHa(row.area_ha)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status_plantio} /></td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums text-xs">{formatCurrency(row.valor_total)}</td>
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar integrado" : "Novo integrado"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nome Produtor</label><Input value={form.nome_produtor ?? ""} onChange={e => setForm(f => ({ ...f, nome_produtor: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Safra</label><Input value={form.safra ?? ""} onChange={e => setForm(f => ({ ...f, safra: e.target.value || null }))} placeholder="2025-2026" /></div>
            <div><label className="block text-sm font-medium mb-1">Cultivar</label><Input value={form.cultivar ?? ""} onChange={e => setForm(f => ({ ...f, cultivar: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Propriedade</label><Input value={form.propriedade ?? ""} onChange={e => setForm(f => ({ ...f, propriedade: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Município</label><Input value={form.municipio ?? ""} onChange={e => setForm(f => ({ ...f, municipio: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">UF</label><Input value={form.uf ?? ""} onChange={e => setForm(f => ({ ...f, uf: e.target.value || null }))} maxLength={2} placeholder="SP" /></div>
            <div><label className="block text-sm font-medium mb-1">Área (ha)</label><Input type="number" value={form.area_ha ?? ""} onChange={e => setForm(f => ({ ...f, area_ha: e.target.value ? parseFloat(e.target.value) : null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Status Plantio</label>
              <select value={form.status_plantio ?? "AGUARDANDO"} onChange={e => setForm(f => ({ ...f, status_plantio: e.target.value as StatusPlantio }))} className="w-full px-3 py-2 border border-input rounded-md text-sm">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Tipo Campo</label>
              <select value={form.tipo_campo ?? ""} onChange={e => setForm(f => ({ ...f, tipo_campo: (e.target.value || null) as "SEQUEIRO" | "IRRIGADO" | null }))} className="w-full px-3 py-2 border border-input rounded-md text-sm">
                <option value="">Selecione</option>
                {TIPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Responsável</label><Input value={form.responsavel ?? ""} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value || null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Valor Total (R$)</label><Input type="number" value={form.valor_total ?? ""} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value ? parseFloat(e.target.value) : null }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Prod. Est. (ton)</label><Input type="number" value={form.produtividade_est_ton ?? ""} onChange={e => setForm(f => ({ ...f, produtividade_est_ton: e.target.value ? parseFloat(e.target.value) : null }))} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Observações</label><textarea value={form.obs ?? ""} onChange={e => setForm(f => ({ ...f, obs: e.target.value || null }))} rows={3} className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" /></div>
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
          <p className="text-sm text-gray-600">Tem certeza que deseja excluir este registro?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
