/**
 * Lista única e padronizada dos bairros atendidos pela plataforma
 * AgendIlha / Coé a Boa. Reutilizada em todos os formulários,
 * validações e filtros. Não duplicar esta lista em outros arquivos.
 */
export const BAIRROS = [
  "Bancários",
  "Cacuia",
  "Cidade Universitária",
  "Cocotá",
  "Freguesia",
  "Galeão",
  "Jardim Carioca",
  "Jardim Guanabara",
  "Moneró",
  "Pitangueiras",
  "Portuguesa",
  "Praia da Bandeira",
  "Ribeira",
  "Tauá",
  "Zumbi",
] as const;

export type Bairro = (typeof BAIRROS)[number];

export const isBairroValido = (v: string): v is Bairro =>
  (BAIRROS as readonly string[]).includes(v);

export const PLACEHOLDER_BAIRRO = "Selecione seu bairro";