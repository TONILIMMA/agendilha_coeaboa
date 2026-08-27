/**
 * Envio dos formulários públicos (link enviado pelo administrador).
 * Não exige login: a função de backend grava o cadastro como "aguardando análise".
 */
export type PublicCadastroKind = "atrativo" | "estabelecimento";

export async function submitPublicCadastro(
  kind: PublicCadastroKind,
  payload: Record<string, unknown>,
): Promise<{ id: string | null }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cadastro-publico`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ kind, ...payload }),
  });

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Não deu pra enviar o cadastro. Tenta de novo.");
  }
  return { id: data.id ?? null };
}
