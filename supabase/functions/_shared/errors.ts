// Utilitários compartilhados de erro/resposta pra edge functions.
// Mantém shape consistente: { error: string, code?, details? } com CORS.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export interface ErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

export function jsonOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function jsonError(
  message: string,
  status = 500,
  extra?: { code?: string; details?: unknown },
): Response {
  const body: ErrorBody = { error: message, ...extra };
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

/**
 * Envelope padrão: trata OPTIONS, captura erros, loga com contexto e devolve
 * JSON consistente. O handler recebe o Request e retorna a resposta OK.
 */
export function withErrorHandling(
  name: string,
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const preflight = handleOptions(req);
    if (preflight) return preflight;

    try {
      return await handler(req);
    } catch (err) {
      const e = err as { status?: number; message?: string; code?: string };
      const status = typeof e?.status === "number" ? e.status : 500;
      const message = e?.message || "Erro interno";
      console.error(`[${name}] error`, { status, message, code: e?.code, err });
      return jsonError(message, status, { code: e?.code });
    }
  };
}

/** Erro tipado que preserva status HTTP através do withErrorHandling. */
export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "HttpError";
  }
}