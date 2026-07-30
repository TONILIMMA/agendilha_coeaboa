
-- Aprova os locais e atrativos já existentes para aparecerem nas sugestões
UPDATE public.estabelecimentos SET is_approved = true, approved_at = now() WHERE is_approved = false;
UPDATE public.atrativos SET is_approved = true, approved_at = now() WHERE is_approved = false;

-- Base pré-cadastrada de locais conhecidos da Ilha do Governador
INSERT INTO public.estabelecimentos (nome, tipo, endereco, bairro, is_approved, approved_at)
SELECT v.nome, v.tipo, v.endereco, v.bairro, true, now()
FROM (VALUES
  ('Praia da Bica', 'praca', 'Praia da Bica', 'Jardim Guanabara'),
  ('Praia do Zumbi', 'praca', 'Praia do Zumbi', 'Zumbi'),
  ('Praia da Guanabara', 'praca', 'Orla da Praia da Guanabara', 'Jardim Guanabara'),
  ('Praia das Pitangueiras', 'praca', 'Praia das Pitangueiras', 'Pitangueiras'),
  ('Praça Jerusalém', 'praca', 'Praça Jerusalém', 'Jardim Guanabara'),
  ('Praça Iaiá Garcia', 'praca', 'Praça Iaiá Garcia', 'Jardim Guanabara'),
  ('Praça do Cocotá', 'praca', 'Praça do Cocotá', 'Cocotá'),
  ('Praça da Freguesia', 'praca', 'Praça da Freguesia', 'Freguesia'),
  ('Praça dos Bancários', 'praca', 'Praça dos Bancários', 'Bancários'),
  ('Praça da Ribeira', 'praca', 'Praça da Ribeira', 'Ribeira'),
  ('Orla do Tauá', 'praca', 'Orla do Tauá', 'Tauá'),
  ('Orla da Portuguesa', 'praca', 'Orla da Portuguesa', 'Portuguesa'),
  ('Ilha Plaza Shopping', 'outro', 'Av. Maestro Paulo e Silva, 400', 'Jardim Carioca'),
  ('Shopping Nova América Ilha', 'outro', 'Estrada do Galeão', 'Galeão'),
  ('Clube Guanabara', 'clube', 'Estrada da Bica', 'Jardim Guanabara'),
  ('Clube Portuguesa (AD Portuguesa)', 'clube', 'Rua Cambaúba', 'Portuguesa'),
  ('Iate Clube Jardim Guanabara', 'clube', 'Praia da Guanabara', 'Jardim Guanabara'),
  ('Igreja Matriz da Freguesia', 'espaco_cultural', 'Largo da Freguesia', 'Freguesia'),
  ('Centro Cultural da Ilha', 'espaco_cultural', 'Estrada do Galeão', 'Jardim Carioca'),
  ('Quiosques da Praia da Bica', 'restaurante', 'Praia da Bica', 'Jardim Guanabara'),
  ('Calçadão do Cocotá', 'praca', 'Rua Cambaúba', 'Cocotá'),
  ('Parque Poeta Manuel Bandeira', 'praca', 'Estrada do Rio Jequiá', 'Jardim Carioca'),
  ('Ilha do Governador - Moneró', 'outro', 'Estrada do Dendê', 'Moneró'),
  ('Praia da Bandeira', 'praca', 'Orla da Praia da Bandeira', 'Praia da Bandeira')
) AS v(nome, tipo, endereco, bairro)
WHERE NOT EXISTS (
  SELECT 1 FROM public.estabelecimentos e WHERE lower(e.nome) = lower(v.nome)
);

-- Base pré-cadastrada de atrativos comuns
INSERT INTO public.atrativos (name, tipo_atrativo, type, cidade_regiao, estado, pais, is_approved, approved_at)
SELECT v.name, v.tipo, v.tipo, 'Ilha do Governador', 'RJ', 'Brasil', true, now()
FROM (VALUES
  ('Roda de Samba', 'musica'),
  ('Pagode ao Vivo', 'musica'),
  ('Show de MPB', 'musica'),
  ('Banda de Rock', 'musica'),
  ('DJ Set', 'musica'),
  ('Forró Pé de Serra', 'musica'),
  ('Sertanejo ao Vivo', 'musica'),
  ('Karaokê', 'musica'),
  ('Stand-up Comedy', 'cultura'),
  ('Teatro Infantil', 'cultura'),
  ('Feira de Artesanato', 'cultura'),
  ('Sarau Cultural', 'cultura'),
  ('Exposição de Arte', 'cultura'),
  ('Festival Gastronômico', 'gastronomia'),
  ('Food Truck', 'gastronomia'),
  ('Feirinha Gastronômica', 'gastronomia'),
  ('Corrida de Rua', 'esporte'),
  ('Aula de Yoga', 'esporte'),
  ('Futevôlei na Praia', 'esporte'),
  ('Passeio de Barco', 'turismo'),
  ('Trilha Ecológica', 'turismo'),
  ('Passeio Histórico', 'turismo'),
  ('Bloco de Carnaval', 'cultura'),
  ('Bingo Beneficente', 'outro')
) AS v(name, tipo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.atrativos a WHERE lower(a.name) = lower(v.name)
);
