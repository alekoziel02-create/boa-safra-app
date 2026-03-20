"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("visualizador");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      const r = (user?.user_metadata?.role as UserRole) ?? "visualizador";
      setRole(r);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      const r = (session?.user?.user_metadata?.role as UserRole) ?? "visualizador";
      setRole(r);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    canWrite: role === "admin" || role === "operador",
  };
}
