import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (v: unknown, max = 300): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s ? s : null;
};

const normalizePhone = (raw: unknown): string | null => {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  const local = d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
  if (local.length !== 10 && local.length !== 11) return null;
  return `55${local}`;
};

/**
 * Cadastro público por link (sem login):
 *  - kind = "atrativo": artistas, bandas, DJs e demais atrativos
 *  - kind = "estabelecimento": bares, restaurantes, casas de evento
 *
 * Tudo entra como NÃO aprovado, para curadoria do administrador.
 * O usuário externo só envia: não lê nem edita nada depois.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Dados inválidos." }, 400);
    }

    const kind = (body as any).kind;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (kind === "atrativo") {
      const name = clean((body as any).name, 120);
      const category = clean((body as any).category, 80);
      const whatsapp = normalizePhone((body as any).whatsapp);
      if (!name) return json({ error: "Informe o nome do atrativo." }, 400);
      if (!category) return json({ error: "Escolha a categoria do atrativo." }, 400);
      if (!whatsapp) return json({ error: "Informe um WhatsApp válido com DDD." }, 400);

      const categoryOther = clean((body as any).categoryOther, 80);
      const finalCategory = category === "Outros" && categoryOther ? categoryOther : category;

      const { data, error } = await admin
        .from("atrativos")
        .insert({
          name,
          type: finalCategory,
          tipo_atrativo: finalCategory,
          category_other: category === "Outros" ? categoryOther : null,
          style: clean((body as any).style, 120),
          description: clean((body as any).description, 500),
          contact_whatsapp: whatsapp,
          contact_info: whatsapp,
          responsavel_nome: clean((body as any).responsavelNome, 120),
          responsavel_telefone: whatsapp,
          responsavel_email: clean((body as any).email, 255),
          responsavel_redes: clean((body as any).social, 300),
          cidade_regiao: clean((body as any).cidade, 120),
          pais: "Brasil",
          is_approved: false,
        })
        .select("id")
        .maybeSingle();

      if (error) {
        const msg = /bar|restaurante/i.test(error.message)
          ? "Bares e restaurantes devem usar o formulário de estabelecimentos."
          : "Não deu pra concluir o cadastro. Confira os dados e tente de novo.";
        console.error("[cadastro-publico] atrativo", error.message);
        return json({ error: msg }, 400);
      }
      return json({ ok: true, id: data?.id ?? null });
    }

    if (kind === "estabelecimento") {
      const nome = clean((body as any).nome, 120);
      const whatsapp = normalizePhone((body as any).whatsapp);
      const endereco = clean((body as any).endereco, 200);
      if (!nome) return json({ error: "Informe o nome do estabelecimento." }, 400);
      if (!whatsapp) return json({ error: "Informe um WhatsApp válido com DDD." }, 400);
      if (!endereco) return json({ error: "Informe o endereço." }, 400);

      const tipo = clean((body as any).tipo, 80);
      const { data, error } = await admin
        .from("estabelecimentos")
        .insert({
          nome,
          tipo,
          tipos: tipo ? [tipo] : [],
          endereco,
          numero: clean((body as any).numero, 20),
          complemento: clean((body as any).complemento, 80),
          bairro: clean((body as any).bairro, 120),
          cep: clean((body as any).cep, 12),
          contato: whatsapp,
          responsavel_nome: clean((body as any).responsavelNome, 120),
          responsavel_telefone: whatsapp,
          responsavel_email: clean((body as any).email, 255),
          responsavel_redes: clean((body as any).social, 300),
          anotacoes: clean((body as any).observacoes, 500),
          is_approved: false,
        })
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("[cadastro-publico] estabelecimento", error.message);
        return json({ error: "Não deu pra concluir o cadastro. Confira os dados e tente de novo." }, 400);
      }
      return json({ ok: true, id: data?.id ?? null });
    }

    return json({ error: "Tipo de cadastro não reconhecido." }, 400);
  } catch (e) {
    console.error("[cadastro-publico] erro inesperado", e);
    return json({ error: "Erro inesperado. Tenta de novo em instantes." }, 500);
  }
});
