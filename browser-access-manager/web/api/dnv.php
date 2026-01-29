<?php
/**
 * DNV Websites API Endpoints
 */

$db = Database::getInstance();
$dnvModel = new DNVWebsite();

$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        // Get all active blocked URLs
        if ($method !== 'GET') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $urls = $dnvModel->getActiveBlockedUrls();

        apiResponse(true, [
            'urls' => array_column($urls, 'url'),
            'count' => count($urls)
        ], 'DNV list retrieved');
        break;

    default:
        apiResponse(false, null, 'Invalid action', 404);
}
