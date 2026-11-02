<?php
// ITKApp wiki file list. Install: see the ITKApp "Ellenorzes" screen.
// Lists ./files (next to this script). Optional ?dir=sub/folder
 
const APP = 'itkapp-files';
const VERSION = 1;
 
header('Content-Type: application/json; charset=utf-8');
 
function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode(
        ['app' => APP, 'version' => VERSION] + $body,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}
 
$rootDir = realpath(__DIR__ . '/files');
if ($rootDir === false || !is_dir($rootDir)) {
    respond(404, ['error' => 'NO_FILES_DIR']);
}
 
$dir = isset($_GET['dir']) && is_string($_GET['dir']) ? $_GET['dir'] : '';
 
// Hidden segments (.git, .ssh, ...) are never listed.
if (preg_match('#(^|/)\.#', $dir)) {
    respond(400, ['error' => 'INVALID_DIR']);
}
 
$directory = realpath($rootDir . '/' . $dir);
if ($directory === false || !is_dir($directory)
    || ($directory !== $rootDir && !str_starts_with($directory, $rootDir . '/'))) {
    respond(400, ['error' => 'INVALID_DIR']);
}
 
$names = scandir($directory);
if ($names === false) {
    respond(500, ['error' => 'UNREADABLE_DIR']);
}
 
$files = [];
foreach ($names as $name) {
    if ($name[0] === '.') {
        continue;
    }
    $files[] = [
        'name' => $name,
        'type' => is_dir($directory . '/' . $name) ? 'dir' : 'file',
    ];
}
 
respond(200, ['files' => $files]);
 