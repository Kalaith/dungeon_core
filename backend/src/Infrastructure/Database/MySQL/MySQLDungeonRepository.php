<?php

declare(strict_types=1);

namespace DungeonCore\Infrastructure\Database\MySQL;

use DungeonCore\Domain\Entities\Monster;
use DungeonCore\Domain\Repositories\DungeonRepositoryInterface;
use PDO;
use Exception;

class MySQLDungeonRepository implements DungeonRepositoryInterface
{
    public function __construct(private PDO $connection)
    {
    }

    public function addRoom(int $gameId, int $floorNumber, string $roomType, int $position): int
    {
        // Get or create dungeon
        $dungeonId = $this->getDungeonId($gameId);
        error_log("Got dungeon ID: $dungeonId for game ID: $gameId");
// Get or create floor
        $floorId = $this->getFloorId($dungeonId, $floorNumber);
        error_log("Got floor ID: $floorId for dungeon ID: $dungeonId, floor number: $floorNumber");
// If adding a normal/boss room (not entrance or core), we need to maintain core room at the end
        if ($roomType !== 'entrance' && $roomType !== 'core') {
// First, shift any rooms at or after this position to make space
            $stmt = $this->connection->prepare('UPDATE rooms SET position = position + 1
                 WHERE floor_id = ? AND position >= ?');
            $stmt->execute([$floorId, $position]);
            error_log("Shifted rooms at position $position and after on floor $floorId");
        }

        // Add room
        $stmt = $this->connection->prepare('INSERT INTO rooms (floor_id, type, position) VALUES (?, ?, ?)');
        $stmt->execute([$floorId, $roomType, $position]);
        $roomId = (int) $this->connection->lastInsertId();
        error_log("Created room ID: $roomId with type: $roomType, position: $position");
        return $roomId;
    }

    public function getRooms(int $gameId): array
    {
        error_log("Looking for rooms for game ID: $gameId");
        $stmt = $this->connection->prepare('SELECT r.*, f.number as floor_number
             FROM rooms r
             JOIN floors f ON r.floor_id = f.id
             JOIN dungeons d ON f.dungeon_id = d.id
             WHERE d.player_id = ?
             ORDER BY f.number, r.position');
        $stmt->execute([$gameId]);
        $rooms = [];
        while ($data = $stmt->fetch()) {
            error_log("Found room: " . json_encode($data));
            $rooms[] = [
                'id' => (int) $data['id'],
                'type' => (string) $data['type'],
                'position' => (int) $data['position'],
                'floor_number' => (int) $data['floor_number'],
                'explored' => (bool) ($data['explored'] ?? false),
                'loot' => (int) ($data['loot'] ?? 0)
            ];
        }

        error_log("Total rooms found: " . count($rooms));
        return $rooms;
    }

    public function getRoom(int $gameId, int $floorNumber, int $roomPosition): ?array
    {
        $stmt = $this->connection->prepare('SELECT r.*, f.number as floor_number
             FROM rooms r
             JOIN floors f ON r.floor_id = f.id
             JOIN dungeons d ON f.dungeon_id = d.id
             WHERE d.player_id = ? AND f.number = ? AND r.position = ?');
        $stmt->execute([$gameId, $floorNumber, $roomPosition]);
        $data = $stmt->fetch();
        if (!$data) {
            return null;
        }

        return [
            'id' => (int) $data['id'],
            'type' => (string) $data['type'],
            'position' => (int) $data['position'],
            'floor_number' => (int) $data['floor_number'],
            'explored' => (bool) ($data['explored'] ?? false),
            'loot' => (int) ($data['loot'] ?? 0)
        ];
    }

    public function placeMonster(int $roomId, string $monsterType, int $hp, int $maxHp, bool $isBoss): Monster
    {
        $stmt = $this->connection->prepare(
            'INSERT INTO monsters (room_id, type, hp, max_hp, is_boss) VALUES (?, ?, ?, ?, ?)'
        );
// Convert boolean to integer for MySQL
        $isBossInt = $isBoss ? 1 : 0;
        $stmt->execute([$roomId, $monsterType, $hp, $maxHp, $isBossInt]);
        $id = (int) $this->connection->lastInsertId();
        return new Monster($id, $roomId, $monsterType, $hp, $maxHp, true, $isBoss);
    }

    public function getMonsters(int $gameId): array
    {
        $stmt = $this->connection->prepare('SELECT m.* FROM monsters m
             JOIN rooms r ON m.room_id = r.id
             JOIN floors f ON r.floor_id = f.id
             JOIN dungeons d ON f.dungeon_id = d.id
             WHERE d.player_id = ?');
        $stmt->execute([$gameId]);
        $monsters = [];
        while ($data = $stmt->fetch()) {
            $monsters[] = new Monster(
                (int) $data['id'],
                (int) $data['room_id'],
                (string) $data['type'],
                (int) $data['hp'],
                (int) $data['max_hp'],
                (bool) $data['alive'],
                (bool) $data['is_boss']
            );
        }

        return $monsters;
    }

    public function getRoomMonsters(int $gameId, int $floorNumber, int $roomPosition): array
    {
        $stmt = $this->connection->prepare('SELECT m.* FROM monsters m
             JOIN rooms r ON m.room_id = r.id
             JOIN floors f ON r.floor_id = f.id
             JOIN dungeons d ON f.dungeon_id = d.id
             WHERE d.player_id = ? AND f.number = ? AND r.position = ?');
        $stmt->execute([$gameId, $floorNumber, $roomPosition]);
        $monsters = [];
        while ($data = $stmt->fetch()) {
            $monsters[] = new Monster(
                (int) $data['id'],
                (int) $data['room_id'],
                (string) $data['type'],
                (int) $data['hp'],
                (int) $data['max_hp'],
                (bool) $data['alive'],
                (bool) $data['is_boss']
            );
        }

        return $monsters;
    }

    public function respawnMonsters(int $gameId): void
    {
        $stmt = $this->connection->prepare('UPDATE monsters m
             JOIN rooms r ON m.room_id = r.id
             JOIN floors f ON r.floor_id = f.id
             JOIN dungeons d ON f.dungeon_id = d.id
             SET m.hp = m.max_hp, m.alive = 1
             WHERE d.player_id = ?');
        $stmt->execute([$gameId]);
    }

    public function getRoomCapacity(int $roomId): int
    {
        $stmt = $this->connection->prepare('SELECT position FROM rooms WHERE id = ?');
        $stmt->execute([$roomId]);
        $position = $stmt->fetchColumn();
        return (int) $position * 2;
// Room capacity = position * 2
    }

    public function getMonsterCount(int $roomId): int
    {
        $stmt = $this->connection->prepare('SELECT COUNT(*) FROM monsters WHERE room_id = ?');
        $stmt->execute([$roomId]);
        return (int) $stmt->fetchColumn();
    }

    private function getDungeonId(int $gameId): int
    {
        $lockName = "dungeon_core_dungeon_$gameId";
        $stmt = $this->connection->prepare('SELECT GET_LOCK(?, 5)');
        $stmt->execute([$lockName]);
        if ((int) $stmt->fetchColumn() !== 1) {
            throw new Exception("Could not lock dungeon creation for player ID: $gameId");
        }

        try {
            $stmt = $this->connection->prepare(
                'SELECT id FROM dungeons WHERE player_id = ? ORDER BY id LIMIT 1'
            );
            $stmt->execute([$gameId]);
            $dungeonId = $stmt->fetchColumn();
            if (!$dungeonId) {
                $stmt = $this->connection->prepare('INSERT INTO dungeons (player_id) VALUES (?)');
                $stmt->execute([$gameId]);
                $dungeonId = $this->connection->lastInsertId();
            }

            return (int) $dungeonId;
        } finally {
            $stmt = $this->connection->prepare('SELECT RELEASE_LOCK(?)');
            $stmt->execute([$lockName]);
        }
    }

    private function getFloorId(int $dungeonId, int $floorNumber): int
    {
        $stmt = $this->connection->prepare('SELECT id FROM floors WHERE dungeon_id = ? AND number = ?');
        $stmt->execute([$dungeonId, $floorNumber]);
        $floorId = $stmt->fetchColumn();
        if (!$floorId) {
            $stmt = $this->connection->prepare('INSERT INTO floors (dungeon_id, number) VALUES (?, ?)');
            $stmt->execute([$dungeonId, $floorNumber]);
            $floorId = $this->connection->lastInsertId();
        }

        return (int) $floorId;
    }

    public function resetGame(int $gameId): void
    {
        error_log("Resetting game for player ID: $gameId");
        $lockName = "dungeon_core_dungeon_$gameId";
        $stmt = $this->connection->prepare('SELECT GET_LOCK(?, 5)');
        $stmt->execute([$lockName]);
        if ((int) $stmt->fetchColumn() !== 1) {
            throw new Exception("Could not lock dungeon reset for player ID: $gameId");
        }

        try {
        // Start transaction to ensure all or nothing
            $this->connection->beginTransaction();

            // Delete all dungeon structures for this player, including stale duplicate dungeons.
            $stmt = $this->connection->prepare('DELETE m FROM monsters m
                 JOIN rooms r ON m.room_id = r.id
                 JOIN floors f ON r.floor_id = f.id
                 JOIN dungeons d ON f.dungeon_id = d.id
                 WHERE d.player_id = ?');
            $stmt->execute([$gameId]);
            error_log("Deleted monsters for player ID: $gameId");

            $stmt = $this->connection->prepare('DELETE r FROM rooms r
                 JOIN floors f ON r.floor_id = f.id
                 JOIN dungeons d ON f.dungeon_id = d.id
                 WHERE d.player_id = ?');
            $stmt->execute([$gameId]);
            error_log("Deleted rooms for player ID: $gameId");

            $stmt = $this->connection->prepare('DELETE f FROM floors f
                 JOIN dungeons d ON f.dungeon_id = d.id
                 WHERE d.player_id = ?');
            $stmt->execute([$gameId]);
            error_log("Deleted floors for player ID: $gameId");

            $stmt = $this->connection->prepare('DELETE FROM dungeons WHERE player_id = ?');
            $stmt->execute([$gameId]);
            error_log("Deleted dungeons for player ID: $gameId");

            $stmt = $this->connection->prepare('DELETE FROM adventurer_parties WHERE player_id = ?');
            $stmt->execute([$gameId]);
            error_log("Deleted adventurer parties for player ID: $gameId");
            $this->connection->commit();
            error_log("Successfully reset game for player ID: $gameId");
        } catch (Exception $e) {
            $this->connection->rollBack();
            error_log("Failed to reset game for player ID $gameId: " . $e->getMessage());
            throw $e;
        } finally {
            $stmt = $this->connection->prepare('SELECT RELEASE_LOCK(?)');
            $stmt->execute([$lockName]);
        }
    }

    public function getFloorsByGameId(int $gameId): array
    {
        // Get dungeon ID first
        $dungeonId = $this->getDungeonId($gameId);
        $stmt = $this->connection->prepare(
            'SELECT id, dungeon_id, number FROM floors WHERE dungeon_id = ? ORDER BY number'
        );
        $stmt->execute([$dungeonId]);
        $floors = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $floors[] = new \DungeonCore\Domain\Entities\Floor(
                (int) $row['id'],
                (int) $row['dungeon_id'],
                (int) $row['number']
            );
        }

        return $floors;
    }

    public function getRoomsByFloorId(int $floorId): array
    {
        $stmt = $this->connection->prepare(
            'SELECT id, floor_id, type, position FROM rooms WHERE floor_id = ? ORDER BY position'
        );
        $stmt->execute([$floorId]);
        $rooms = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $rooms[] = new \DungeonCore\Domain\Entities\Room(
                (int) $row['id'],
                (int) $row['floor_id'],
                (string) $row['type'],
                (int) $row['position']
            );
        }

        return $rooms;
    }

    public function getMonstersByGameId(int $gameId): array
    {
        // This method already exists as getMonsters, but let's create an alias for clarity
        return $this->getMonsters($gameId);
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }
}
