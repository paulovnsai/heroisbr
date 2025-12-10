/*
  # Criar bucket de storage para imagens dos heróis

  ## Resumo
  Cria o bucket de storage público 'hero-images' para armazenar
  imagens dos heróis brasileiros carregadas pelos usuários.

  ## Alterações
  
  ### Storage
  Novo bucket:
  - `hero-images` - Bucket público para armazenar imagens dos heróis
  
  ### Políticas de Storage
  - Permitir leitura pública de todas as imagens
  - Permitir upload público de imagens (para simplicidade, sem autenticação)
  - Permitir atualização e remoção pública de imagens
  
  ## Notas
  - O bucket é configurado como público para facilitar o acesso às imagens
  - Formatos aceitos: PNG, JPG, GIF, WEBP
  - As imagens serão acessíveis via URL pública
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access to hero images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'hero-images' );

CREATE POLICY "Public Upload to hero images"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'hero-images' );

CREATE POLICY "Public Update to hero images"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'hero-images' );

CREATE POLICY "Public Delete from hero images"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'hero-images' );
