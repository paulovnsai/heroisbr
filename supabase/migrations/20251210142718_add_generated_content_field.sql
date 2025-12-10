/*
  # Add generated content field to heroes table

  1. Changes
    - Add `generated_content` column to store the story/content returned by N8N
    - This allows displaying the content directly in the app instead of just downloading

  2. Details
    - Column type: text (can store long content)
    - Nullable: yes (old records might not have content)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heroes' AND column_name = 'generated_content'
  ) THEN
    ALTER TABLE heroes ADD COLUMN generated_content text;
  END IF;
END $$;