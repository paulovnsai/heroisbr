/*
  # Remove unique constraint from heroes alias field

  1. Changes
    - Remove UNIQUE constraint from `heroes.alias` field to allow multiple heroes with the same alias/name
  
  2. Reasoning
    - The application uses `alias` field to store hero names which can be duplicated
    - This prevents errors when creating heroes with the same name
*/

-- Remove the unique constraint from alias
ALTER TABLE heroes DROP CONSTRAINT IF EXISTS heroes_alias_key;
