-- 1) Adicionar classificações à tabela de perfis
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
        ALTER TABLE public.profiles ADD COLUMN user_type TEXT DEFAULT 'usuario';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_type') THEN
        ALTER TABLE public.profiles ADD COLUMN company_type TEXT;
    END IF;
END $$;

-- 2) Migrar dados existentes (opcional/heurística)
-- Se houver artistas aprovados, podemos marcar como 'artista' no user_type se quisermos, 
-- mas o pedido foca em Promotor, Divulgador, Estabelecimento.
-- Vamos assumir que 'Divulgador' mapeia para colaboradores ativos.
UPDATE public.profiles p
SET user_type = 'divulgador'
FROM public.collaborators c
WHERE p.user_id = c.user_id AND c.is_active = true;

-- 3) Garantir RLS e Permissões
-- Apenas admins podem ver a tabela completa de perfis (incluindo emails/telefones de outros)
-- Usuários normais podem ver apenas seu próprio perfil ou perfis públicos através de views (já configurado na migração anterior)

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  (SELECT public.is_admin_or_master(auth.uid())) = true
  OR auth.uid() = user_id
);

-- Garantir que a função is_admin_or_master exista e funcione
CREATE OR REPLACE FUNCTION public.is_admin_or_master(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role IN ('admin', 'master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
