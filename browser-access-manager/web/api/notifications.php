<?php
/**
 * Notifications API Endpoints
 * Windows app fetches and acknowledges notifications
 */

$db = Database::getInstance();
$notificationModel = new Notification();

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
    case 'pending':
        // Get pending notifications for user
        if ($method !== 'GET') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $notifications = $notificationModel->getPendingForUser($user['id']);

        apiResponse(true, [
            'notifications' => $notifications,
            'count' => count($notifications)
        ], 'Pending notifications retrieved');
        break;

    case 'delivered':
        // Mark notification as delivered
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $userNotificationId = $input['user_notification_id'] ?? $id;
        if (empty($userNotificationId)) {
            apiResponse(false, null, 'Notification ID is required', 400);
        }

        $notificationModel->markDelivered($userNotificationId);

        apiResponse(true, null, 'Notification marked as delivered');
        break;

    case 'read':
        // Mark notification as read
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $userNotificationId = $input['user_notification_id'] ?? $id;
        if (empty($userNotificationId)) {
            apiResponse(false, null, 'Notification ID is required', 400);
        }

        $notificationModel->markRead($userNotificationId);

        apiResponse(true, null, 'Notification marked as read');
        break;

    case 'acknowledge':
        // Acknowledge notification
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $userNotificationId = $input['user_notification_id'] ?? $id;
        if (empty($userNotificationId)) {
            apiResponse(false, null, 'Notification ID is required', 400);
        }

        $notificationModel->acknowledge($userNotificationId);

        apiResponse(true, null, 'Notification acknowledged');
        break;

    case 'poll':
        // Long polling for real-time notifications
        if ($method !== 'GET') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $timeout = min((int)($_GET['timeout'] ?? 30), 60);
        $lastCheck = $_GET['last_check'] ?? null;

        $startTime = time();
        while (time() - $startTime < $timeout) {
            $notifications = $notificationModel->getPendingForUser($user['id']);
            if (!empty($notifications)) {
                apiResponse(true, [
                    'notifications' => $notifications,
                    'count' => count($notifications)
                ], 'New notifications available');
            }
            sleep(2); // Check every 2 seconds
        }

        apiResponse(true, [
            'notifications' => [],
            'count' => 0
        ], 'No new notifications');
        break;

    default:
        apiResponse(false, null, 'Invalid action', 404);
}
