<?php

namespace DungeonCore\Domain\Entities;

class Game
{
    public function __construct(
        private int $id,
        private int $mana,
        private int $maxMana,
        private int $manaRegen,
        private int $gold,
        private int $souls,
        private int $day,
        private int $hour,
        private string $status = 'Open',
        private array $unlockedSpecies = [],
        private array $speciesExperience = []
    ) {}

    public function getId(): int { return $this->id; }
    public function getMana(): int { return $this->mana; }
    public function getMaxMana(): int { return $this->maxMana; }
    public function getManaRegen(): int { return $this->manaRegen; }
    public function getGold(): int { return $this->gold; }
    public function getSouls(): int { return $this->souls; }
    public function getDay(): int { return $this->day; }
    public function getHour(): int { return $this->hour; }
    public function getStatus(): string { return $this->status; }

    public function spendMana(int $amount): bool
    {
        if ($this->mana < $amount) {
            return false;
        }
        $this->mana -= $amount;
        return true;
    }

    public function addMana(int $amount): void
    {
        $this->mana = min($this->mana + $amount, $this->maxMana);
    }

    public function spendGold(int $amount): bool
    {
        if ($this->gold < $amount) {
            return false;
        }
        $this->gold -= $amount;
        return true;
    }

    public function addGold(int $amount): void
    {
        $this->gold += $amount;
    }

    public function addSouls(int $amount): void
    {
        $this->souls += $amount;
    }

    public function advanceTime(): void
    {
        $this->hour++;
        if ($this->hour >= 24) {
            $this->hour = 0;
            $this->day++;
        }
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    // Species management methods
    public function getUnlockedSpecies(): array
    {
        return $this->unlockedSpecies;
    }

    public function hasUnlockedSpecies(string $speciesName): bool
    {
        return in_array($speciesName, $this->unlockedSpecies);
    }

    public function unlockSpecies(string $speciesName): void
    {
        if (!$this->hasUnlockedSpecies($speciesName)) {
            $this->unlockedSpecies[] = $speciesName;
        }
    }

    public function getSpeciesTotalExperience(string $speciesName): int
    {
        return $this->speciesExperience[$speciesName] ?? 0;
    }

    public function getSpeciesExperience(): array
    {
        return $this->speciesExperience;
    }

    public function addSpeciesExperience(string $speciesName, int $experience): void
    {
        if (!isset($this->speciesExperience[$speciesName])) {
            $this->speciesExperience[$speciesName] = 0;
        }
        $this->speciesExperience[$speciesName] += $experience;
    }

    public function unlockTier(string $speciesName, int $tier): void
    {
        // Implementation for tier unlocking if needed
        // For now, this is a placeholder
    }

    public function hasActiveAdventurers(): bool
    {
        // For now, return false to allow monster placement
        // This can be implemented later when adventurer system is added
        return false;
    }
}