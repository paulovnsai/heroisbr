/*
  # Create Heroes Registration System Schema

  ## Overview
  This migration creates the database schema for a hero registration system that allows 
  tracking and managing superhero profiles with their powers, status, and affiliations.

  ## New Tables
  
  ### `heroes`
  Main table storing hero information:
  - `id` (uuid, primary key) - Unique identifier for each hero
  - `name` (text, required) - Real name of the hero
  - `alias` (text, required, unique) - Hero name/codename
  - `powers` (text[], required) - Array of superpowers
  - `level` (integer, default 1) - Hero power level (1-100)
  - `origin_story` (text) - Background story of the hero
  - `status` (text, default 'active') - Current status (active, retired, deceased, missing)
  - `team` (text) - Team affiliation
  - `profile_image_url` (text) - URL to hero's profile image
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `hero_missions`
  Table storing mission history:
  - `id` (uuid, primary key) - Unique identifier
  - `hero_id` (uuid, foreign key) - Reference to heroes table
  - `mission_name` (text, required) - Name of the mission
  - `mission_date` (date, required) - Date of the mission
  - `status` (text, default 'completed') - Mission status
  - `description` (text) - Mission details
  - `success_rating` (integer) - Rating from 1-5
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on both tables
  - Allow public read access to heroes (for hero registry viewing)
  - Allow public insert/update/delete for demo purposes (in production, restrict to authenticated users)
*/

-- Create heroes table
CREATE TABLE IF NOT EXISTS heroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  alias text UNIQUE NOT NULL,
  powers text[] NOT NULL DEFAULT '{}',
  level integer DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  origin_story text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'retired', 'deceased', 'missing')),
  team text,
  profile_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hero_missions table
CREATE TABLE IF NOT EXISTS hero_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id uuid REFERENCES heroes(id) ON DELETE CASCADE,
  mission_name text NOT NULL,
  mission_date date NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'in_progress', 'cancelled')),
  description text,
  success_rating integer CHECK (success_rating >= 1 AND success_rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_heroes_status ON heroes(status);
CREATE INDEX IF NOT EXISTS idx_heroes_team ON heroes(team);
CREATE INDEX IF NOT EXISTS idx_hero_missions_hero_id ON hero_missions(hero_id);

-- Enable Row Level Security
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_missions ENABLE ROW LEVEL SECURITY;

-- Create policies for heroes table (allowing public access for demo)
CREATE POLICY "Anyone can view heroes"
  ON heroes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert heroes"
  ON heroes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update heroes"
  ON heroes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete heroes"
  ON heroes FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create policies for hero_missions table
CREATE POLICY "Anyone can view missions"
  ON hero_missions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert missions"
  ON hero_missions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update missions"
  ON hero_missions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete missions"
  ON hero_missions FOR DELETE
  TO anon, authenticated
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_heroes_updated_at ON heroes;
CREATE TRIGGER update_heroes_updated_at
  BEFORE UPDATE ON heroes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample heroes for demonstration
INSERT INTO heroes (name, alias, powers, level, origin_story, status, team, profile_image_url) VALUES
  ('Peter Parker', 'Spider-Man', ARRAY['Wall-crawling', 'Super strength', 'Spider sense', 'Web-slinging'], 85, 'Bitten by a radioactive spider during a school field trip.', 'active', 'Avengers', 'https://images.pexels.com/photos/6664285/pexels-photo-6664285.jpeg'),
  ('Diana Prince', 'Wonder Woman', ARRAY['Super strength', 'Flight', 'Lasso of Truth', 'Combat expert'], 95, 'Amazonian princess from the island of Themyscira.', 'active', 'Justice League', 'https://images.pexels.com/photos/6069095/pexels-photo-6069095.jpeg'),
  ('Bruce Wayne', 'Batman', ARRAY['Genius intellect', 'Martial arts', 'Detective skills', 'Advanced technology'], 90, 'Witnessed his parents murder as a child, dedicated his life to fighting crime.', 'active', 'Justice League', 'https://images.pexels.com/photos/4295986/pexels-photo-4295986.jpeg'),
  ('Clark Kent', 'Superman', ARRAY['Super strength', 'Flight', 'Heat vision', 'Invulnerability', 'Super speed'], 100, 'Last son of Krypton, sent to Earth before his planets destruction.', 'active', 'Justice League', 'https://images.pexels.com/photos/3763871/pexels-photo-3763871.jpeg'),
  ('Tony Stark', 'Iron Man', ARRAY['Genius intellect', 'Powered armor', 'Flight', 'Energy weapons'], 88, 'Billionaire genius who built a powered suit of armor to escape captivity.', 'retired', 'Avengers', 'https://images.pexels.com/photos/4836368/pexels-photo-4836368.jpeg')
ON CONFLICT (alias) DO NOTHING;