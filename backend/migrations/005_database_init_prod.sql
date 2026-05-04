-- Production Database Initialization for Dungeon Core

-- ==========================================
-- 1. Core Tables
-- ==========================================

-- Players table
CREATE TABLE players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE,
    mana INT DEFAULT 50,
    max_mana INT DEFAULT 100,
    mana_regen INT DEFAULT 1,
    gold INT DEFAULT 100,
    souls INT DEFAULT 0,
    day INT DEFAULT 1,
    hour INT DEFAULT 6,
    status ENUM('Open', 'Closing', 'Closed') DEFAULT 'Open',
    unlocked_species TEXT DEFAULT '[]',
    species_experience TEXT DEFAULT '{}',
    monster_experience TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dungeons table
CREATE TABLE dungeons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT,
    total_floors INT DEFAULT 1,
    deep_core_bonus DECIMAL(3,2) DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Floors table
CREATE TABLE floors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dungeon_id INT,
    number INT,
    is_deepest BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(id) ON DELETE CASCADE
);

-- Rooms table
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    floor_id INT,
    type ENUM('entrance', 'normal', 'boss', 'core'),
    position INT,
    explored BOOLEAN DEFAULT FALSE,
    loot INT DEFAULT 0,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
);

-- Monsters table
CREATE TABLE monsters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT,
    type VARCHAR(100),
    hp INT,
    max_hp INT,
    alive BOOLEAN DEFAULT TRUE,
    is_boss BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Adventurer Parties table
CREATE TABLE adventurer_parties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT,
    current_floor INT DEFAULT 1,
    current_room INT DEFAULT 0,
    retreating BOOLEAN DEFAULT FALSE,
    casualties INT DEFAULT 0,
    loot INT DEFAULT 0,
    entry_time INT,
    target_floor INT,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Adventurers table
CREATE TABLE adventurers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    party_id INT,
    name VARCHAR(100),
    class_name VARCHAR(50),
    level INT,
    hp INT,
    max_hp INT,
    alive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (party_id) REFERENCES adventurer_parties(id) ON DELETE CASCADE
);

-- Equipment tables migration

-- Equipment types table
CREATE TABLE equipment_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE,
    type ENUM('weapon', 'armor', 'accessory'),
    tier INT,
    attack_bonus INT DEFAULT 0,
    defense_bonus INT DEFAULT 0,
    mana_bonus INT DEFAULT 0,
    cost INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player equipment inventory table
CREATE TABLE player_equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT,
    equipment_type_id INT,
    quantity INT DEFAULT 1,
    equipped BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE CASCADE
);

-- Monster types table for database storage
CREATE TABLE monster_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE,
    species VARCHAR(50),
    tier INT,
    base_cost INT,
    hp INT,
    attack INT,
    defense INT,
    color VARCHAR(7),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monster traits table
CREATE TABLE monster_traits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE,
    description TEXT,
    trait_type ENUM('passive_effect', 'active_ability'),
    applies_to ENUM('monster', 'enemy', 'self'),
    mana_cost INT DEFAULT 0,
    cooldown_turns INT DEFAULT 0,
    upgrade_potential BOOLEAN DEFAULT TRUE,
    properties JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monster-trait relationships
CREATE TABLE monster_type_traits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    monster_type_id INT,
    trait_id INT,
    FOREIGN KEY (monster_type_id) REFERENCES monster_types(id) ON DELETE CASCADE,
    FOREIGN KEY (trait_id) REFERENCES monster_traits(id) ON DELETE CASCADE
);

-- Game constants table
CREATE TABLE game_constants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE,
    value_int INT,
    value_float DECIMAL(10,2),
    value_string VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Floor scaling table
