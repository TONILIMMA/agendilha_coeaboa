
-- =====================================================================
-- SEC-04: CPF deixa de ser armazenado em plaintext
-- =====================================================================

-- 1. Schema privado para guardar o pepper (chave secreta do HMAC)
CREATE SCHEMA IF NOT EXISTS private_crypto;
REVOKE ALL ON SCHEMA private_crypto FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private_crypto.config (
  id int PRIMARY KEY DEFAULT 1,
  cpf_pepper text NOT NULL,
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Insere um pepper aleatório se ainda não existir
INSERT INTO private_crypto.config (id, cpf_pepper)
VALUES (1, encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (id) DO NOTHING;

REVOKE ALL ON private_crypto.config FROM PUBLIC, anon, authenticated;

-- 2. Função privada que computa o hash do CPF (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public._cpf_hash(_cpf text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'private_crypto', 'extensions', 'public'
AS $$
DECLARE
  v_pepper text;
BEGIN
  IF _cpf IS NULL OR _cpf !~ '^\d{11}$' THEN
    RETURN NULL;
  END IF;
  SELECT cpf_pepper INTO v_pepper FROM private_crypto.config WHERE id = 1;
  RETURN encode(extensions.hmac(_cpf, v_pepper, 'sha256'), 'hex');
END;
$$;

REVOKE EXECUTE ON FUNCTION public._cpf_hash(text) FROM PUBLIC, anon, authenticated;

-- 3. Novas colunas em divulgadores
ALTER TABLE public.divulgadores
  ADD COLUMN IF NOT EXISTS cpf_hash text,
  ADD COLUMN IF NOT EXISTS cpf_last2 char(2);

-- 4. Migrar dados existentes (chamado direto, evita problema de privilégio)
DO $$
DECLARE
  v_pepper text;
BEGIN
  SELECT cpf_pepper INTO v_pepper FROM private_crypto.config WHERE id = 1;
  UPDATE public.divulgadores
     SET cpf_hash = encode(extensions.hmac(cpf, v_pepper, 'sha256'), 'hex'),
         cpf_last2 = right(cpf, 2)
   WHERE cpf IS NOT NULL AND cpf ~ '^\d{11}$' AND cpf_hash IS NULL;
END $$;

-- 5. Remover constraint antiga e tornar cpf opcional
ALTER TABLE public.divulgadores
  DROP CONSTRAINT IF EXISTS divulgadores_cpf_fmt_chk;

ALTER TABLE public.divulgadores
  ALTER COLUMN cpf DROP NOT NULL;

-- 6. Trigger que converte cpf -> hash em INSERT/UPDATE e descarta o plaintext
CREATE OR REPLACE FUNCTION public.divulgadores_hash_cpf()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.cpf IS NOT NULL THEN
    IF NEW.cpf !~ '^\d{11}$' THEN
      RAISE EXCEPTION 'CPF inválido: deve conter 11 dígitos numéricos';
    END IF;
    NEW.cpf_hash := public._cpf_hash(NEW.cpf);
    NEW.cpf_last2 := right(NEW.cpf, 2);
    NEW.cpf := NULL; -- nunca persiste plaintext
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_divulgadores_hash_cpf ON public.divulgadores;
CREATE TRIGGER trg_divulgadores_hash_cpf
  BEFORE INSERT OR UPDATE ON public.divulgadores
  FOR EACH ROW EXECUTE FUNCTION public.divulgadores_hash_cpf();

-- 7. Apaga qualquer plaintext remanescente após a migração
UPDATE public.divulgadores SET cpf = NULL WHERE cpf IS NOT NULL AND cpf_hash IS NOT NULL;

-- 8. Unicidade por CPF (via hash)
CREATE UNIQUE INDEX IF NOT EXISTS divulgadores_cpf_hash_uniq
  ON public.divulgadores (cpf_hash)
  WHERE cpf_hash IS NOT NULL;

-- 9. Validações nas novas colunas
ALTER TABLE public.divulgadores
  DROP CONSTRAINT IF EXISTS divulgadores_cpf_hash_fmt_chk,
  DROP CONSTRAINT IF EXISTS divulgadores_cpf_last2_fmt_chk;

ALTER TABLE public.divulgadores
  ADD CONSTRAINT divulgadores_cpf_hash_fmt_chk
    CHECK (cpf_hash IS NULL OR cpf_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT divulgadores_cpf_last2_fmt_chk
    CHECK (cpf_last2 IS NULL OR cpf_last2 ~ '^\d{2}$');
