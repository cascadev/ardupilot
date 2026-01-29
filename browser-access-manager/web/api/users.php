<?php
/**
 * Users API Endpoints
 */

$db = Database::getInstance();
$userModel = new User();

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
    case 'profile':
        // Get current user profile
        if ($method !== 'GET') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        apiResponse(true, [
            'user' => [
                'id' => $user['id'],
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'department' => $user['department'],
                'status' => $user['status']
            ]
        ], 'Profile retrieved');
        break;

    case 'change-password':
        // Change user password
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $user = getAuthUser();
        if (!$user) {
            apiResponse(false, null, 'Unauthorized', 401);
        }

        $currentPassword = $input['current_password'] ?? '';
        $newPassword = $input['new_password'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            apiResponse(false, null, 'Current and new passwords are required', 400);
        }

        if (!password_verify($currentPassword, $user['password'])) {
            apiResponse(false, null, 'Current password is incorrect', 400);
        }

        if (strlen($newPassword) < PASSWORD_MIN_LENGTH) {
            apiResponse(false, null, 'Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters', 400);
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $db->update('users', ['password' => $hashedPassword], 'id = :id', ['id' => $user['id']]);

        apiResponse(true, null, 'Password changed successfully');
        break;

    default:
        apiResponse(false, null, 'Invalid action', 404);
}
