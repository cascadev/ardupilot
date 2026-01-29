<?php
/**
 * Blocked IPs API Endpoints
 */

$db = Database::getInstance();
$ipModel = new BlockedIP();

$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        // Get all active blocked IPs
        if ($method !== 'GET') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $ips = $ipModel->getActiveBlockedIPs();

        apiResponse(true, [
            'ips' => $ips,
            'count' => count($ips)
        ], 'Blocked IPs list retrieved');
        break;

    default:
        apiResponse(false, null, 'Invalid action', 404);
}
