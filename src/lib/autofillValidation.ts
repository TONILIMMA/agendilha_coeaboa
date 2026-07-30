/**
 * Validações automáticas do autopreenchimento (local/estabelecimento e atrativo).
 *
 * Rodam em tempo real enquanto o usuário preenche — a ideia é que ele veja e
 * corrija o erro na hora, antes de mandar o evento pra aprovação.
 */
import { validateBrazilianMobile } from "@/lib/whatsapp";
import { isBairroValido } from "@/lib/neighborhoods";

export type AutofillIssue = {
  field: string;
  label: string;
  message: string;
  level: "error" | "warning";
};

export function cepDigits(cep: string | null | undefined) {
  return (cep ?? "").replace(/\D/g, "");
}

export function formatCep(cep: string | null | undefined) {
  const d = cepDigits(cep).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function validateCep(cep: string | null | undefined):
  | { valid: true; digits: string }
  | { valid: false; reason: string } {
  const d = cepDigits(cep);
  if (!d) return { valid: false, reason: "CEP não informado." };
  if (d.length !== 8) return { valid: false, reason: `CEP com ${d.length} dígitos — precisa de 8.` };
  if (/^(\d)\1{7}$/.test(d)) return { valid: false, reason: "CEP inválido (dígitos repetidos)." };
  return { valid: true, digits: d };
}

const LOCAL_TIPOS_VALIDOS = [
  "bar",
  "restaurante",
  "casa_show",
  "praca",
  "clube",
  "espaco_cultural",
  "outro",
];

/** Valida os campos preenchidos automaticamente na etapa de Local. */
export function checkLocationAutofill(v: {
  locationName?: string;
  localTipo?: string;
  addressNeighborhood?: string;
  eventAddress?: string;
  locationCep?: string;
  locationContact?: string;
  locationType?: string;
}): AutofillIssue[] {
  const issues: AutofillIssue[] = [];

  if (!v.locationName?.trim()) {
    issues.push({ field: "locationName", label: "Local", message: "Informe ou cadastre o nome do local.", level: "error" });
  }

  const tipo = (v.localTipo ?? "").trim();
  if (!tipo) {
    issues.push({ field: "localTipo", label: "Tipo de local", message: "Escolha o tipo (bar, praça, clube...).", level: "error" });
  } else if (!LOCAL_TIPOS_VALIDOS.includes(tipo)) {
    issues.push({
      field: "localTipo",
      label: "Tipo de local",
      message: `O cadastro veio com "${tipo}", que não está na lista — selecione o tipo correto.`,
      level: "error",
    });
  }

  const bairro = (v.addressNeighborhood ?? "").trim();
  if (!bairro) {
    issues.push({ field: "addressNeighborhood", label: "Bairro", message: "Selecione o bairro do local.", level: "error" });
  } else if (!isBairroValido(bairro)) {
    issues.push({
      field: "addressNeighborhood",
      label: "Bairro",
      message: `"${bairro}" não está na lista de bairros atendidos — confira.`,
      level: "warning",
    });
  }

  if (!v.eventAddress?.trim()) {
    issues.push({ field: "eventAddress", label: "Endereço", message: "Informe o endereço resumido (rua e número).", level: "error" });
  } else if (v.eventAddress.trim().length < 6) {
    issues.push({ field: "eventAddress", label: "Endereço", message: "Endereço muito curto — inclua rua e número.", level: "warning" });
  }

  if (v.locationCep?.trim()) {
    const cep = validateCep(v.locationCep);
    if (cep.valid === false) {
      issues.push({ field: "locationCep", label: "CEP", message: cep.reason, level: "error" });
    }
  }

  const contato = (v.locationContact ?? "").trim();
  if (contato) {
    const phone = validateBrazilianMobile(contato);
    if (phone.valid === false) {
      issues.push({ field: "locationContact", label: "Contato do local", message: phone.reason, level: "error" });
    }
  } else if (v.locationType === "commercial") {
    issues.push({
      field: "locationContact",
      label: "Contato do local",
      message: "Local comercial precisa de um WhatsApp de contato.",
      level: "error",
    });
  }

  return issues;
}

const CATEGORIAS_VALIDAS = ["musica", "gastronomia", "cultura", "esporte", "turismo", "outros"];

/** Valida os campos preenchidos automaticamente na etapa de Atrativo. */
export function checkAtrativoAutofill(v: {
  atrativoName?: string;
  atrativoContact?: string;
  atrativoEmail?: string;
  atrativoCategory?: string;
}): AutofillIssue[] {
  const issues: AutofillIssue[] = [];

  if (!v.atrativoName?.trim()) {
    issues.push({ field: "atrativoName", label: "Atrativo", message: "Informe ou cadastre o nome do atrativo.", level: "error" });
  }

  const phone = validateBrazilianMobile(v.atrativoContact ?? "");
  if (!v.atrativoContact?.trim()) {
    issues.push({ field: "atrativoContact", label: "WhatsApp do atrativo", message: "Informe o celular do atrativo.", level: "error" });
  } else if (phone.valid === false) {
    issues.push({ field: "atrativoContact", label: "WhatsApp do atrativo", message: phone.reason, level: "error" });
  }

  const email = (v.atrativoEmail ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    issues.push({ field: "atrativoEmail", label: "E-mail do atrativo", message: "E-mail com formato inválido.", level: "error" });
  }

  const cat = (v.atrativoCategory ?? "").trim();
  if (!cat) {
    issues.push({ field: "atrativoCategory", label: "Categoria", message: "Escolha a categoria do atrativo.", level: "error" });
  } else if (!CATEGORIAS_VALIDAS.includes(cat)) {
    issues.push({
      field: "atrativoCategory",
      label: "Categoria",
      message: `O cadastro veio com "${cat}" — selecione uma categoria da lista.`,
      level: "error",
    });
  }

  return issues;
}
