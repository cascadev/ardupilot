<?php
/**
 * Authentication Class
 * Handles admin authentication, sessions, and security
 */
class Auth {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Authenticate admin user
     */
    public function login($username, $password) {
        // Check for too many failed attempts
        if ($this->isLockedOut($username)) {
            return ['success' => false, 'message' => 'Account temporarily locked due to too many failed attempts. Please try again later.'];
        }

        $admin = $this->db->fetch(
            "SELECT * FROM admins WHERE username = ? AND status = 'active'",
            [$username]
        );

        if ($admin && password_verify($password, $admin['password'])) {
            // Successful login
            $this->clearFailedAttempts($username);
            $this->createSession($admin);
            $this->updateLastLogin($admin['id']);
            $this->logAttempt($admin['id'], $username, true);

            return ['success' => true, 'message' => 'Login successful'];
        }

        // Failed login
        $this->recordFailedAttempt($username);
        $this->logAttempt(null, $username, false);

        return ['success' => false, 'message' => 'Invalid username or password'];
    }

    /**
     * Create admin session
     */
    private function createSession($admin) {
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_username'] = $admin['username'];
        $_SESSION['admin_name'] = $admin['full_name'];
        $_SESSION['admin_role'] = $admin['role'];
        $_SESSION['admin_email'] = $admin['email'];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();

        // Regenerate session ID for security
        session_regenerate_id(true);
    }

    /**
     * Check if user is logged in
     */
    public function isLoggedIn() {
        if (!isset($_SESSION['admin_id'])) {
            return false;
        }

        // Check session timeout
        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_LIFETIME)) {
            $this->logout();
            return false;
        }

        $_SESSION['last_activity'] = time();
        return true;
    }

    /**
     * Require authentication
     */
    public function requireLogin() {
        if (!$this->isLoggedIn()) {
            header('Location: login.php');
            exit;
        }
    }

    /**
     * Logout user
     */
    public function logout() {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
    }

    /**
     * Change admin password
     */
    public function changePassword($adminId, $currentPassword, $newPassword) {
        $admin = $this->db->fetch("SELECT password FROM admins WHERE id = ?", [$adminId]);

        if (!$admin) {
            return ['success' => false, 'message' => 'Admin not found'];
        }

        if (!password_verify($currentPassword, $admin['password'])) {
            return ['success' => false, 'message' => 'Current password is incorrect'];
        }

        // Validate new password
        if (strlen($newPassword) < PASSWORD_MIN_LENGTH) {
            return ['success' => false, 'message' => 'Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters'];
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->db->update('admins', ['password' => $hashedPassword], 'id = :id', ['id' => $adminId]);

        $this->logAction($adminId, 'password_change', 'admins', $adminId);

        return ['success' => true, 'message' => 'Password changed successfully'];
    }

    /**
     * Get current admin info
     */
    public function getCurrentAdmin() {
        if (!$this->isLoggedIn()) {
            return null;
        }
        return [
            'id' => $_SESSION['admin_id'],
            'username' => $_SESSION['admin_username'],
            'name' => $_SESSION['admin_name'],
            'role' => $_SESSION['admin_role'],
            'email' => $_SESSION['admin_email']
        ];
    }

    /**
     * Check if account is locked out
     */
    private function isLockedOut($username) {
        $lockoutTime = date('Y-m-d H:i:s', time() - LOCKOUT_DURATION);
        $result = $this->db->fetch(
            "SELECT COUNT(*) as attempts FROM login_attempts
             WHERE username = ? AND success = 0 AND attempt_time > ?",
            [$username, $lockoutTime]
        );
        return $result['attempts'] >= MAX_LOGIN_ATTEMPTS;
    }

    /**
     * Record failed login attempt
     */
    private function recordFailedAttempt($username) {
        $this->db->insert('login_attempts', [
            'username' => $username,
            'ip_address' => $this->getClientIP(),
            'attempt_time' => date('Y-m-d H:i:s'),
            'success' => 0
        ]);
    }

    /**
     * Clear failed attempts after successful login
     */
    private function clearFailedAttempts($username) {
        $this->db->delete('login_attempts', 'username = ? AND success = 0', [$username]);
    }

    /**
     * Update last login time
     */
    private function updateLastLogin($adminId) {
        $this->db->update('admins', ['last_login' => date('Y-m-d H:i:s')], 'id = :id', ['id' => $adminId]);
    }

    /**
     * Log login attempt
     */
    private function logAttempt($adminId, $username, $success) {
        $this->db->insert('login_attempts', [
            'user_id' => $adminId,
            'username' => $username,
            'ip_address' => $this->getClientIP(),
            'attempt_time' => date('Y-m-d H:i:s'),
            'success' => $success ? 1 : 0,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
    }

    /**
     * Log admin action for audit
     */
    public function logAction($adminId, $action, $table = null, $recordId = null, $oldValues = null, $newValues = null) {
        $this->db->insert('audit_log', [
            'admin_id' => $adminId,
            'action' => $action,
            'table_name' => $table,
            'record_id' => $recordId,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
            'ip_address' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
    }

    /**
     * Get client IP address
     */
    public function getClientIP() {
        $ipAddress = '';
        if (isset($_SERVER['HTTP_CLIENT_IP'])) {
            $ipAddress = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (isset($_SERVER['HTTP_X_FORWARDED'])) {
            $ipAddress = $_SERVER['HTTP_X_FORWARDED'];
        } elseif (isset($_SERVER['HTTP_FORWARDED_FOR'])) {
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (isset($_SERVER['HTTP_FORWARDED'])) {
            $ipAddress = $_SERVER['HTTP_FORWARDED'];
        } elseif (isset($_SERVER['REMOTE_ADDR'])) {
            $ipAddress = $_SERVER['REMOTE_ADDR'];
        }
        return $ipAddress;
    }

    /**
     * Generate CSRF token
     */
    public function generateCSRFToken() {
        if (empty($_SESSION[CSRF_TOKEN_NAME])) {
            $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
        }
        return $_SESSION[CSRF_TOKEN_NAME];
    }

    /**
     * Validate CSRF token
     */
    public function validateCSRFToken($token) {
        return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
    }
}
