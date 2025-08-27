<?php
require_once __DIR__ . '/vendor/autoload.php';

// Test the new getDungeonState endpoint
echo "Testing getDungeonState endpoint...\n";

$url = 'http://localhost:8000/api/dungeon/state';
$sessionId = 'x5netciu1jmd8tvw1h';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "X-Session-ID: $sessionId\r\n"
    ]
]);

$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Failed to fetch dungeon state\n";
    exit(1);
}

$data = json_decode($response, true);
echo "Response:\n";
echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
echo "Test completed successfully!\n";
?>
