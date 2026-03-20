"use client";

import { useCallback, useEffect, useState } from "react";
import { getCadastroList, createCadastro, updateCadastro, deleteCadastro } from "@/lib/supabase/queries/cadastro";
import { useAuth } from "@/hooks/useAuth";
import { formatCPF, formatCNPJ } from "@/lib/utils";
import { ClipboardList, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cadastro, CadastroInsert } from "@/types";

const EMPTY: CadastroInsert = {
  nome: "", codigo_postal: null, regiao: null, rua: null,
  cidade: null, bairro: null, cnpj: null, cpf: null,
  inscricao_estadual: null, cpf_cnpj: null,
};

export default function CadastroPage() {
  const { canWrite, isAdmin } = useAuth();
  const [data, setData] = useState<Cadastro[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Cadastro | null>(null);
  const [form, setForm] = useState<CadastroInsert>(EMPTY);
  const [saving, setSaving] = useState(false);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows, count: total } = await getCadastroList(search, page, pageSize);
    setData(rows ?? []);
    setCount(total ?? 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(row: Cadastro) {
    setEditing(row);
    setForm({ nome: row.nome, codigo_postal: row.codigo_postal, regiao: row.regiao, rua: row.rua, cidade: row.cidade, bairro: row.bairro, cnpj: row.cnpj, cpf: row.cpf, inscricao_estadual: row.inscricao_estadual, cpf_cnpj: row.cpf_cnpj });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await updateCadastro(editing.id, form);
    } else {
      await createCadastro(form);
    }
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteCadastro(deleteId);
    setDeleteId(null);
    load();
  }

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <ClipboardList className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cadastro</h1>
            <p className="text-sm text-gray-500">{count} produtores cadastrados</p>
          </div>
        </div>
        {canWrite && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Novo cadastro
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">CPF/CNPJ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">UF</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Insc. Estadual</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.nome}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {row.cpf_cnpj ? (row.cpf_cnpj.replace(/\D/g, "").length === 11 ? formatCPF(row.cpf_cnpj) : formatCNPJ(row.cpf_cnpj)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.cidade ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.regiao ? <Badge variant="outline">{row.regiao}</Badge> : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.inscricao_estadual ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {canWrite && (
                          <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
            <span>Página {page} de {totalPages} ({count} registros)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cadastro" : "Novo cadastro"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF</label>
              <Input value={form.cpf ?? ""} onChange={e => setForm(f => ({ ...f, cpf: e.target.value || null }))} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <Input value={form.cnpj ?? ""} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value || null }))} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF/CNPJ</label>
              <Input value={form.cpf_cnpj ?? ""} onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value || null }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inscrição Estadual</label>
              <Input value={form.inscricao_estadual ?? ""} onChange={e => setForm(f => ({ ...f, inscricao_estadual: e.target.value || null }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <Input value={form.cidade ?? ""} onChange={e => setForm(f => ({ ...f, cidade: e.target.value || null }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">UF</label>
              <Input value={form.regiao ?? ""} onChange={e => setForm(f => ({ ...f, regiao: e.target.value || null }))} maxLength={2} placeholder="SP" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Rua</label>
              <Input value={form.rua ?? ""} onChange={e => setForm(f => ({ ...f, rua: e.target.value || null }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bairro</label>
              <Input value={form.bairro ?? ""} onChange={e => setForm(f => ({ ...f, bairro: e.target.value || null }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CEP</label>
              <Input value={form.codigo_postal ?? ""} onChange={e => setForm(f => ({ ...f, codigo_postal: e.target.value || null }))} placeholder="00000-000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nome}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Tem certeza que deseja excluir este cadastro? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
