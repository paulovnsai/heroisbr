/*
  # Add art_style field to heroes table

  1. Changes
    - Add `art_style` column to `heroes` table
      - Stores the selected art style description for video generation
      - Type: text
      - Nullable (optional field)
    
  2. Notes
    - Art style will be sent to N8N for video generation customization
    - Contains full style description prompts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'art_style'
  ) THEN
    ALTER TABLE heroes ADD COLUMN art_style text;
  END IF;
END $$;