/*
  # Atualizar Schema para Heróis Brasileiros

  ## Resumo
  Esta migração adapta o sistema para registrar heróis brasileiros anônimos,
  adicionando campos específicos para geração de histórias e arquivos via webhook.

  ## Alterações nas Tabelas
  
  ### Tabela `heroes`
  Novos campos adicionados:
  - `ideia` (text) - Descrição do ato heroico realizado
  - `observacao` (text) - Observações adicionais sobre o herói
  - `local` (text) - Local onde ocorreu o ato heroico
  - `ano` (text) - Ano em que ocorreu
  - `artstyle` (text) - Estilo artístico para geração de imagem
  - `storylength` (text) - Tamanho da história a ser gerada
  - `file_url` (text) - URL do arquivo gerado pelo webhook
  - `processing_status` (text) - Status do processamento (pending, processing, completed, error)
  
  Campos antigos mantidos para compatibilidade mas tornam-se opcionais.

  ## Índices
  - Adiciona índice para `ano` para consultas por período
  - Adiciona índice para `processing_status` para filtros de status

  ## Segurança
  As políticas RLS existentes continuam aplicadas.
*/

-- Adicionar novos campos à tabela heroes
DO $$
BEGIN
  -- Campo ideia (descrição do ato heroico)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'ideia'
  ) THEN
    ALTER TABLE heroes ADD COLUMN ideia text;
  END IF;

  -- Campo observacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'observacao'
  ) THEN
    ALTER TABLE heroes ADD COLUMN observacao text DEFAULT '';
  END IF;

  -- Campo local
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'local'
  ) THEN
    ALTER TABLE heroes ADD COLUMN local text;
  END IF;

  -- Campo ano
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'ano'
  ) THEN
    ALTER TABLE heroes ADD COLUMN ano text;
  END IF;

  -- Campo artstyle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'artstyle'
  ) THEN
    ALTER TABLE heroes ADD COLUMN artstyle text DEFAULT 'Historical semi-realistic digital painting';
  END IF;

  -- Campo storylength
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'storylength'
  ) THEN
    ALTER TABLE heroes ADD COLUMN storylength text DEFAULT '20';
  END IF;

  -- Campo file_url (URL do arquivo gerado)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE heroes ADD COLUMN file_url text;
  END IF;

  -- Campo processing_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE heroes ADD COLUMN processing_status text DEFAULT 'pending';
  END IF;
END $$;

-- Tornar campos antigos opcionais
ALTER TABLE heroes ALTER COLUMN alias DROP NOT NULL;
ALTER TABLE heroes ALTER COLUMN powers DROP NOT NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_heroes_ano ON heroes(ano);
CREATE INDEX IF NOT EXISTS idx_heroes_processing_status ON heroes(processing_status);
CREATE INDEX IF NOT EXISTS idx_heroes_local ON heroes(local);

-- Atualizar constraint de status para incluir novos valores portugueses
ALTER TABLE heroes DROP CONSTRAINT IF EXISTS heroes_status_check;
ALTER TABLE heroes ADD CONSTRAINT heroes_status_check 
  CHECK (status IN ('active', 'retired', 'deceased', 'missing', 'Lembrado nacionalmente', 'Pouco lembrado nacionalmente', 'Esquecido'));

-- Adicionar comentários para documentação
COMMENT ON COLUMN heroes.ideia IS 'Descrição do ato heroico realizado pelo herói anônimo';
COMMENT ON COLUMN heroes.observacao IS 'Observações adicionais sobre o herói ou contexto';
COMMENT ON COLUMN heroes.local IS 'Cidade/Estado onde ocorreu o ato heroico';
COMMENT ON COLUMN heroes.ano IS 'Ano em que o ato heroico aconteceu';
COMMENT ON COLUMN heroes.artstyle IS 'Estilo artístico para geração da imagem';
COMMENT ON COLUMN heroes.storylength IS 'Tamanho desejado da história (em páginas ou tempo)';
COMMENT ON COLUMN heroes.file_url IS 'URL do arquivo gerado pelo webhook N8N';
COMMENT ON COLUMN heroes.processing_status IS 'Status do processamento: pending, processing, completed, error';