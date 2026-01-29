<?php
/**
 * Browser Access Management System - Configuration File
 *
 * IMPORTANT: Update these settings before deploying to production
 */

// Error reporting (set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'browser_access_manager');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'Browser Access Management System');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost/browser-access-manager/web');
define('API_URL', 'http://localhost/browser-access-manager/web/api');

// Security Configuration
define('SESSION_LIFETIME', 1800); // 30 minutes
define('CSRF_TOKEN_NAME', 'csrf_token');
define('PASSWORD_MIN_LENGTH', 8);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_DURATION', 900); // 15 minutes in seconds

// API Configuration
define('API_KEY_LENGTH', 64);
define('TOKEN_EXPIRY_HOURS', 24);

// File Paths
define('ROOT_PATH', dirname(__DIR__));
define('INCLUDES_PATH', ROOT_PATH . '/includes');
define('ASSETS_PATH', ROOT_PATH . '/assets');
define('UPLOADS_PATH', ROOT_PATH . '/uploads');

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Start session with secure settings
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
    session_start();
}

// Autoload function for classes
spl_autoload_register(function ($class) {
    $file = INCLUDES_PATH . '/classes/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});
