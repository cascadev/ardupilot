<?php
/**
 * Browsing History API Endpoints
 * Windows app records browsing history
 */

$db = Database::getInstance();
$historyModel = new BrowsingHistory();

// Validate token from header
function getAuthUser() {
    global $db;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        return $db->fetch(
            "SELECT * FROM users WHERE auth_token = ? AND token_expiry > NOW() AND status = 'active'",
            [$token]
        );
    }
    return null;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'record':
        // Record a browsing entry
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $data = [
            'user_id' => $user['id'],
            'url' => $input['url'] ?? '',
            'title' => $input['title'] ?? null,
            'browser' => $input['browser'] ?? null,
            'visit_time' => $input['visit_time'] ?? date('Y-m-d H:i:s'),
            'duration' => $input['duration'] ?? 0,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'machine_name' => $input['machine_name'] ?? null,
            'blocked' => $input['blocked'] ?? 0,
            'block_reason' => $input['block_reason'] ?? null
        ];

        $result = $historyModel->record($data);

        if ($result['success']) {
            apiResponse(true, ['id' => $result['id']], 'History recorded');
        } else {
            apiResponse(false, null, $result['message'], 400);
        }
        break;

    case 'batch':
        // Record multiple entries at once
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $entries = $input['entries'] ?? [];
        if (empty($entries) || !is_array($entries)) {
            apiResponse(false, null, 'Entries array is required', 400);
        }

        $recorded = 0;
        foreach ($entries as $entry) {
            $data = [
                'user_id' => $user['id'],
                'url' => $entry['url'] ?? '',
                'title' => $entry['title'] ?? null,
                'browser' => $entry['browser'] ?? null,
                'visit_time' => $entry['visit_time'] ?? date('Y-m-d H:i:s'),
                'duration' => $entry['duration'] ?? 0,
                'ip_address' => $_SERVER['REMOTE_ADDR'],
                'machine_name' => $entry['machine_name'] ?? null,
                'blocked' => $entry['blocked'] ?? 0,
                'block_reason' => $entry['block_reason'] ?? null
            ];

            $result = $historyModel->record($data);
            if ($result['success']) {
                $recorded++;
            }
        }

        apiResponse(true, ['recorded' => $recorded], "$recorded entries recorded");
        break;

    case 'stats':
        // Get user's browsing statistics
        if ($method !== 'GET') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $stats = $historyModel->getStatistics($user['id']);
        $mostVisited = $historyModel->getMostVisited(10, $user['id']);

        apiResponse(true, [
            'stats' => $stats,
            'most_visited' => $mostVisited
        ], 'Statistics retrieved');
        break;

    default:
        apiResponse(false, null, 'Invalid action', 404);
}
