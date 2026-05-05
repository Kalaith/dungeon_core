<?php

declare(strict_types=1);

namespace DungeonCore\Core;

final class Environment
{
    private static bool $loaded = false;

    /**
     * @param list<string> $paths
     */
    public static function load(array $paths): void
    {
        if (self::$loaded) {
            return;
        }

        foreach ($paths as $path) {
            if (!is_file($path)) {
                continue;
            }

            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines === false) {
                continue;
            }

            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }

                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim(trim($value), "\"'");

                if ($key === '') {
                    continue;
                }

                $existingValue = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
                if (is_string($existingValue) && trim($existingValue) !== '') {
                    continue;
                }

                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
                putenv($key . '=' . $value);
            }
        }

        self::$loaded = true;
    }

    public static function required(string $key): string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if (!is_string($value) || trim($value) === '') {
            throw new \RuntimeException(sprintf('Required environment variable %s is not configured.', $key));
        }

        return trim($value);
    }

    public static function optional(string $key): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        return trim($value);
    }
}