CREATE TABLE floor_scaling (
    id INT PRIMARY KEY AUTO_INCREMENT,
    floor_range_start INT,
    floor_range_end INT,
    mana_cost_multiplier DECIMAL(3,2),
    monster_boost_percentage INT,
    adventurer_level_min INT,
    adventurer_level_max INT,
    is_deep_floor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 2. Indexes for Performance
-- ==========================================
CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_dungeons_player ON dungeons(player_id);
CREATE INDEX idx_floors_dungeon ON floors(dungeon_id);
CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_monsters_room ON monsters(room_id);
CREATE INDEX idx_parties_player ON adventurer_parties(player_id);
CREATE INDEX idx_adventurers_party ON adventurers(party_id);
CREATE INDEX idx_equipment_types_type ON equipment_types(type);
CREATE INDEX idx_equipment_types_tier ON equipment_types(tier);
CREATE INDEX idx_player_equipment_player ON player_equipment(player_id);
CREATE INDEX idx_monster_types_species ON monster_types(species);
CREATE INDEX idx_monster_types_tier ON monster_types(tier);
CREATE INDEX idx_monster_traits_type ON monster_traits(trait_type);
CREATE INDEX idx_game_constants_name ON game_constants(name);
CREATE INDEX idx_floor_scaling_range ON floor_scaling(floor_range_start, floor_range_end);


-- ==========================================
-- 3. Initial Data Insertion
-- ==========================================

-- Insert equipment data
INSERT INTO equipment_types (name, type, tier, attack_bonus, defense_bonus, mana_bonus, cost, description) VALUES
-- Weapons
('Rusty Sword', 'weapon', 1, 2, 0, 0, 10, 'A worn but serviceable blade'),
('Iron Blade', 'weapon', 2, 5, 0, 0, 25, 'A sturdy iron weapon'),
('Steel Sword', 'weapon', 3, 10, 0, 0, 50, 'A well-crafted steel blade'),
('Magic Blade', 'weapon', 4, 18, 0, 0, 100, 'A blade infused with magical power'),
('Dragon Slayer', 'weapon', 5, 30, 0, 0, 200, 'A legendary weapon forged to slay dragons'),

-- Armor
('Cloth Robe', 'armor', 1, 0, 1, 0, 8, 'Basic cloth protection'),
('Leather Armor', 'armor', 2, 0, 3, 0, 20, 'Flexible leather protection'),
('Chain Mail', 'armor', 3, 0, 6, 0, 40, 'Interlocked metal rings'),
('Plate Armor', 'armor', 4, 0, 12, 0, 80, 'Heavy metal plate protection'),
('Dragon Scale', 'armor', 5, 0, 20, 0, 160, 'Armor crafted from dragon scales'),

-- Accessories
('Worn Ring', 'accessory', 1, 0, 0, 5, 15, 'An old ring with faint magical properties'),
('Silver Ring', 'accessory', 2, 0, 0, 10, 35, 'A silver ring that enhances mana flow'),
('Magic Amulet', 'accessory', 3, 0, 0, 20, 70, 'An amulet pulsing with magical energy'),
('Ring of Power', 'accessory', 4, 0, 0, 35, 140, 'A ring that greatly amplifies magical power'),
('Legendary Talisman', 'accessory', 5, 0, 0, 60, 280, 'A legendary artifact of immense power');

-- Insert monster data
INSERT INTO monster_types (name, species, tier, base_cost, hp, attack, defense, color, description) VALUES
-- Mimetic
('Slime', 'Mimetic', 1, 10, 20, 5, 2, '#8B4513', 'A basic gelatinous creature'),
('Acidic Slime', 'Mimetic', 2, 20, 35, 8, 4, '#8B4513', 'A corrosive variant of slime'),
('Greater Slime', 'Mimetic', 3, 35, 55, 12, 6, '#8B4513', 'An evolved slime with enhanced abilities'),

-- Amorphous
('Blob', 'Amorphous', 1, 10, 20, 5, 2, '#32CD32', 'A shapeless mass of living matter'),
('Toxic Blob', 'Amorphous', 2, 20, 35, 8, 4, '#32CD32', 'A poisonous blob creature'),

-- Plant
('Vine Creeper', 'Plant', 1, 10, 20, 5, 2, '#228B22', 'A mobile plant creature'),
('Thorn Vine', 'Plant', 2, 20, 35, 8, 4, '#228B22', 'A thorny defensive plant'),

-- Crustacean
('Cave Crab', 'Crustacean', 1, 10, 20, 5, 2, '#FF6347', 'A hardy crustacean'),
('Stone Crab', 'Crustacean', 2, 20, 35, 8, 4, '#FF6347', 'A heavily armored crab');

-- Insert trait data
INSERT INTO monster_traits (name, description, trait_type, applies_to, mana_cost, cooldown_turns, upgrade_potential, properties) VALUES
('Adaptive', 'Learns from combat, becoming more resilient', 'passive_effect', 'monster', 0, 0, TRUE, '{"defense_bonus": 2}'),
('Regenerative', 'Slowly heals over time', 'passive_effect', 'monster', 0, 0, TRUE, '{"heal_per_turn": 3}'),
('Corrosive', 'Damages enemy equipment and defenses', 'passive_effect', 'monster', 0, 0, TRUE, '{"armor_reduction": 1}'),
('Shapeshifter', 'Can change form to adapt to situations', 'active_ability', 'monster', 10, 5, TRUE, '{}'),
('Engulf', 'Can swallow smaller enemies whole', 'active_ability', 'monster', 20, 8, TRUE, '{}'),
('Toxic', 'Poisons enemies on contact', 'passive_effect', 'monster', 0, 0, TRUE, '{"poison_damage": 2, "poison_duration": 3}'),
('Rooted', 'Cannot move but gains defensive bonuses', 'passive_effect', 'monster', 0, 0, FALSE, '{"defense_bonus": 5, "movement_penalty": 100}'),
('Photosynthetic', 'Gains energy from light sources', 'passive_effect', 'monster', 0, 0, TRUE, '{"mana_regen": 1}'),
('Thorned', 'Reflects damage back to attackers', 'passive_effect', 'monster', 0, 0, TRUE, '{"reflect_damage_percent": 25}'),
('Armored', 'Natural armor plating reduces damage', 'passive_effect', 'monster', 0, 0, TRUE, '{"damage_reduction": 3}'),
('Pincer', 'Powerful claws for grappling and damage', 'active_ability', 'monster', 5, 3, TRUE, '{"damage_bonus": 2}'),
('Sturdy', 'Resistant to knockback and status effects', 'passive_effect', 'monster', 0, 0, TRUE, '{"status_resistance": 50, "knockback_resistance": 75}'),
('Resistant', 'Reduced damage from all sources', 'passive_effect', 'monster', 0, 0, TRUE, '{"damage_reduction_percent": 15}');

-- Insert monster-trait relationships
INSERT INTO monster_type_traits (monster_type_id, trait_id) VALUES
-- Slime traits
(1, 1), (1, 2), -- Adaptive, Regenerative
(2, 1), (2, 3), -- Adaptive, Corrosive
(3, 1), (3, 2), (3, 13), -- Adaptive, Regenerative, Resistant

-- Blob traits
(4, 4), (4, 5), -- Shapeshifter, Engulf
(5, 4), (5, 6), -- Shapeshifter, Toxic

-- Plant traits
(6, 7), (6, 8), -- Rooted, Photosynthetic
(7, 7), (7, 9), -- Rooted, Thorned

-- Crab traits
(8, 10), (8, 11), -- Armored, Pincer
(9, 10), (9, 11), (9, 12); -- Armored, Pincer, Sturdy

-- Insert game constants
INSERT INTO game_constants (name, value_int, description) VALUES
('MAX_ROOMS_PER_FLOOR', 5, 'Maximum number of rooms per floor'),
('MAX_LOG_ENTRIES', 50, 'Maximum number of log entries to keep'),
('BASE_MANA_REGEN', 1, 'Base mana regeneration per turn'),
('CORE_ROOM_MANA_BONUS', 2, 'Mana bonus from core room per floor'),
('FLOOR_COMPLETE_BONUS', 10, 'Bonus for completing a floor'),
('BOSS_DEFEAT_BONUS', 25, 'Bonus for defeating a boss'),
('MONSTER_EVOLUTION_COST_BASE', 50, 'Base cost for monster evolution'),
('EQUIPMENT_UPGRADE_COST_BASE', 100, 'Base cost for equipment upgrades'),
('DEEP_FLOOR_THRESHOLD', 10, 'Floor number when deep floors start'),
('PRESTIGE_THRESHOLD', 20, 'Floor number when prestige becomes available'),
('MAX_MONSTER_LEVEL', 100, 'Maximum level for monsters'),
('TRAIT_UNLOCK_COST', 500, 'Cost to unlock new traits'),
('SPECIES_UNLOCK_COST', 1000, 'Cost to unlock new species');

INSERT INTO game_constants (name, value_float, description) VALUES
('ROOM_UPGRADE_COST_MULTIPLIER', 1.5, 'Multiplier for room upgrade costs');

-- Insert floor scaling data
INSERT INTO floor_scaling (floor_range_start, floor_range_end, mana_cost_multiplier, monster_boost_percentage, adventurer_level_min, adventurer_level_max, is_deep_floor) VALUES
(1, 1, 1.0, 0, 1, 3, FALSE),
(2, 2, 1.5, 30, 3, 5, FALSE),
(3, 3, 2.2, 60, 5, 7, FALSE),
(4, 10, 3.0, 100, 7, 10, FALSE),
(11, 999, 1.0, 50, 2, 2, TRUE); -- Deep floor scaling (additive)
