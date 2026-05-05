<?php

declare(strict_types=1);

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Services\GameLogic;
use DungeonCore\Domain\Entities\Game;
use PDO;

class AdvanceGameplayUseCase
{
    private const BASE_BOREDOM_PER_ADVENTURER = 5;
    private const BOREDOM_RELIEF_PER_MONSTER = 5;
    private const BOREDOM_RELIEF_FROM_LOOT = 20;
    private const MONSTER_EXPERIENCE_REWARD = 10;
    private const ROOM_TICKS_TO_ADVANCE = 2;

    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private GameLogic $gameLogic,
        private PDO $connection
    ) {
    }

    public function execute(string $sessionId): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        if (!$game) {
            return ['success' => false, 'error' => 'Game not found'];
        }

        $events = [];
        $lockName = "dungeon_core_dungeon_{$game->getId()}";
        $stmt = $this->connection->prepare('SELECT GET_LOCK(?, 5)');
        $stmt->execute([$lockName]);
        if ((int) $stmt->fetchColumn() !== 1) {
            throw new \RuntimeException("Could not lock gameplay advance for game ID: {$game->getId()}");
        }

        try {
            $game = $this->gameRepo->findBySessionId($sessionId);
            if (!$game) {
                return ['success' => false, 'error' => 'Game not found'];
            }

            if ($game->isCoreDestroyed()) {
                return [
                    'success' => true,
                    'events' => [],
                    'tickApplied' => false,
                    'activeAdventurerParties' => $game->getActivePartyCount(),
                    'coreIntegrity' => $game->getCoreIntegrity(),
                    'coreDestroyed' => true
                ];
            }

            $this->connection->beginTransaction();
            if (!$this->claimGameplayTick($game->getId())) {
                $game->setActivePartyCount($this->activePartyCount($game->getId()));
                $this->connection->commit();
                return [
                    'success' => true,
                    'events' => [],
                    'tickApplied' => false,
                    'activeAdventurerParties' => $game->getActivePartyCount(),
                    'coreIntegrity' => $game->getCoreIntegrity(),
                    'coreDestroyed' => $game->isCoreDestroyed()
                ];
            }

            $game->advanceTime();
            $game->addMana($game->getManaRegen());
            $hadActiveParties = $this->activePartyCount($game->getId()) > 0;
            $this->processParties($game->getId(), $events, $game);
            $activePartyCount = $this->activePartyCount($game->getId());

            if ($game->getStatus() === 'Closing' && $activePartyCount === 0) {
                $game->setStatus('Closed');
                $events[] = [
                    'type' => 'system',
                    'message' => 'Dungeon is now closed to new adventurers.'
                ];
            }

            if (
                !$hadActiveParties &&
                !$game->isCoreDestroyed() &&
                $game->getStatus() === 'Open' &&
                $activePartyCount === 0
            ) {
                $this->appendMonsterRevivalEvent(
                    $this->respawnMonstersIfNoParties($game->getId()),
                    $events
                );
                $this->spawnParty($game->getId(), $game->getHour(), $events);
                $activePartyCount = $this->activePartyCount($game->getId());
            }

            $game->setActivePartyCount($activePartyCount);
            $this->gameRepo->save($game);
            $this->markGameplayTickApplied($game->getId());
            $this->connection->commit();
        } catch (\Throwable $exception) {
            if ($this->connection->inTransaction()) {
                $this->connection->rollBack();
            }

            throw $exception;
        } finally {
            $stmt = $this->connection->prepare('SELECT RELEASE_LOCK(?)');
            $stmt->execute([$lockName]);
        }

        return [
            'success' => true,
            'events' => $events,
            'tickApplied' => true,
            'activeAdventurerParties' => $game->getActivePartyCount(),
            'coreIntegrity' => $game->getCoreIntegrity(),
            'coreDestroyed' => $game->isCoreDestroyed()
        ];
    }

    private function claimGameplayTick(int $gameId): bool
    {
        $intervalMicros = $this->gameplayTickIntervalMs() * 1000;
        $stmt = $this->connection->prepare(
            'SELECT last_advanced_at,
                    TIMESTAMPDIFF(MICROSECOND, last_advanced_at, NOW(6)) AS elapsed_micros
             FROM players
             WHERE id = ?
             FOR UPDATE'
        );
        $stmt->execute([$gameId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            throw new \RuntimeException("Game row not found for ID: $gameId");
        }

        if ($row['last_advanced_at'] === null) {
            return true;
        }

        return (int) $row['elapsed_micros'] >= $intervalMicros;
    }

    private function markGameplayTickApplied(int $gameId): void
    {
        $stmt = $this->connection->prepare('UPDATE players SET last_advanced_at = NOW(6) WHERE id = ?');
        $stmt->execute([$gameId]);
    }

    private function gameplayTickIntervalMs(): int
    {
        $stmt = $this->connection->prepare(
            "SELECT COALESCE(value_int, value_float, CAST(value_string AS DECIMAL(10, 2)))
             FROM game_constants
             WHERE name = 'TIME_ADVANCE_INTERVAL'"
        );
        $stmt->execute();
        $value = $stmt->fetchColumn();
        if ($value === false || !is_numeric($value) || (int) $value <= 0) {
            throw new \RuntimeException('TIME_ADVANCE_INTERVAL must be configured as a positive game constant');
        }

        return (int) $value;
    }

    private function processParties(int $gameId, array &$events, Game $game): void
    {
        $parties = $this->fetchActiveParties($gameId);
        $roomsByFloor = $this->fetchRoomsByFloor($gameId);

        foreach ($parties as $party) {
            $floorRooms = $roomsByFloor[(int) $party['current_floor']] ?? [];
            if (empty($floorRooms)) {
                continue;
            }

            $currentRoom = $this->findRoom($floorRooms, (int) $party['current_room']);
            if ($currentRoom === null) {
                $this->movePartyToRoom(
                    (int) $party['id'],
                    (int) $floorRooms[0]['position'],
                    (int) $party['boredom'],
                    (int) $party['loot'],
                    (int) ($party['monsters_defeated'] ?? 0)
                );
                $events[] = [
                    'type' => 'adventure',
                    'message' => 'Adventurers regrouped at the dungeon entrance.'
                ];
                continue;
            }

            $roomTicks = (int) ($party['room_ticks'] ?? 0);
            $aliveMonsters = $this->fetchAliveMonsters((int) $currentRoom['id']);
            if (!empty($aliveMonsters)) {
                $loot = (int) $party['loot'];
                $monstersCleared = count($aliveMonsters);
                $monstersDefeated = (int) ($party['monsters_defeated'] ?? 0) + $monstersCleared;
                foreach ($aliveMonsters as $monster) {
                    $this->defeatMonster((int) $monster['id']);
                    $loot += ((int) $monster['is_boss'] === 1 ? 50 : 20);
                    $this->grantMonsterExperience($game, (string) $monster['type']);
                }

                $boredom = $this->boredomAfterRoom($party, $currentRoom, $floorRooms, $monstersDefeated);
                $events[] = [
                    'type' => 'combat',
                    'message' => sprintf(
                        'Adventurers cleared %d defender%s. Run boredom is %d%%.',
                        $monstersCleared,
                        $monstersCleared === 1 ? '' : 's',
                        $boredom
                    )
                ];
                $this->advancePartyAfterRoom(
                    $game,
                    $party,
                    $floorRooms,
                    $currentRoom,
                    $loot,
                    $boredom,
                    $monstersDefeated,
                    $events
                );
                continue;
            }

            if ((string) $currentRoom['type'] === 'core') {
                $this->resolveCoreDeparture(
                    $game,
                    (int) $party['id'],
                    (int) $party['loot'],
                    (int) $party['boredom'],
                    $events
                );
                continue;
            }

            $roomTicks++;
            $ticksToAdvance = $this->roomAddsBoredom($currentRoom, $floorRooms) ? self::ROOM_TICKS_TO_ADVANCE : 1;
            if ($roomTicks < $ticksToAdvance) {
                $this->updatePartyProgress(
                    (int) $party['id'],
                    (int) $party['boredom'],
                    (int) $party['loot'],
                    $roomTicks,
                    (int) ($party['monsters_defeated'] ?? 0)
                );
                $events[] = [
                    'type' => 'adventure',
                    'message' => sprintf('Adventurers search the room. Boredom remains %d%%.', (int) $party['boredom'])
                ];
                continue;
            }

            $monstersDefeated = (int) ($party['monsters_defeated'] ?? 0);
            $boredom = $this->boredomAfterRoom($party, $currentRoom, $floorRooms, $monstersDefeated);
            $this->advancePartyAfterRoom(
                $game,
                $party,
                $floorRooms,
                $currentRoom,
                (int) $party['loot'],
                $boredom,
                $monstersDefeated,
                $events
            );
        }
    }

    private function advancePartyAfterRoom(
        Game $game,
        array $party,
        array $floorRooms,
        array $currentRoom,
        int $loot,
        int $boredom,
        int $monstersDefeated,
        array &$events
    ): void {
        $partyId = (int) $party['id'];
        $nextRoom = $this->nextRoom($floorRooms, (int) $currentRoom['position']);

        if ($nextRoom === null) {
            $revivedMonsters = $this->finishParty($game, $partyId, $loot);
            $events[] = [
                'type' => 'adventure',
                'message' => 'An adventurer party left the dungeon.'
            ];
            $this->appendMonsterRevivalEvent($revivedMonsters, $events);
            return;
        }

        if ((string) $nextRoom['type'] === 'core') {
            if ($boredom >= 100) {
                $this->destroyCore($game, $partyId, $loot, $events);
                return;
            }

            $this->movePartyToRoom($partyId, (int) $nextRoom['position'], $boredom, $loot, $monstersDefeated);
            $events[] = [
                'type' => 'adventure',
                'message' => sprintf('Adventurers reached the core with %d%% boredom.', $boredom)
            ];
            return;
        }

        $this->movePartyToRoom($partyId, (int) $nextRoom['position'], $boredom, $loot, $monstersDefeated);
        $events[] = [
            'type' => 'adventure',
            'message' => sprintf('Adventurers advanced with %d%% boredom.', $boredom)
        ];
    }

    private function boredomAfterRoom(array $party, array $currentRoom, array $floorRooms, int $monstersDefeated): int
    {
        $boredom = (int) $party['boredom'];
        if (!$this->roomAddsBoredom($currentRoom, $floorRooms)) {
            return $boredom;
        }

        $partySize = max(1, $this->adventurerCount((int) $party['id']));
        $boredom = max(
            0,
            ($partySize * self::BASE_BOREDOM_PER_ADVENTURER)
            - ($monstersDefeated * self::BOREDOM_RELIEF_PER_MONSTER)
        );
        $boredom = min(100, $boredom);

        if ((int) $currentRoom['loot'] > 0) {
            return max(0, $boredom - self::BOREDOM_RELIEF_FROM_LOOT);
        }

        return $boredom;
    }

    private function roomAddsBoredom(array $currentRoom, array $floorRooms): bool
    {
        $roomType = (string) $currentRoom['type'];
        if ($roomType === 'normal' || $roomType === 'boss') {
            return true;
        }

        if ($roomType !== 'entrance') {
            return false;
        }

        foreach ($floorRooms as $room) {
            $type = (string) $room['type'];
            if ($type === 'normal' || $type === 'boss') {
                return false;
            }
        }

        return true;
    }

    private function adventurerCount(int $partyId): int
    {
        $stmt = $this->connection->prepare(
            'SELECT COUNT(*) FROM adventurers WHERE party_id = ?'
        );
        $stmt->execute([$partyId]);

        return (int) $stmt->fetchColumn();
    }

    private function resolveCoreDeparture(Game $game, int $partyId, int $loot, int $boredom, array &$events): void
    {
        if ($boredom >= 100) {
            $this->destroyCore($game, $partyId, $loot, $events);
            return;
        }

        $revivedMonsters = $this->finishParty($game, $partyId, $loot);
        $events[] = [
            'type' => 'adventure',
            'message' => sprintf('Adventurers left the core with %d%% boredom and did not damage it.', $boredom)
        ];
        $this->appendMonsterRevivalEvent($revivedMonsters, $events);
    }

    private function destroyCore(Game $game, int $partyId, int $loot, array &$events): void
    {
        $game->setCoreIntegrity(0);
        $this->finishParty($game, $partyId, $loot);
        $events[] = [
            'type' => 'adventure',
            'message' => 'A bored party reached 100% boredom at the core and destroyed it.'
        ];
    }

    private function spawnParty(int $gameId, int $hour, array &$events): void
    {
        $targetFloor = max(1, $this->maxFloor($gameId));
        $stmt = $this->connection->prepare(
            'INSERT INTO adventurer_parties (
                player_id,
                current_floor,
                current_room,
                retreating,
                casualties,
                loot,
                boredom,
                room_ticks,
                monsters_defeated,
                entry_time,
                target_floor
            )
             VALUES (?, 1, 0, 0, 0, 0, 0, 0, 0, ?, ?)'
        );
        $stmt->execute([$gameId, $hour, $targetFloor]);
        $partyId = (int) $this->connection->lastInsertId();

        $classes = [
            ['Warrior', 1, 100],
            ['Rogue', 2, 80],
            ['Mage', 3, 60],
        ];
        foreach ($classes as [$name, $level, $hp]) {
            $insert = $this->connection->prepare(
                'INSERT INTO adventurers (party_id, name, class_name, level, hp, max_hp, alive)
                 VALUES (?, ?, ?, ?, ?, ?, 1)'
            );
            $insert->execute([$partyId, $this->randomName(), $name, $level, $hp, $hp]);
        }

        $events[] = [
            'type' => 'adventure',
            'message' => 'A new adventurer party entered the dungeon.'
        ];
    }

    private function finishParty(Game $game, int $partyId, int $loot): int
    {
        if ($loot > 0) {
            $game->addGold($loot);
        }

        $stmt = $this->connection->prepare('DELETE FROM adventurer_parties WHERE id = ?');
        $stmt->execute([$partyId]);
        return $this->respawnMonstersIfNoParties($game->getId());
    }

    private function grantMonsterExperience(Game $game, string $monsterType): void
    {
        $game->addMonsterExperience($monsterType, self::MONSTER_EXPERIENCE_REWARD);
        $monsterStats = $this->gameLogic->getMonsterStats($monsterType);
        $speciesName = $monsterStats['species'] ?? null;
        if (is_string($speciesName) && $speciesName !== '') {
            $game->addSpeciesExperience($speciesName, self::MONSTER_EXPERIENCE_REWARD);
        }
    }

    private function fetchActiveParties(int $gameId): array
    {
        $stmt = $this->connection->prepare(
            'SELECT * FROM adventurer_parties WHERE player_id = ? AND retreating = 0 ORDER BY id'
        );
        $stmt->execute([$gameId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function fetchRoomsByFloor(int $gameId): array
    {
        $stmt = $this->connection->prepare(
            'SELECT r.id, r.type, r.position, r.loot, f.number AS floor_number
             FROM rooms r
             JOIN floors f ON r.floor_id = f.id
             JOIN dungeons d ON f.dungeon_id = d.id
             WHERE d.player_id = ?
             ORDER BY f.number, r.position'
        );
        $stmt->execute([$gameId]);

        $roomsByFloor = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $room) {
            $roomsByFloor[(int) $room['floor_number']][] = $room;
        }

        return $roomsByFloor;
    }

    private function fetchAliveMonsters(int $roomId): array
    {
        $stmt = $this->connection->prepare('SELECT * FROM monsters WHERE room_id = ? AND alive = 1');
        $stmt->execute([$roomId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function defeatMonster(int $monsterId): void
    {
        $stmt = $this->connection->prepare('UPDATE monsters SET alive = 0, hp = 0 WHERE id = ?');
        $stmt->execute([$monsterId]);
    }

    private function updatePartyProgress(
        int $partyId,
        int $boredom,
        int $loot,
        int $roomTicks,
        int $monstersDefeated
    ): void {
        $stmt = $this->connection->prepare(
            'UPDATE adventurer_parties
             SET boredom = ?, loot = ?, room_ticks = ?, monsters_defeated = ?
             WHERE id = ?'
        );
        $stmt->execute([$boredom, $loot, $roomTicks, $monstersDefeated, $partyId]);
    }

    private function movePartyToRoom(
        int $partyId,
        int $roomPosition,
        int $boredom,
        int $loot,
        int $monstersDefeated
    ): void {
        $stmt = $this->connection->prepare(
            'UPDATE adventurer_parties
             SET current_room = ?, boredom = ?, loot = ?, monsters_defeated = ?, room_ticks = 0
             WHERE id = ?'
        );
        $stmt->execute([$roomPosition, $boredom, $loot, $monstersDefeated, $partyId]);
    }

    private function respawnMonstersIfNoParties(int $gameId): int
    {
        if ($this->activePartyCount($gameId) > 0) {
            return 0;
        }

        $stmt = $this->connection->prepare(
            'UPDATE monsters m
             JOIN rooms r ON m.room_id = r.id
             JOIN floors f ON r.floor_id = f.id
             JOIN dungeons d ON f.dungeon_id = d.id
             SET m.hp = m.max_hp, m.alive = 1
             WHERE d.player_id = ?'
        );
        $stmt->execute([$gameId]);

        return $stmt->rowCount();
    }

    private function appendMonsterRevivalEvent(int $revivedMonsters, array &$events): void
    {
        if ($revivedMonsters <= 0) {
            return;
        }

        $events[] = [
            'type' => 'system',
            'message' => sprintf(
                '%d defeated monster%s revived for the next adventurer visit.',
                $revivedMonsters,
                $revivedMonsters === 1 ? '' : 's'
            )
        ];
    }

    private function activePartyCount(int $gameId): int
    {
        $stmt = $this->connection->prepare(
            'SELECT COUNT(*) FROM adventurer_parties WHERE player_id = ? AND retreating = 0'
        );
        $stmt->execute([$gameId]);
        return (int) $stmt->fetchColumn();
    }

    private function maxFloor(int $gameId): int
    {
        $stmt = $this->connection->prepare(
            'SELECT COALESCE(MAX(f.number), 1)
             FROM floors f
             JOIN dungeons d ON f.dungeon_id = d.id
             WHERE d.player_id = ?'
        );
        $stmt->execute([$gameId]);
        return (int) $stmt->fetchColumn();
    }

    private function findRoom(array $rooms, int $position): ?array
    {
        foreach ($rooms as $room) {
            if ((int) $room['position'] === $position) {
                return $room;
            }
        }

        return null;
    }

    private function nextRoom(array $rooms, int $position): ?array
    {
        foreach ($rooms as $room) {
            if ((int) $room['position'] > $position) {
                return $room;
            }
        }

        return null;
    }

    private function randomName(): string
    {
        $names = ['Aiden', 'Bella', 'Cora', 'Derek', 'Elena', 'Finn', 'Grace', 'Hugo'];
        return $names[array_rand($names)];
    }
}
