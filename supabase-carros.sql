-- Sistema dinâmico de carros com conflito por horário
-- Rodar no SQL Editor do Supabase

-- 1. Tabela de carros
CREATE TABLE IF NOT EXISTS medwork_carros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  placa TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE medwork_carros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carros_all" ON medwork_carros;
CREATE POLICY "carros_all" ON medwork_carros FOR ALL USING (true) WITH CHECK (true);

-- 2. Coluna carro_id em compromissos (mantém tipo_carro pra backwards compat)
ALTER TABLE medwork_compromissos
  ADD COLUMN IF NOT EXISTS carro_id UUID REFERENCES medwork_carros(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_compromissos_carro_data
  ON medwork_compromissos(carro_id, data) WHERE carro_id IS NOT NULL;
