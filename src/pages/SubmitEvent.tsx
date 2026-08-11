import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SubmissionForm from "@/components/SubmissionForm";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * Gate para divulgar evento.
 *
 * Fluxo cadastro base + divulgação:
 * - Admin/Master passam direto: quem cuida da curadoria não pode ficar travado aqui.
 * - Divulgador precisa de nome e WhatsApp no perfil (o bairro do evento é pedido no
 *   próprio formulário, então não trava mais o acesso).
 * - Se faltar algo, mandamos pra /perfil e explicamos.
 * - Se tá completo, o SubmissionForm pré-preenche a seção "Responsável pelo evento"
 *   com esses mesmos dados (ver LegalStep + defaultValues do form).
 */
const SubmitEvent = () => {
  const { profile, loaded } = useProfile();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded || isAdmin) return;
    const missing =
      !(profile.responsible_name && profile.responsible_name.trim()) ||
      !(profile.phone && profile.phone.trim());
    if (missing) {
      toast.info("Antes de divulgar, complete seu cadastro base", {
        description: "A gente precisa do seu nome e WhatsApp pra continuar.",
      });
      navigate("/perfil", { replace: true });
    }
  }, [loaded, isAdmin, profile, navigate]);

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