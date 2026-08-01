import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper único para chamadas a edge functions.
 * - Resgata sessão atual (renovando se necessário).
 * - Envia Authorization + apikey.
 * - Faz parse JSON com fallback.
 * - Lança erro tipado com `status`.
 */
export class EdgeFunctionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "EdgeFunctionError";
  }
}

export async function callEdge<TResp = unknown>(
  name: string,
  body?: unknown,
  init?: { method?: "POST" | "GET"; signal?: AbortSignal },
): Promise<TResp> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new EdgeFunctionError("Sessão expirada. Faça login novamente.", 401);
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: init?.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: init?.signal,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
  }

  if (!res.ok) {
    const payload = (data ?? {}) as { error?: string; message?: string };
    const message = payload.error || payload.message || `Erro ${res.status} ao chamar ${name}`;
    throw new EdgeFunctionError(message, res.status);
  }

  return data as TResp;
}