"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  ClipboardList,
  LayoutDashboard,
  Map,
  ChevronDown,
  LogOut,
  Sprout,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  {
    label: "USUÁRIOS",
    href: "/usuarios",
    icon: Users,
  },
  {
    label: "DADOS",
    icon: Sprout,
    children: [
      { label: "CADASTRO", href: "/dados/cadastro", icon: ClipboardList },
      { label: "INTEGRADO", href: "/dados/integrado", icon: LayoutDashboard },
      { label: "CAMPOS", href: "/dados/campos", icon: Map },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [dadosOpen, setDadosOpen] = useState(
    pathname.startsWith("/dados")
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-400/20">
          <Sprout className="h-5 w-5 text-green-300" />
        </div>
        <div>
          <p className="text-xs font-bold text-green-300 leading-none">BOA SAFRA</p>
          <p className="text-[10px] text-green-400/70 leading-none mt-0.5">SEMENTES</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setDadosOpen(!dadosOpen)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", dadosOpen && "rotate-180")}
                  />
                </button>
                {dadosOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          pathname === child.href
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-400/20 text-green-300 text-sm font-bold">
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-sidebar-foreground">
              {user?.user_metadata?.nome ?? user?.email ?? "Usuário"}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">
              {user?.user_metadata?.role ?? "visualizador"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
