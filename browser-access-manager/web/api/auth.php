<?php
/**
 * Authentication API Endpoints
 * Handles user login/logout for Windows application
 */

$db = Database::getInstance();

/**
 * Generate auth token
 */
function generateAuthToken() {
    return bin2hex(random_bytes(32));
}

/**
 * Validate auth token
 */
function validateToken($token) {
    global $db;
    $user = $db->fetch(
        "SELECT u.* FROM users u
         WHERE u.auth_token = ? AND u.token_expiry > NOW() AND u.status = 'active'",
        [$token]
    );
    return $user;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get input data
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $machineName = $input['machine_name'] ?? '';
        $ipAddress = $_SERVER['REMOTE_ADDR'];

        if (empty($username) || empty($password)) {
            apiResponse(false, null, 'Username and password are required', 400);
        }

        // Find user
        $user = $db->fetch(
            "SELECT * FROM users WHERE username = ?",
            [$username]
        );

        if (!$user) {
            // Log failed attempt
            $db->insert('login_attempts', [
                'username' => $username,
                'ip_address' => $ipAddress,
                'machine_name' => $machineName,
                'attempt_time' => date('Y-m-d H:i:s'),
                'success' => 0,
                'failure_reason' => 'User not found'
            ]);
            apiResponse(false, null, 'Invalid username or password', 401);
        }

        // Check status
        if ($user['status'] !== 'active') {
            $db->insert('login_attempts', [
                'user_id' => $user['id'],
                'username' => $username,
                'ip_address' => $ipAddress,
                'machine_name' => $machineName,
                'attempt_time' => date('Y-m-d H:i:s'),
                'success' => 0,
                'failure_reason' => 'Account ' . $user['status']
            ]);
            apiResponse(false, null, 'Account is ' . $user['status'], 403);
        }

        // Verify password
        if (!password_verify($password, $user['password'])) {
            $db->insert('login_attempts', [
                'user_id' => $user['id'],
                'username' => $username,
                'ip_address' => $ipAddress,
                'machine_name' => $machineName,
                'attempt_time' => date('Y-m-d H:i:s'),
                'success' => 0,
                'failure_reason' => 'Invalid password'
            ]);
            apiResponse(false, null, 'Invalid username or password', 401);
        }

        // Generate token
        $token = generateAuthToken();
        $expiry = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));

        // Update user
        $db->update('users', [
            'auth_token' => $token,
            'token_expiry' => $expiry,
            'last_login' => date('Y-m-d H:i:s'),
            'last_ip' => $ipAddress,
            'machine_name' => $machineName
        ], 'id = :id', ['id' => $user['id']]);

        // Create session
        $db->insert('user_sessions', [
            'user_id' => $user['id'],
            'session_token' => $token,
            'ip_address' => $ipAddress,
            'machine_name' => $machineName,
            'login_time' => date('Y-m-d H:i:s'),
            'last_activity' => date('Y-m-d H:i:s'),
            'expires_at' => $expiry,
            'status' => 'active'
        ]);

        // Log successful attempt
        $db->insert('login_attempts', [
            'user_id' => $user['id'],
            'username' => $username,
            'ip_address' => $ipAddress,
            'machine_name' => $machineName,
            'attempt_time' => date('Y-m-d H:i:s'),
            'success' => 1
        ]);

        apiResponse(true, [
            'token' => $token,
            'expires_at' => $expiry,
            'user' => [
                'id' => $user['id'],
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email']
            ]
        ], 'Login successful');
        break;

    case 'logout':
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $token = $input['token'] ?? '';
        if (empty($token)) {
            // Try from header
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }

        if (empty($token)) {
            apiResponse(false, null, 'Token is required', 400);
        }

        // Invalidate token
        $db->update('users', [
            'auth_token' => null,
            'token_expiry' => null
        ], 'auth_token = :token', ['token' => $token]);

        // Update session
        $db->update('user_sessions', [
            'status' => 'terminated'
        ], 'session_token = :token', ['token' => $token]);

        apiResponse(true, null, 'Logout successful');
        break;

    case 'validate':
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $token = $input['token'] ?? '';
        if (empty($token)) {
            apiResponse(false, null, 'Token is required', 400);
        }

        $user = validateToken($token);
        if (!$user) {
            apiResponse(false, null, 'Invalid or expired token', 401);
        }

        // Update last activity
        $db->update('user_sessions', [
            'last_activity' => date('Y-m-d H:i:s')
        ], 'session_token = :token AND status = :status', ['token' => $token, 'status' => 'active']);

        apiResponse(true, [
            'valid' => true,
            'user' => [
                'id' => $user['id'],
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'full_name' => $user['full_name']
            ]
        ], 'Token is valid');
        break;

    case 'refresh':
        if ($method !== 'POST') {
            apiResponse(false, null, 'Method not allowed', 405);
        }

        $token = $input['token'] ?? '';
        if (empty($token)) {
            apiResponse(false, null, 'Token is required', 400);
        }

        $user = validateToken($token);
        if (!$user) {
            apiResponse(false, null, 'Invalid or expired token', 401);
        }

        // Generate new token
        $newToken = generateAuthToken();
        $expiry = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));

        $db->update('users', [
            'auth_token' => $newToken,
            'token_expiry' => $expiry
        ], 'id = :id', ['id' => $user['id']]);

        $db->update('user_sessions', [
            'session_token' => $newToken,
            'expires_at' => $expiry,
            'last_activity' => date('Y-m-d H:i:s')
        ], 'session_token = :token', ['token' => $token]);

        apiResponse(true, [
            'token' => $newToken,
            'expires_at' => $expiry
        ], 'Token refreshed');
        break;

    default:
        apiResponse(false, null, 'Invalid action', 404);
}
