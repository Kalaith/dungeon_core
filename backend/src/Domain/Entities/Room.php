<?php

namespace DungeonCore\Domain\Entities;

class Room
{
    public function __construct(
        private int $id,
        private int $floorId,
        private string $type,
        private int $position
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getFloorId(): int
    {
        return $this->floorId;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getPosition(): int
    {
        return $this->position;
    }
}
