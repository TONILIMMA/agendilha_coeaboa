import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export interface AppError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

export type ErrorSeverity = "error" | "warning" | "info";

export interface ClassifiedError {
  message: string;
  description?: string;
  severity: ErrorSeverity;
  code?: string;
  status?: number;
}

export interface HandleErrorOptions {
  /** Mensagem exibida quando não conseguimos classificar o erro. */
  fallback?: string;
  /** Não dispara toast — útil quando o erro será exibido inline. */
  silent?: boolean;
  /** Descrição extra opcional (sobrepõe a descrição inferida). */
  description?: string;
  /** Contexto pra facilitar o log (ex: "AdminEvents.approve"). */
  context?: string;
}

/**
 * Classifica um erro em uma mensagem no tom insulano, sem side-effects.
 * Use quando quiser exibir o erro inline ou decidir o próximo passo.
 */
export function classifyError(
  error: unknown,
  fallback = "Deu ruim aqui. Tenta de novo em instantes.",
): ClassifiedError {
  // Ignorados por padrão
  if (isAbortError(error)) {
    return { message: "Operação cancelada.", severity: "info" };
  }

  if (typeof error === "string") {
    return { message: error || fallback, severity: "error" };
  }

  if (isPostgrestError(error)) {
    const description = error.details || error.hint || undefined;
    switch (error.code) {
      case "23505":
        return { message: "Esse já tá cadastrado.", description, severity: "warning", code: error.code };
      case "23503":
        return { message: "Não deu pra salvar — falta um vínculo obrigatório.", description, severity: "warning", code: error.code };
      case "23514":
        return { message: "Algum campo tá fora do padrão. Confere e tenta de novo.", description, severity: "warning", code: error.code };
      case "42P01":
        return { message: "Deu ruim na configuração do sistema.", description, severity: "error", code: error.code };
      case "PGRST301":
        return { message: "Tua sessão expirou. Entra de novo, por favor.", severity: "warning", code: error.code };
      case "42501":
        return { message: "Você não tem permissão pra isso.", description, severity: "warning", code: error.code };
      case "PGRST116":
        return { message: "Não achei esse registro.", severity: "info", code: error.code };
      default:
        return { message: error.message || fallback, description, severity: "error", code: error.code };
    }
  }

  if (isNetworkError(error)) {
    return {
      message: "Sem internet ou o servidor demorou pra responder.",
      description: "Confere tua conexão e tenta de novo.",
      severity: "warning",
    };
  }

  if (isEdgeFunctionError(error)) {
    const status = error.status;
    const remote = error.body?.error || error.body?.message;
    if (status === 401 || status === 403) {
      return { message: "Você não tem permissão pra isso.", severity: "warning", status };
    }
    if (status === 404) {
      return { message: "Não achei o recurso solicitado.", severity: "info", status };
    }
    if (status && status >= 500) {
      return {
        message: "O servidor deu ruim agora. Tenta de novo em instantes.",
        description: remote,
        severity: "error",
        status,
      };
    }
    return { message: remote || fallback, severity: "error", status };
  }

  if (isAuthError(error)) {
    switch (error.message) {
      case "Invalid login credentials":
        return { message: "WhatsApp ou senha não conferem.", severity: "warning" };
      case "User already registered":
        return { message: "Esse WhatsApp já tá cadastrado.", severity: "warning" };
      case "Phone number not confirmed":
        return { message: "Confirma teu WhatsApp pra continuar.", severity: "warning" };
      case "Signup disabled":
        return { message: "O cadastro tá pausado por enquanto.", severity: "info" };
      case "Email rate limit exceeded":
        return { message: "Muitas tentativas. Espera um pouco e tenta de novo.", severity: "warning" };
      case "Invalid OTP":
        return { message: "Código inválido. Confere o WhatsApp e tenta de novo.", severity: "warning" };
      case "Token has expired":
        return { message: "O código expirou. Pede um novo, por favor.", severity: "warning" };
      default:
        return { message: error.message || fallback, severity: "error" };
    }
  }

  if (error instanceof Error) {
    if (error.name === "ZodError") {
      return { 
        message: "Alguns dados não estão no formato correto.", 
        description: "Confere os campos destacados no formulário.",
        severity: "warning" 
      };
    }
    return { message: error.message || fallback, severity: "error" };
  }

  return { message: fallback, severity: "error" };
}

/**
 * Centralized error handler. Logs, classifies and (por padrão) dispara toast.
 */
export function handleError(
  error: unknown,
  fallbackOrOptions: string | HandleErrorOptions = {},
): ClassifiedError {
  const opts: HandleErrorOptions =
    typeof fallbackOrOptions === "string" ? { fallback: fallbackOrOptions } : fallbackOrOptions;

  const classified = classifyError(error, opts.fallback);
  const description = opts.description ?? classified.description;

  // Cancelamentos (usuário fechou o share sheet, request abortado) nunca viram ruído.
  if (isAbortError(error)) return { ...classified, description };

  logger.error(opts.context ? `[${opts.context}]` : "App Error:", {
    message: classified.message,
    code: classified.code,
    status: classified.status,
    raw: error,
  });

  if (opts.silent) return { ...classified, description };

  const toastOpts = description ? { description } : undefined;
  if (classified.severity === "warning") toast.warning(classified.message, toastOpts);
  else if (classified.severity === "info") toast.info(classified.message, toastOpts);
  else toast.error(classified.message, toastOpts);

  return { ...classified, description };
}

/** Retorna só a mensagem amigável — útil pra exibir inline sem toast. */
export function getErrorMessage(error: unknown, fallback?: string): string {
  return classifyError(error, fallback).message;
}

/**
 * Type guard for Supabase PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    'details' in error
  );
}

/**
 * Type guard for Supabase Auth errors
 */
function isAuthError(error: unknown): error is { message: string; status?: number } {
  return (
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    !('code' in error)
  );
}

function isAbortError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    ((error as { name?: string }).name === "AbortError" ||
      (error as { code?: string }).code === "ERR_CANCELED")
  );
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = (error as { message?: string }).message?.toLowerCase() ?? "";
  const name = (error as { name?: string }).name ?? "";
  return (
    name === "TypeError" && (msg.includes("failed to fetch") || msg.includes("networkerror")) ||
    msg.includes("network request failed") ||
    msg.includes("load failed")
  );
}

interface EdgeFunctionErrorLike {
  name?: string;
  status?: number;
  body?: { error?: string; message?: string };
}

function isEdgeFunctionError(error: unknown): error is EdgeFunctionErrorLike {
  if (!error || typeof error !== "object") return false;
  const e = error as EdgeFunctionErrorLike;
  return e.name === "FunctionsHttpError" || e.name === "FunctionsFetchError" || typeof e.status === "number";
}
