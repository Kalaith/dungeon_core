<?php

declare(strict_types=1);

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;

final class LinkGuestAccountUseCase
{
    public function __construct(private GameRepositoryInterface $gameRepository)
    {
    }

    /**
     * @param array<string, mixed> $authUser
     * @return array<string, mixed>
     */
    public function execute(string $guestUserId, array $authUser): array
    {
        if (($authUser['is_guest'] ?? false) === true) {
            return [
                'success' => false,
                'error' => 'Guest sessions cannot link other guest sessions',
            ];
        }

        $targetUserId = (string) ($authUser['id'] ?? '');
        if ($targetUserId === '') {
            return [
                'success' => false,
                'error' => 'Authenticated user is missing an identifier',
            ];
        }

        $linked = $this->gameRepository->moveGuestSaveToUser($guestUserId, $targetUserId);
        if (!$linked) {
            return [
                'success' => false,
                'error' => 'Guest save not found',
            ];
        }

        return [
            'success' => true,
            'data' => [
                'linked' => true,
                'guest_user_id' => $guestUserId,
                'user_id' => $targetUserId,
            ],
        ];
    }
}
