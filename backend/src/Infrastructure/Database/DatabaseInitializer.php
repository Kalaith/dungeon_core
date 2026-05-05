<?php

declare(strict_types=1);

namespace DungeonCore\Infrastructure\Database;

use PDO;
use PDOException;

class DatabaseInitializer
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function initialize(): PDO
    {
        try {
            // First, try to connect to the database
            $pdo = $this->createConnection();

            // Always check for missing tables and create them
            $this->ensureAllTablesExist($pdo);
            $this->ensureGameplayColumnsExist($pdo);
            $this->ensureGameConstantsExist($pdo);

            return $pdo;
        } catch (PDOException $e) {
            if ($this->isDatabaseNotFoundError($e)) {
                // Database doesn't exist, create it
                $this->createDatabase();
                $pdo = $this->createConnection();
                $this->createTables($pdo);
                $this->ensureGameplayColumnsExist($pdo);
                $this->ensureGameConstantsExist($pdo);
                return $pdo;
            }
            throw $e;
        }
    }

    private function createConnection(): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $this->config['host'],
            $this->config['port'],
            $this->config['database'],
            $this->config['charset']
        );
        return new PDO($dsn, $this->config['username'], $this->config['password'], $this->config['options']);
    }

    private function createDatabase(): void
    {
        // Connect without specifying database
        $dsn = "mysql:host={$this->config['host']};port={$this->config['port']};charset={$this->config['charset']}";
        $pdo = new PDO($dsn, $this->config['username'], $this->config['password'], $this->config['options']);

        $databaseName = $this->config['database'];
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        echo "Database '{$databaseName}' created successfully.\n";
    }

    private function ensureAllTablesExist(PDO $pdo): void
    {
        // List of tables that should exist
        $requiredTables = [
            'players', 'dungeons', 'floors', 'rooms', 'monsters',
            'adventurer_parties', 'adventurers', 'equipment_types',
            'player_equipment', 'monster_types', 'monster_traits',
            'monster_type_traits', 'game_constants', 'floor_scaling'
        ];

        // Check which tables exist
        $existingTables = [];
        $result = $pdo->query("SHOW TABLES");
        while ($row = $result->fetch(PDO::FETCH_NUM)) {
            $existingTables[] = $row[0];
        }

        // Check if any required tables are missing
        $missingTables = array_diff($requiredTables, $existingTables);

        if (!empty($missingTables)) {
            echo "Missing tables detected: " . implode(', ', $missingTables) . "\n";
            echo "Running migrations to create missing tables...\n";
            $this->createTables($pdo);
        }
    }

    private function ensureGameplayColumnsExist(PDO $pdo): void
    {
        $this->ensureColumn(
            $pdo,
            'players',
            'core_integrity',
            'ALTER TABLE players ADD COLUMN core_integrity INT DEFAULT 100'
        );
        $this->ensureColumn(
            $pdo,
            'players',
            'last_advanced_at',
            'ALTER TABLE players ADD COLUMN last_advanced_at DATETIME(6) NULL'
        );
        $this->ensureColumn(
            $pdo,
            'adventurer_parties',
            'boredom',
            'ALTER TABLE adventurer_parties ADD COLUMN boredom INT DEFAULT 0'
        );
        $this->ensureColumn(
            $pdo,
            'adventurer_parties',
            'room_ticks',
            'ALTER TABLE adventurer_parties ADD COLUMN room_ticks INT DEFAULT 0'
        );
        $this->ensureColumn(
            $pdo,
            'adventurer_parties',
            'monsters_defeated',
            'ALTER TABLE adventurer_parties ADD COLUMN monsters_defeated INT DEFAULT 0'
        );
    }

    private function ensureGameConstantsExist(PDO $pdo): void
    {
        $integerConstants = [
            ['MAX_ROOMS_PER_FLOOR', 5, 'Maximum number of rooms per floor'],
            ['MAX_LOG_ENTRIES', 50, 'Maximum number of log entries to keep'],
            ['BASE_ROOM_COST', 20, 'Base mana cost to build a room'],
            ['BOSS_ROOM_EXTRA_COST', 50, 'Additional mana cost for boss rooms'],
            ['BASE_MANA_REGEN', 1, 'Base mana regeneration per turn'],
            ['MANA_REGEN_INTERVAL', 1000, 'Mana regeneration interval in milliseconds'],
            ['TIME_ADVANCE_INTERVAL', 3000, 'Gameplay tick interval in milliseconds'],
            ['CORE_ROOM_MANA_BONUS', 2, 'Mana bonus from core room per floor'],
            ['FLOOR_COMPLETE_BONUS', 10, 'Bonus for completing a floor'],
            ['BOSS_DEFEAT_BONUS', 25, 'Bonus for defeating a boss'],
            ['MONSTER_EVOLUTION_COST_BASE', 50, 'Base cost for monster evolution'],
            ['EQUIPMENT_UPGRADE_COST_BASE', 100, 'Base cost for equipment upgrades'],
            ['DEEP_FLOOR_THRESHOLD', 10, 'Floor number when deep floors start'],
            ['PRESTIGE_THRESHOLD', 20, 'Floor number when prestige becomes available'],
            ['MAX_MONSTER_LEVEL', 100, 'Maximum level for monsters'],
            ['MAX_PARTY_SIZE', 4, 'Maximum adventurer party size'],
            ['MIN_PARTY_SIZE', 2, 'Minimum adventurer party size'],
            ['RETREAT_THRESHOLD', 2, 'Casualties before a party retreats'],
            ['TRAIT_UNLOCK_COST', 500, 'Cost to unlock new traits'],
            ['SPECIES_UNLOCK_COST', 1000, 'Cost to unlock new species'],
        ];

        $integerStmt = $pdo->prepare(
            'INSERT INTO game_constants (name, value_int, description) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             value_int = IF(value_int IS NULL, VALUES(value_int), value_int),
             description = IF(description IS NULL, VALUES(description), description)'
        );
        foreach ($integerConstants as $constant) {
            $integerStmt->execute($constant);
        }

        $floatConstants = [
            ['ADVENTURER_SPAWN_CHANCE', 0.05, 'Chance for a party to spawn on an eligible tick'],
            ['BOSS_ROOM_LOOT_MULTIPLIER', 2.0, 'Loot multiplier for boss rooms'],
            ['BOSS_STAT_MULTIPLIER', 2.0, 'Stat multiplier for boss monsters'],
            ['BOSS_ROOM_COST_MULTIPLIER', 2.0, 'Cost multiplier for boss rooms'],
            ['ROOM_UPGRADE_COST_MULTIPLIER', 1.5, 'Multiplier for room upgrade costs'],
            ['LEVEL_SCALING_FORMULA', 1.0, 'Base level scaling factor'],
            ['RETREAT_CHANCE_UNDERLEVELED', 0.3, 'Retreat chance for underleveled adventurers'],
        ];

        $floatStmt = $pdo->prepare(
            'INSERT INTO game_constants (name, value_float, description) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             value_float = IF(value_float IS NULL, VALUES(value_float), value_float),
             description = IF(description IS NULL, VALUES(description), description)'
        );
        foreach ($floatConstants as $constant) {
            $floatStmt->execute($constant);
        }
    }

    private function ensureColumn(PDO $pdo, string $table, string $column, string $alterSql): void
    {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);

        if ((int) $stmt->fetchColumn() === 0) {
            $pdo->exec($alterSql);
        }
    }

    private function createTables(PDO $pdo): void
    {
        $migrationFiles = [
            __DIR__ . '/../../../migrations/001_create_tables.sql',
            __DIR__ . '/../../../migrations/002_equipment_and_data.sql'
        ];

        foreach ($migrationFiles as $migrationFile) {
            if (!file_exists($migrationFile)) {
                throw new \Exception("Migration file not found: {$migrationFile}");
            }

            $sql = file_get_contents($migrationFile);

            // Split SQL by semicolon and execute each statement
            $statements = array_filter(array_map('trim', explode(';', $sql)));

            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    try {
                        $pdo->exec($statement);
                    } catch (PDOException $e) {
                        // Skip if table already exists, data already inserted, or index already exists
                        if (
                            strpos($e->getMessage(), 'already exists') === false &&
                            strpos($e->getMessage(), 'Duplicate entry') === false &&
                            strpos($e->getMessage(), 'Duplicate key name') === false
                        ) {
                            throw $e;
                        }
                    }
                }
            }

            echo "Migration file " . basename($migrationFile) . " executed successfully.\n";
        }
    }

    private function isDatabaseNotFoundError(PDOException $e): bool
    {
        return strpos($e->getMessage(), 'Unknown database') !== false ||
               strpos($e->getMessage(), 'SQLSTATE[HY000] [1049]') !== false;
    }
}
