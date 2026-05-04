<?php

declare(strict_types=1);

use DungeonCore\Core\Environment;

return [
    'host' => Environment::required('DB_HOST'),
    'port' => (int) (Environment::optional('DB_PORT') ?? '3306'),
    'database' => Environment::required('DB_NAME'),
    'username' => Environment::required('DB_USER'),
    'password' => Environment::required('DB_PASSWORD'),
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
