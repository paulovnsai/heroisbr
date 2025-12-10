/*
  # Adicionar campo para imagem do herói

  ## Resumo
  Adiciona campo para armazenar a URL da imagem específica de cada herói,
  diferente da profile_image_url que era usada anteriormente.

  ## Alterações
  
  ### Tabela `heroes`
  Novo campo:
  - `hero_image_url` (text) - URL da imagem carregada específica para este herói
  
  ## Notas
  Este campo armazenará a URL da imagem carregada no Supabase Storage
  no bucket 'hero-images'.
*/

-- Adicionar campo para URL da imagem do herói
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE heroes ADD COLUMN hero_image_url text;
  END IF;
END $$;

-- Adicionar índice para melhor performance em queries
CREATE INDEX IF NOT EXISTS idx_heroes_hero_image_url ON heroes(hero_image_url);

-- Adicionar comentário para documentação
COMMENT ON COLUMN heroes.hero_image_url IS 'URL da imagem carregada específica para este herói no Supabase Storage';