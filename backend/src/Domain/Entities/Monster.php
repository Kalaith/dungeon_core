<?php

namespace DungeonCore\Domain\Entities;

class Monster
{
    public function __construct(
        private int $id,
        private int $roomId,
        private string $type,
        private int $hp,
        private int $maxHp,
        private bool $alive = true,
        private bool $isBoss = false
    ) {}

    public function getId(): int { return $this->id; }
    public function getRoomId(): int { return $this->roomId; }
    public function getType(): string { return $this->type; }
    public function getHp(): int { return $this->hp; }
    public function getMaxHp(): int { return $this->maxHp; }
    public function isAlive(): bool { return $this->alive; }
    public function isBoss(): bool { return $this->isBoss; }

    public function takeDamage(int $damage): void
    {
        $this->hp = max(0, $this->hp - $damage);
        if ($this->hp <= 0) {
            $this->alive = false;
        }
    }

    public function heal(): void
    {
        $this->hp = $this->maxHp;
        $this->alive = true;
    }
}