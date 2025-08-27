<?php

namespace DungeonCore\Domain\Entities;

class Floor
{
    public function __construct(
        private int $id,
        private int $dungeonId,
        private int $number
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getDungeonId(): int
    {
        return $this->dungeonId;
    }

    public function getNumber(): int
    {
        return $this->number;
    }
}
