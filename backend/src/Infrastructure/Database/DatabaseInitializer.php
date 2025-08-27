<?php

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
            
            return $pdo;
        } catch (PDOException $e) {
            if ($this->isDatabaseNotFoundError($e)) {
                // Database doesn't exist, create it
                $this->createDatabase();
                $pdo = $this->createConnection();
                $this->createTables($pdo);
                return $pdo;
            }
            throw $e;
        }
    }

    private function createConnection(): PDO
    {
        $dsn = "mysql:host={$this->config['host']};port={$this->config['port']};dbname={$this->config['database']};charset={$this->config['charset']}";
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
                        if (strpos($e->getMessage(), 'already exists') === false && 
                            strpos($e->getMessage(), 'Duplicate entry') === false &&
                            strpos($e->getMessage(), 'Duplicate key name') === false) {
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
