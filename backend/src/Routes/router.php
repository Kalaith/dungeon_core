<?php

use DungeonCore\Core\Router;
use DungeonCore\Controllers\GameController;
use DungeonCore\Controllers\DungeonController;
use DungeonCore\Controllers\DataController;
use DungeonCore\Controllers\AuthController;
use DungeonCore\Middleware\WebHatcheryJwtMiddleware;

return function (
    Router $router,
    GameController $gameController,
    DungeonController $dungeonController,
    DataController $dataController
): void {
    $api = '/api';

    // Auth session
    $router->get($api . '/auth/session', [AuthController::class, 'session'], [WebHatcheryJwtMiddleware::class]);

    // Game routes (protected)
    $router->get($api . '/game/initialize', [$gameController, 'initialize'], [WebHatcheryJwtMiddleware::class]);
    $router->get($api . '/game/state', [$gameController, 'getState'], [WebHatcheryJwtMiddleware::class]);
    $router->post($api . '/game/place-monster', [$gameController, 'placeMonster'], [WebHatcheryJwtMiddleware::class]);
    $router->post($api . '/game/reset', [$gameController, 'resetGame'], [WebHatcheryJwtMiddleware::class]);
    $router->post($api . '/game/unlock-species', [$gameController, 'unlockMonsterSpecies'], [WebHatcheryJwtMiddleware::class]);
    $router->post($api . '/game/gain-experience', [$gameController, 'gainMonsterExperience'], [WebHatcheryJwtMiddleware::class]);
    $router->get($api . '/game/available-monsters', [$gameController, 'getAvailableMonsters'], [WebHatcheryJwtMiddleware::class]);
    $router->post($api . '/game/status', [$gameController, 'updateStatus'], [WebHatcheryJwtMiddleware::class]);

    // Dungeon routes (protected)
    $router->get($api . '/dungeon/state', [$dungeonController, 'getDungeonState'], [WebHatcheryJwtMiddleware::class]);
    $router->post($api . '/dungeon/add-room', [$dungeonController, 'addRoom'], [WebHatcheryJwtMiddleware::class]);

    // Data endpoints (public)
    $router->get($api . '/data/game-constants', [$dataController, 'getGameConstants']);
    $router->get($api . '/data/monster-types', [$dataController, 'getMonsterTypes']);
    $router->get($api . '/data/monster-traits', [$dataController, 'getMonsterTraits']);
    $router->get($api . '/data/equipment', [$dataController, 'getEquipmentData']);
    $router->get($api . '/data/floor-scaling', [$dataController, 'getFloorScaling']);
};
