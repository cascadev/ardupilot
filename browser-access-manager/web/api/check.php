<?php
/**
 * URL/IP Check API Endpoints
 * Windows app checks URLs and IPs before allowing access
 */

$db = Database::getInstance();
$dnvModel = new DNVWebsite();
$ipModel = new BlockedIP();

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
    case 'url':
        // Check if URL is blocked
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $url = $input['url'] ?? '';
        if (empty($url)) {
            apiResponse(false, null, 'URL is required', 400);
        }

        $isBlocked = $dnvModel->isBlocked($url);

        apiResponse(true, [
            'url' => $url,
            'blocked' => $isBlocked,
            'reason' => $isBlocked ? 'URL is in DNV (Do Not View) list' : null
        ], $isBlocked ? 'URL is blocked' : 'URL is allowed');
        break;

    case 'ip':
        // Check if IP is blocked
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $ip = $input['ip'] ?? '';
        if (empty($ip)) {
            apiResponse(false, null, 'IP is required', 400);
        }

        $isBlocked = $ipModel->isBlocked($ip);

        apiResponse(true, [
            'ip' => $ip,
            'blocked' => $isBlocked,
            'reason' => $isBlocked ? 'IP address is blocked' : null
        ], $isBlocked ? 'IP is blocked' : 'IP is allowed');
        break;

    case 'batch':
        // Check multiple URLs at once
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $urls = $input['urls'] ?? [];
        if (empty($urls) || !is_array($urls)) {
            apiResponse(false, null, 'URLs array is required', 400);
        }

        $results = [];
        foreach ($urls as $url) {
            $isBlocked = $dnvModel->isBlocked($url);
            $results[] = [
                'url' => $url,
                'blocked' => $isBlocked
            ];
        }

        apiResponse(true, ['results' => $results], 'Batch check completed');
        break;

    case 'blocklist':
        // Get full blocklist (for caching on client)
        if ($method !== 'GET') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $blockedUrls = $dnvModel->getActiveBlockedUrls();
        $blockedIps = $ipModel->getActiveBlockedIPs();

        apiResponse(true, [
            'urls' => array_column($blockedUrls, 'url'),
            'ips' => array_column($blockedIps, 'ip_address'),
            'last_updated' => date('c')
        ], 'Blocklist retrieved');
        break;

    default:
        apiResponse(false, null, 'Invalid action', 404);
}
