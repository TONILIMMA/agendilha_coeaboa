 import { toast } from "sonner";
 import { PostgrestError } from "@supabase/supabase-js";
 
 export interface AppError extends Error {
   code?: string;
   details?: string;
   hint?: string;
 }
 
 export function handleError(error: unknown, fallbackMessage = "Ocorreu um erro inesperado") {
   console.error("App Error:", error);
 
   let message = fallbackMessage;
   let description = "";
 
   if (error instanceof Error) {
     message = error.message;
   }
 
   // Handle Supabase/Postgrest errors
   if (typeof error === 'object' && error !== null && 'code' in error) {
     const pgError = error as PostgrestError;
     description = pgError.details || pgError.hint || "";
     
     // Common Postgres error codes
     switch (pgError.code) {
       case "23505":
         message = "Este registro já existe.";
         break;
       case "42P01":
         message = "Erro de configuração no banco de dados.";
         break;
       case "PGRST301":
         message = "Sua sessão expirou. Por favor, entre novamente.";
         break;
     }
   }
 
   toast.error(message, {
     description: description || undefined,
   });
 
   return { message, description };
 }