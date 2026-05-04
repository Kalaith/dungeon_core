<?php

declare(strict_types=1);

namespace DungeonCore\Http;

class Body
{
    private string $contents = '';
    public function write(string $data): void
    {
        $this->contents .= $data;
    }

    public function __toString(): string
    {
        return $this->contents;
    }
}
