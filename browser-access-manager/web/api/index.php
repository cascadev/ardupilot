<?php
/**
 * Browser Access Management System - API Entry Point
 * All API requests should go through this file
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/config.php';

// API Response helper
function apiResponse($success, $data = null, $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ]);
    exit;
}

// Get request path
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/browser-access-manager/web/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');
$segments = explode('/', $path);

$endpoint = $segments[0] ?? '';
$action = $segments[1] ?? '';
$id = $segments[2] ?? '';

// Route to appropriate handler
switch ($endpoint) {
    case 'auth':
        require_once __DIR__ . '/auth.php';
        break;

    case 'users':
        require_once __DIR__ . '/users.php';
        break;

    case 'dnv':
        require_once __DIR__ . '/dnv.php';
        break;

    case 'ips':
        require_once __DIR__ . '/ips.php';
        break;

    case 'notifications':
        require_once __DIR__ . '/notifications.php';
        break;

    case 'history':
        require_once __DIR__ . '/history.php';
        break;

    case 'check':
        require_once __DIR__ . '/check.php';
        break;

    case 'status':
        apiResponse(true, ['version' => APP_VERSION, 'status' => 'online'], 'API is running');
        break;

    default:
        apiResponse(false, null, 'Invalid endpoint', 404);
}
