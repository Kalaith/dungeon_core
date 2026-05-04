<?php

declare(strict_types=1);

use DungeonCore\Application\UseCases\LinkGuestAccountUseCase;
use DungeonCore\Domain\Entities\Game;
use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class LinkGuestAccountUseCaseTest extends TestCase
{
    public function testMovesGuestSaveToAuthenticatedUser(): void
    {
        $repository = new FakeGameRepository(true);
        $useCase = new LinkGuestAccountUseCase($repository);

        $result = $useCase->execute('guest_123', [
            'id' => 'user_456',
            'is_guest' => false,
        ]);

        self::assertTrue($result['success']);
        self::assertSame('guest_123', $repository->movedGuestSessionId);
        self::assertSame('user_456', $repository->movedTargetSessionId);
    }

    public function testRejectsGuestToGuestLinking(): void
    {
        $repository = new FakeGameRepository(true);
        $useCase = new LinkGuestAccountUseCase($repository);

        $result = $useCase->execute('guest_123', [
            'id' => 'guest_456',
            'is_guest' => true,
        ]);

        self::assertFalse($result['success']);
        self::assertNull($repository->movedGuestSessionId);
    }

    public function testReportsMissingGuestSave(): void
    {
        $repository = new FakeGameRepository(false);
        $useCase = new LinkGuestAccountUseCase($repository);

        $result = $useCase->execute('guest_123', [
            'id' => 'user_456',
            'is_guest' => false,
        ]);

        self::assertFalse($result['success']);
        self::assertSame('Guest save not found', $result['error']);
    }
}

final class FakeGameRepository implements GameRepositoryInterface
{
    public ?string $movedGuestSessionId = null;
    public ?string $movedTargetSessionId = null;

    public function __construct(private bool $moveResult)
    {
    }

    public function findBySessionId(string $sessionId): ?Game
    {
        return null;
    }

    public function save(Game $game): void
    {
    }

    public function create(string $sessionId): Game
    {
        throw new RuntimeException('Not used by this test.');
    }

    public function resetGame(int $gameId): void
    {
    }

    public function moveGuestSaveToUser(string $guestSessionId, string $targetSessionId): bool
    {
        $this->movedGuestSessionId = $guestSessionId;
        $this->movedTargetSessionId = $targetSessionId;

        return $this->moveResult;
    }
}
