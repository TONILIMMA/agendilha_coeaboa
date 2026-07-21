import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export interface AppError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

/**
 * Centralized error handler for the application.
 * Categorizes errors and provides user-friendly feedback via toasts.
 */
export function handleError(error: unknown, fallbackMessage = "Ocorreu um erro inesperado") {
  logger.error("App Error:", error);

  let message = fallbackMessage;
  let description = "";
  let severity: 'error' | 'warning' | 'info' = 'error';

  // 1. Handle string errors
  if (typeof error === 'string') {
    message = error;
  } 
  // 2. Handle Supabase/Postgrest errors
  else if (isPostgrestError(error)) {
    description = error.details || error.hint || "";
    
    switch (error.code) {
      case "23505":
        message = "Esse já tá cadastrado.";
        break;
      case "42P01":
        message = "Deu ruim na configuração do sistema.";
        break;
      case "PGRST301":
        message = "Sua sessão expirou. Entra de novo, por favor.";
        break;
      case "42501":
        message = "Você não tem permissão pra isso.";
        severity = 'warning';
        break;
      case "PGRST116":
        message = "Não achei esse registro.";
        break;
      default:
        message = fallbackMessage;
    }
  }
  // 3. Handle Auth Errors (Supabase Auth)
  else if (isAuthError(error)) {
    switch (error.message) {
      case "Invalid login credentials":
        message = "WhatsApp ou senha não conferem.";
        break;
      case "User already registered":
        message = "Esse WhatsApp já tá cadastrado.";
        break;
      case "Phone number not confirmed":
        message = "Confirma teu WhatsApp pra continuar.";
        break;
      case "Signup disabled":
        message = "O cadastro tá pausado por enquanto.";
        break;
      default:
        message = error.message;
    }
  }
  // 4. Handle Standard Errors
  else if (error instanceof Error) {
    message = error.message;
  }

  // Prevent duplicate toast if message is empty or generic and we have a better fallback
  if (!message || message === "[object Object]") {
    message = fallbackMessage;
  }

  // Display toast
  if (severity === 'error') {
    toast.error(message, { description: description || undefined });
  } else if (severity === 'warning') {
    toast.warning(message, { description: description || undefined });
  } else {
    toast.info(message, { description: description || undefined });
  }

  return { message, description, severity };
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
