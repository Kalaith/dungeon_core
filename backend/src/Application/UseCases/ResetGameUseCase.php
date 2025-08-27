<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Infrastructure\Database\MySQL\MySQLDungeonRepository;
use Exception;

class ResetGameUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepository,
        private MySQLDungeonRepository $dungeonRepository
    ) {}

    public function execute(string $sessionId): array
    {
        error_log("ResetGameUseCase: Starting game reset for session: $sessionId");
        
        // Find existing game by session
        $game = $this->gameRepository->findBySessionId($sessionId);
        
        if (!$game) {
            error_log("ResetGameUseCase: No game found for session: $sessionId");
            return [
                'success' => false,
                'error' => 'No game found to reset'
            ];
        }
        
        $gameId = $game->getId();
        error_log("ResetGameUseCase: Found game ID: $gameId");
        
        try {
            // Reset all dungeon data (rooms, monsters, floors, etc.)
            $this->dungeonRepository->resetGame($gameId);
            error_log("ResetGameUseCase: Dungeon data reset completed");
            
            // Reset player game state to initial values
            $this->gameRepository->resetGame($gameId);
            error_log("ResetGameUseCase: Player state reset completed");
            
            // Now reinitialize the game with fresh data
            $initializeUseCase = new InitializeGameUseCase($this->gameRepository, $this->dungeonRepository);
            $gameData = $initializeUseCase->execute($sessionId);
            
            error_log("ResetGameUseCase: Game reinitialization completed");
            
            return [
                'success' => true,
                'message' => 'Game reset successfully',
                'gameData' => $gameData
            ];
            
        } catch (Exception $e) {
            error_log("ResetGameUseCase: Error during reset: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to reset game: ' . $e->getMessage()
            ];
        }
    }
}
