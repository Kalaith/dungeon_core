<?php

$autoloadCandidates = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
    __DIR__ . '/../../../vendor/autoload.php',
    __DIR__ . '/../../../../vendor/autoload.php',
];

$autoloadPath = null;
foreach ($autoloadCandidates as $candidate) {
    if (file_exists($candidate)) {
        $autoloadPath = $candidate;
        break;
    }
}

if ($autoloadPath === null) {
    throw new RuntimeException('Composer autoload.php not found from ' . __DIR__);
}

$loader = require_once $autoloadPath;
$projectSrc = realpath(__DIR__ . '/../src');
if ($projectSrc !== false && $loader instanceof \Composer\Autoload\ClassLoader) {
    $loader->addPsr4('DungeonCore\\', $projectSrc . DIRECTORY_SEPARATOR, true);
}

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

use DungeonCore\Core\Router;
use DungeonCore\Controllers\GameController;
use DungeonCore\Controllers\DungeonController;
use DungeonCore\Controllers\DataController;
use DungeonCore\Controllers\AuthController;
use DungeonCore\Application\UseCases\GetGameStateUseCase;
use DungeonCore\Application\UseCases\GetDungeonStateUseCase;
use DungeonCore\Application\UseCases\PlaceMonsterUseCase;
use DungeonCore\Application\UseCases\AddRoomUseCase;
use DungeonCore\Application\UseCases\InitializeGameUseCase;
use DungeonCore\Application\UseCases\ResetGameUseCase;
use DungeonCore\Application\UseCases\UnlockMonsterSpeciesUseCase;
use DungeonCore\Application\UseCases\GainMonsterExperienceUseCase;
use DungeonCore\Application\UseCases\GetAvailableMonstersUseCase;
use DungeonCore\Application\UseCases\UpdateDungeonStatusUseCase;
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
$gameLogic = new GameLogic($dataRepo);

// Use Cases
$getGameStateUseCase = new GetGameStateUseCase($gameRepo, $dungeonRepo, $gameLogic);
$getDungeonStateUseCase = new GetDungeonStateUseCase($gameRepo, $dungeonRepo);
$placeMonsterUseCase = new PlaceMonsterUseCase($gameRepo, $dungeonRepo, $gameLogic);
$addRoomUseCase = new AddRoomUseCase($gameRepo, $dungeonRepo);
$initializeGameUseCase = new InitializeGameUseCase($gameRepo, $dungeonRepo, $gameLogic);
$resetGameUseCase = new ResetGameUseCase($gameRepo, $dungeonRepo, $gameLogic);
$unlockMonsterSpeciesUseCase = new UnlockMonsterSpeciesUseCase($gameRepo, $gameLogic);
$gainMonsterExperienceUseCase = new GainMonsterExperienceUseCase($gameRepo, $gameLogic);
$getAvailableMonstersUseCase = new GetAvailableMonstersUseCase($gameRepo, $gameLogic);
$updateDungeonStatusUseCase = new UpdateDungeonStatusUseCase($gameRepo);

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
    $getAvailableMonstersUseCase,
    $updateDungeonStatusUseCase
);
$dungeonController = new DungeonController($addRoomUseCase, $getDungeonStateUseCase);
$dataController = new DataController(
    $getGameConstantsUseCase,
    $getMonsterTypesUseCase,
    $getMonsterTraitsUseCase,
    $getEquipmentDataUseCase,
    $getFloorScalingUseCase
);

// Router
$router = new Router();

// Set base path for subdirectory deployment
if (isset($_ENV['APP_BASE_PATH']) && $_ENV['APP_BASE_PATH']) {
    $router->setBasePath(rtrim($_ENV['APP_BASE_PATH'], '/'));
} else {
    $requestPath = $_SERVER['REQUEST_URI'] ?? '';
    $requestPath = parse_url($requestPath, PHP_URL_PATH) ?? '';
    $apiPos = strpos($requestPath, '/api');
    if ($apiPos !== false) {
        $basePath = substr($requestPath, 0, $apiPos);
        if ($basePath !== '') {
            $router->setBasePath($basePath);
        }
    } elseif (isset($_SERVER['SCRIPT_NAME'])) {
        $scriptName = $_SERVER['SCRIPT_NAME'];
        $basePath = str_replace('/public/index.php', '', $scriptName);
        if ($basePath !== $scriptName && $basePath !== '') {
            $router->setBasePath($basePath);
        }
    }
}

// Handle CORS preflight
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Origin, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    http_response_code(200);
    exit;
}

// Load routes
(require __DIR__ . '/../src/Routes/router.php')($router, $gameController, $dungeonController, $dataController);

// Run router
$router->handle();
