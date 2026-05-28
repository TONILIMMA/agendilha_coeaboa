import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

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
  console.error("App Error:", error);

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
        message = "Este registro já existe.";
        break;
      case "42P01":
        message = "Erro de configuração no banco de dados.";
        break;
      case "PGRST301":
        message = "Sua sessão expirou. Por favor, entre novamente.";
        break;
      case "42501":
        message = "Você não tem permissão para realizar esta ação.";
        severity = 'warning';
        break;
      case "PGRST116":
        message = "O registro solicitado não foi encontrado.";
        break;
      default:
        message = `Erro no banco de dados (${error.code})`;
    }
  }
  // 3. Handle Auth Errors (Supabase Auth)
  else if (isAuthError(error)) {
    switch (error.message) {
      case "Invalid login credentials":
        message = "WhatsApp ou senha incorretos.";
        break;
      case "User already registered":
        message = "Este WhatsApp já está cadastrado.";
        break;
      case "Phone number not confirmed":
        message = "Por favor, confirme seu número de WhatsApp.";
        break;
      case "Signup disabled":
        message = "O cadastro de novos usuários está temporariamente desativado.";
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
function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error === 'object' && 'code' in error && 'details' in error;
}

/**
 * Type guard for Supabase Auth errors
 */
function isAuthError(error: any): error is { message: string; status?: number } {
  return error && typeof error === 'object' && 'message' in error && !('code' in error);
}
