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

-- Indexes for performance
CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_dungeons_player ON dungeons(player_id);
CREATE INDEX idx_floors_dungeon ON floors(dungeon_id);
CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_monsters_room ON monsters(room_id);
CREATE INDEX idx_parties_player ON adventurer_parties(player_id);
CREATE INDEX idx_adventurers_party ON adventurers(party_id);