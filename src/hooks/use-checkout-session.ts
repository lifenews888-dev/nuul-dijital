"use client";

import { useCallback, useEffect, useState } from "react";

export type CheckoutSessionUser = {
  id: string;
  email: string;
  name: string | null;
};

type SessionResponse = {
  authenticated?: boolean;
  user?: CheckoutSessionUser;
};

export function useCheckoutSession(open: boolean) {
  const [state, setState] = useState<"loading" | "guest" | "authed">("loading");
  const [user, setUser] = useState<CheckoutSessionUser | null>(null);

  const reload = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/app/session");
      const data = (await res.json()) as SessionResponse;
      if (data.authenticated && data.user) {
        setUser(data.user);
        setState("authed");
      } else {
        setUser(null);
        setState("guest");
      }
    } catch {
      setUser(null);
      setState("guest");
    }
  }, []);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  return { state, user, reload };
}