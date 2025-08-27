<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables from .env file if it exists
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0 || strpos($line, '=') === false) {
            continue; // Skip comments and invalid lines
        }
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

use Slim\Factory\AppFactory;
use DungeonCore\Controllers\GameController;
use DungeonCore\Controllers\DungeonController;
use DungeonCore\Controllers\DataController;
use DungeonCore\Application\UseCases\GetGameStateUseCase;
use DungeonCore\Application\UseCases\GetDungeonStateUseCase;
use DungeonCore\Application\UseCases\PlaceMonsterUseCase;
use DungeonCore\Application\UseCases\AddRoomUseCase;
use DungeonCore\Application\UseCases\InitializeGameUseCase;
use DungeonCore\Application\UseCases\ResetGameUseCase;
use DungeonCore\Application\UseCases\UnlockMonsterSpeciesUseCase;
use DungeonCore\Application\UseCases\GainMonsterExperienceUseCase;
use DungeonCore\Application\UseCases\GetAvailableMonstersUseCase;
use DungeonCore\Application\UseCases\GetGameConstantsUseCase;
use DungeonCore\Application\UseCases\GetMonsterTypesUseCase;
use DungeonCore\Application\UseCases\GetMonsterTraitsUseCase;
use DungeonCore\Application\UseCases\GetEquipmentDataUseCase;
use DungeonCore\Application\UseCases\GetFloorScalingUseCase;
use DungeonCore\Infrastructure\Database\MySQL\MySQLGameRepository;
use DungeonCore\Infrastructure\Database\MySQL\MySQLDungeonRepository;
use DungeonCore\Infrastructure\Database\MySQL\MySQLEquipmentRepository;
use DungeonCore\Infrastructure\Database\MySQL\MySQLDataRepository;
use DungeonCore\Infrastructure\Database\DatabaseInitializer;
use DungeonCore\Domain\Services\GameLogic;

// Database connection with auto-initialization
$config = require __DIR__ . '/../config/database.php';
$dbInitializer = new DatabaseInitializer($config);
$pdo = $dbInitializer->initialize();

// Repositories
$gameRepo = new MySQLGameRepository($pdo);
$dungeonRepo = new MySQLDungeonRepository($pdo);
$equipmentRepo = new MySQLEquipmentRepository($pdo);
$dataRepo = new MySQLDataRepository($pdo);

// Services
$gameLogic = new GameLogic();

// Use Cases
$getGameStateUseCase = new GetGameStateUseCase($gameRepo, $dungeonRepo);
$getDungeonStateUseCase = new GetDungeonStateUseCase($gameRepo, $dungeonRepo);
$placeMonsterUseCase = new PlaceMonsterUseCase($gameRepo, $dungeonRepo, $gameLogic);
$addRoomUseCase = new AddRoomUseCase($gameRepo, $dungeonRepo);
$initializeGameUseCase = new InitializeGameUseCase($gameRepo, $dungeonRepo);
$resetGameUseCase = new ResetGameUseCase($gameRepo, $dungeonRepo);
$unlockMonsterSpeciesUseCase = new UnlockMonsterSpeciesUseCase($gameRepo, $gameLogic);
$gainMonsterExperienceUseCase = new GainMonsterExperienceUseCase($gameRepo, $gameLogic);
$getAvailableMonstersUseCase = new GetAvailableMonstersUseCase($gameRepo, $gameLogic);

// Data Use Cases
$getGameConstantsUseCase = new GetGameConstantsUseCase($dataRepo);
$getMonsterTypesUseCase = new GetMonsterTypesUseCase($dataRepo);
$getMonsterTraitsUseCase = new GetMonsterTraitsUseCase($dataRepo);
$getEquipmentDataUseCase = new GetEquipmentDataUseCase($equipmentRepo);
$getFloorScalingUseCase = new GetFloorScalingUseCase($dataRepo);

// Controllers
$gameController = new GameController(
    $getGameStateUseCase, 
    $placeMonsterUseCase, 
    $initializeGameUseCase,
    $resetGameUseCase,
    $unlockMonsterSpeciesUseCase,
    $gainMonsterExperienceUseCase,
    $getAvailableMonstersUseCase
);
$dungeonController = new DungeonController($addRoomUseCase, $getDungeonStateUseCase);
$dataController = new DataController(
    $getGameConstantsUseCase,
    $getMonsterTypesUseCase,
    $getMonsterTraitsUseCase,
    $getEquipmentDataUseCase,
    $getFloorScalingUseCase
);

// Create Slim app
$app = AppFactory::create();

// Add CORS middleware - this MUST be the first middleware
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization, X-Session-ID')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

// Handle preflight requests first
$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

// Routes
$app->get('/api/game/initialize', [$gameController, 'initialize']);
$app->get('/api/game/state', [$gameController, 'getState']);
$app->post('/api/game/place-monster', [$gameController, 'placeMonster']);
$app->post('/api/game/reset', [$gameController, 'resetGame']);
$app->post('/api/game/unlock-species', [$gameController, 'unlockMonsterSpecies']);
$app->post('/api/game/gain-experience', [$gameController, 'gainMonsterExperience']);
$app->get('/api/game/available-monsters', [$gameController, 'getAvailableMonsters']);
$app->get('/api/dungeon/state', [$dungeonController, 'getDungeonState']);
$app->post('/api/dungeon/add-room', [$dungeonController, 'addRoom']);

// Data endpoints
$app->get('/api/data/game-constants', [$dataController, 'getGameConstants']);
$app->get('/api/data/monster-types', [$dataController, 'getMonsterTypes']);
$app->get('/api/data/monster-traits', [$dataController, 'getMonsterTraits']);
$app->get('/api/data/equipment', [$dataController, 'getEquipmentData']);
$app->get('/api/data/floor-scaling', [$dataController, 'getFloorScaling']);

$app->run();