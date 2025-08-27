-- Add species support to players table
ALTER TABLE players 
ADD COLUMN unlocked_species TEXT DEFAULT '[]',
ADD COLUMN species_experience TEXT DEFAULT '{}';

-- Update existing players to have no unlocked species initially
UPDATE players SET unlocked_species = '[]', species_experience = '{}' WHERE unlocked_species IS NULL;
