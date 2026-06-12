import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WizardShell } from "@/components/registration/WizardShell";
import { FormField, FormTextarea } from "@/components/registration/FormField";
import { NeighborhoodSelect } from "@/components/registration/NeighborhoodSelect";
import { isBairroValido } from "@/lib/neighborhoods";
import {
  isCpfValido,
  isWhatsappValido,
  maskCpf,
  maskPhone,
  saveDivulgador,
} from "@/lib/registration";
import { handleError } from "@/lib/error-handler";

const TOTAL = 3;

export default function CadastroDivulgador() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [instagram, setInstagram] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!nome.trim() || nome.trim().length < 3)
        e.nome = "Informe seu nome completo.";
      if (!isWhatsappValido(whatsapp))
        e.whatsapp = "WhatsApp inválido. Use DDD + número.";
    }
    if (s === 2) {
      if (!isCpfValido(cpf)) e.cpf = "CPF inválido.";
      if (!endereco.trim() || endereco.trim().length < 5)
        e.endereco = "Informe seu endereço.";
      if (!isBairroValido(bairro)) e.bairro = "Selecione um bairro.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (step < TOTAL) {
      if (validate(step)) setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      await saveDivulgador({
        nome,
        whatsapp,
        cpf,
        endereco,
        bairro,
        nome_projeto: nomeProjeto,
        instagram,
        observacoes,
      });
      navigate("/cadastro/sucesso?perfil=divulgador", { replace: true });
    } catch (err) {
      handleError(err, "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardShell
      title={
        step === 1
          ? "Comece o seu cadastro"
          : step === 2
            ? "Documento e endereço"
            : "Seu projeto (opcional)"
      }
      subtitle={
        step === 1
          ? "Esses dados serão reaproveitados ao divulgar eventos."
          : step === 2
            ? "Precisamos para validar quem está divulgando."
            : "Conte um pouco mais sobre o seu projeto."
      }
      step={step}
      totalSteps={TOTAL}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={handleNext}
      loading={loading}
      isLast={step === TOTAL}
      nextLabel={step === TOTAL ? "Concluir cadastro" : "Continuar"}
    >
      {step === 1 && (
        <>
          <FormField
            id="nome"
            label="Nome completo"
            value={nome}
            onChange={setNome}
            placeholder="Seu nome completo"
            required
            error={errors.nome}
          />
          <FormField
            id="whatsapp"
            label="WhatsApp"
            value={whatsapp}
            onChange={(v) => setWhatsapp(maskPhone(v))}
            placeholder="(21) 99999-9999"
            inputMode="tel"
            maxLength={15}
            required
            error={errors.whatsapp}
          />
        </>
      )}

      {step === 2 && (
        <>
          <FormField
            id="cpf"
            label="CPF"
            value={cpf}
            onChange={(v) => setCpf(maskCpf(v))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
            required
            error={errors.cpf}
          />
          <FormField
            id="endereco"
            label="Endereço"
            value={endereco}
            onChange={setEndereco}
            placeholder="Rua, número, complemento"
            required
            error={errors.endereco}
          />
          <NeighborhoodSelect
            value={bairro}
            onChange={setBairro}
            error={errors.bairro}
          />
        </>
      )}

      {step === 3 && (
        <>
          <FormField
            id="projeto"
            label="Nome do projeto, marca ou agência"
            value={nomeProjeto}
            onChange={setNomeProjeto}
            placeholder="Opcional"
          />
          <FormField
            id="ig"
            label="Instagram"
            value={instagram}
            onChange={setInstagram}
            placeholder="@seuperfil"
          />
          <FormTextarea
            id="obs"
            label="Observações"
            value={observacoes}
            onChange={setObservacoes}
            placeholder="Algo que devemos saber? (opcional)"
            rows={3}
            maxLength={500}
          />
        </>
      )}
    </WizardShell>
  );
}