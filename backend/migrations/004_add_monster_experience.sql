ALTER TABLE players
ADD COLUMN monster_experience TEXT DEFAULT '{}';

UPDATE players
SET monster_experience = COALESCE(monster_experience, '{}');
