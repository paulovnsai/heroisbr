/*
  # Enable Realtime for heroes table

  1. Changes
    - Enable Realtime replication for the heroes table
    - This allows the frontend to receive updates automatically when heroes are modified
  
  2. Security
    - No changes to RLS policies
    - Only enables real-time subscriptions for existing data access patterns
*/

-- Enable Realtime for the heroes table
ALTER PUBLICATION supabase_realtime ADD TABLE heroes;
