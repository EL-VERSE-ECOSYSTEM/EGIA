"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database.types";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user ?? null;
  const role = (user?.user_metadata?.role?.toUpperCase() as UserRole | undefined);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next); setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const extendedUser = user
    ? {
        ...user,
        schoolId: (user.user_metadata?.school_id as string) || (user.user_metadata?.schoolId as string) || '',
        school_id: (user.user_metadata?.school_id as string) || (user.user_metadata?.schoolId as string) || '',
        admin_level: (user.user_metadata?.admin_level as string) || (user.user_metadata?.adminLevel as string) || 'PRIMARY_ADMIN',
        adminLevel: (user.user_metadata?.admin_level as string) || (user.user_metadata?.adminLevel as string) || 'PRIMARY_ADMIN',
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || '',
        teacher_id: (user.user_metadata?.teacher_id as string) || user.id,
        teacherId: (user.user_metadata?.teacher_id as string) || user.id,
      }
    : null;

  return {
    user: extendedUser, session, role, loading,
    signIn: useCallback((email: string, password: string) => createClient().auth.signInWithPassword({ email, password }), []),
    signUp: useCallback((email: string, password: string, metadata: Record<string, unknown> = {}) => createClient().auth.signUp({ email, password, options: { data: metadata } }), []),
    signOut: useCallback(() => createClient().auth.signOut(), []),
    hasRole: useCallback((required: UserRole) => role === required, [role]),
  };
}
