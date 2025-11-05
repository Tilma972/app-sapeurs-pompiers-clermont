"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export function RoleBadge() {
  const [role, setRole] = useState<string | null>(null);
  const [isChef, setIsChef] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: equipe }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        supabase.from('equipes').select('id').eq('chef_equipe_id', user.id).limit(1).maybeSingle(),
      ]);

      setRole(profile?.role ?? null);
      setIsChef(!!equipe);
    })();
  }, []);

  if (!role && !isChef) return null;

  return (
    <div className="flex flex-wrap gap-2 min-w-0">
      {role && (
        <Badge variant="outline" className="max-w-[70vw] sm:max-w-none truncate">
          Rôle: {role}
        </Badge>
      )}
      {isChef && <Badge variant="secondary">Chef d&apos;équipe</Badge>}
    </div>
  );
}
