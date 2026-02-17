<?php

namespace DungeonCore\Infrastructure\Database\MySQL;

use DungeonCore\Domain\Entities\Game;
use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use PDO;

class MySQLGameRepository implements GameRepositoryInterface
{
    /** @var array<string, bool> */
    private array $playerColumns = [];

    public function __construct(private PDO $connection) {}

    public function findBySessionId(string $sessionId): ?Game
    {
        $stmt = $this->connection->prepare(
            'SELECT * FROM players WHERE session_id = ?'
        );
        $stmt->execute([$sessionId]);
        $data = $stmt->fetch();

        return $data ? $this->mapToEntity($data) : null;
    }

    public function save(Game $game): void
    {
        $setParts = [
            'mana = ?',
            'mana_regen = ?',
            'gold = ?',
            'souls = ?',
            'day = ?',
            'hour = ?',
            'status = ?',
        ];
        $params = [
            $game->getMana(),
            $game->getManaRegen(),
            $game->getGold(),
            $game->getSouls(),
            $game->getDay(),
            $game->getHour(),
            $game->getStatus(),
        ];

        if ($this->hasPlayerColumn('unlocked_species')) {
            $setParts[] = 'unlocked_species = ?';
            $params[] = json_encode($game->getUnlockedSpecies());
        }
        if ($this->hasPlayerColumn('species_experience')) {
            $setParts[] = 'species_experience = ?';
            $params[] = json_encode($game->getSpeciesExperience());
        }
        if ($this->hasPlayerColumn('monster_experience')) {
            $setParts[] = 'monster_experience = ?';
            $params[] = json_encode($game->getMonsterExperienceMap());
        }

        $params[] = $game->getId();
        $sql = 'UPDATE players SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
    }

    public function create(string $sessionId): Game
    {
        $columns = ['session_id', 'mana', 'max_mana', 'mana_regen', 'gold', 'souls', 'day', 'hour', 'status'];
        $values = ['?', '?', '?', '?', '?', '?', '?', '?', '?'];
        $params = [$sessionId, 50, 100, 1, 100, 0, 1, 6, 'Open'];

        if ($this->hasPlayerColumn('unlocked_species')) {
            $columns[] = 'unlocked_species';
            $values[] = '?';
            $params[] = '[]';
        }
        if ($this->hasPlayerColumn('species_experience')) {
            $columns[] = 'species_experience';
            $values[] = '?';
            $params[] = '{}';
        }
        if ($this->hasPlayerColumn('monster_experience')) {
            $columns[] = 'monster_experience';
            $values[] = '?';
            $params[] = '{}';
        }

        $sql = sprintf(
            'INSERT INTO players (%s) VALUES (%s)',
            implode(', ', $columns),
            implode(', ', $values)
        );
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);

        $id = $this->connection->lastInsertId();
        return new Game($id, 50, 100, 1, 100, 0, 1, 6, 'Open', [], [], [], 0);
    }

    public function resetGame(int $gameId): void
    {
        error_log("Resetting player state for game ID: $gameId");
        
        $stmt = $this->connection->prepare(
            'UPDATE players SET 
                mana = 50, 
                max_mana = 100, 
                mana_regen = 1, 
                gold = 100, 
                souls = 0, 
                day = 1, 
                hour = 6, 
                status = "Open" 
             WHERE id = ?'
        );
        $stmt->execute([$gameId]);
        
        error_log("Successfully reset player state for game ID: $gameId");
    }

    private function mapToEntity(array $data): Game
    {
        $unlockedSpecies = [];
        $speciesExperience = [];
        $monsterExperience = [];
        
        // Parse JSON fields if they exist
        if (isset($data['unlocked_species']) && !empty($data['unlocked_species'])) {
            $decoded = json_decode($data['unlocked_species'], true);
            if (is_array($decoded)) {
                $unlockedSpecies = $decoded;
            }
        }
        
        if (isset($data['species_experience']) && !empty($data['species_experience'])) {
            $decoded = json_decode($data['species_experience'], true);
            if (is_array($decoded)) {
                $speciesExperience = $decoded;
            }
        }
        
        if (isset($data['monster_experience']) && !empty($data['monster_experience'])) {
            $decoded = json_decode($data['monster_experience'], true);
            if (is_array($decoded)) {
                $monsterExperience = $decoded;
            }
        }

        $game = new Game(
            $data['id'],
            $data['mana'],
            $data['max_mana'],
            $data['mana_regen'],
            $data['gold'],
            $data['souls'],
            $data['day'],
            $data['hour'],
            $data['status'],
            $unlockedSpecies,
            $speciesExperience,
            $monsterExperience,
            0
        );

        $stmt = $this->connection->prepare('SELECT COUNT(*) FROM adventurer_parties WHERE player_id = ? AND retreating = 0');
        $stmt->execute([$data['id']]);
        $activeParties = (int) $stmt->fetchColumn();
        $game->setActivePartyCount($activeParties);

        return $game;
    }

    private function hasPlayerColumn(string $column): bool
    {
        if (empty($this->playerColumns)) {
            $stmt = $this->connection->query('SHOW COLUMNS FROM players');
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                if (isset($row['Field']) && is_string($row['Field'])) {
                    $this->playerColumns[$row['Field']] = true;
                }
            }
        }

        return isset($this->playerColumns[$column]);
    }
}
