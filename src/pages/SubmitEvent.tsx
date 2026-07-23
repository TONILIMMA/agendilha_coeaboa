import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SubmissionForm from "@/components/SubmissionForm";
import { useProfile } from "@/hooks/useProfile";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * Gate para divulgar evento.
 *
 * Fluxo cadastro base + divulgação:
 * - Todo usuário precisa ter cadastro base preenchido (nome, WhatsApp e bairro).
 * - Aqui a gente checa esses 3 campos no perfil (`responsible_name`, `phone`, `home_location`).
 * - Se faltar algo, mandamos pra /perfil e explicamos.
 * - Se tá completo, o SubmissionForm pré-preenche a seção "Responsável pelo evento"
 *   com esses mesmos dados (ver LegalStep + defaultValues do form).
 */
const SubmitEvent = () => {
  const { profile, loaded } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) return;
    const missing =
      !(profile.responsible_name && profile.responsible_name.trim()) ||
      !(profile.phone && profile.phone.trim()) ||
      !(profile.home_location && profile.home_location.trim());
    if (missing) {
      toast.info("Antes de divulgar, complete seu cadastro base", {
        description: "A gente precisa do seu nome, WhatsApp e bairro pra continuar.",
      });
      navigate("/perfil", { replace: true });
    }
  }, [loaded, profile, navigate]);

  if (!loaded) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-8">
        <div className="max-w-4xl mx-auto">
          <SubmissionForm />
        </div>
      </main>
    </div>
  );
};

export default SubmitEvent;