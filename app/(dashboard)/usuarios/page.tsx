"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserPlus, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AppUser, UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  operador: "Operador",
  visualizador: "Visualizador",
};

const ROLE_BADGE: Record<UserRole, "green" | "blue" | "gray"> = {
  admin: "green",
  operador: "blue",
  visualizador: "gray",
};

export default function UsuariosPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("operador");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const supabase = createClient();
    // Fetch current user (admin user list requires service role key via API route)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUsers([
        {
          id: user.id,
          email: user.email ?? null,
          nome: user.user_metadata?.nome ?? null,
          role: (user.user_metadata?.role as UserRole) ?? "visualizador",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
          confirmed: !!user.confirmed_at,
        },
      ]);
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage("");

    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    if (res.ok) {
      setMessage(`Convite enviado para ${inviteEmail}`);
      setInviteEmail("");
      loadUsers();
    } else {
      const err = await res.json();
      setMessage(`Erro: ${err.error ?? "Não foi possível enviar o convite"}`);
    }
    setInviting(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Users className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500">Gerencie o acesso ao sistema</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Usuários cadastrados</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : (
              <div className="divide-y">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm">
                        {(u.nome ?? u.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {u.nome ?? u.email ?? "Sem nome"}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={ROLE_BADGE[u.role]}>
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {ROLE_LABELS[u.role]}
                      </Badge>
                      <span className={`h-2 w-2 rounded-full ${u.confirmed ? "bg-green-400" : "bg-gray-300"}`} title={u.confirmed ? "Ativo" : "Pendente"} />
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invite Panel */}
        {isAdmin && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Convidar usuário</h2>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="usuario@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="admin">Admin</option>
                  <option value="operador">Operador</option>
                  <option value="visualizador">Visualizador</option>
                </select>
              </div>
              {message && (
                <p className={`text-xs px-3 py-2 rounded-lg ${message.startsWith("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={inviting}
                className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {inviting ? "Enviando..." : "Enviar convite"}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Perfis</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <p><span className="font-medium text-green-700">Admin:</span> Acesso total, gerencia usuários</p>
                <p><span className="font-medium text-blue-700">Operador:</span> Cria e edita registros</p>
                <p><span className="font-medium text-gray-700">Visualizador:</span> Apenas leitura</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
