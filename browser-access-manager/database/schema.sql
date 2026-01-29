-- Browser Access Management System Database Schema
-- Version: 1.0.0
-- Compatible with MySQL 5.7+ / MariaDB 10.2+

CREATE DATABASE IF NOT EXISTS browser_access_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE browser_access_manager;

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Users Table (Windows App Users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    department VARCHAR(100) NULL,
    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    last_login DATETIME NULL,
    last_ip VARCHAR(45) NULL,
    machine_name VARCHAR(100) NULL,
    auth_token VARCHAR(255) NULL,
    token_expiry DATETIME NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- DNV (Do Not View) Websites Table
CREATE TABLE IF NOT EXISTS dnv_websites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    reason TEXT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    added_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_url (url(255)),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Blocked IP Addresses Table
CREATE TABLE IF NOT EXISTS blocked_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    ip_type ENUM('ipv4', 'ipv6', 'range') DEFAULT 'ipv4',
    reason TEXT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    added_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_ip (ip_address),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'alert', 'critical') DEFAULT 'info',
    priority INT DEFAULT 1,
    target_type ENUM('all', 'specific', 'department') DEFAULT 'all',
    target_users TEXT NULL,
    target_department VARCHAR(100) NULL,
    status ENUM('draft', 'sent', 'scheduled') DEFAULT 'draft',
    scheduled_at DATETIME NULL,
    sent_at DATETIME NULL,
    expires_at DATETIME NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- User Notifications (for tracking delivery and read status)
CREATE TABLE IF NOT EXISTS user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT NOT NULL,
    user_id INT NOT NULL,
    delivered_at DATETIME NULL,
    read_at DATETIME NULL,
    acknowledged_at DATETIME NULL,
    status ENUM('pending', 'delivered', 'read', 'acknowledged') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_notification (notification_id, user_id)
) ENGINE=InnoDB;

-- Browsing History Table
CREATE TABLE IF NOT EXISTS browsing_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(500) NULL,
    browser VARCHAR(50) NULL,
    visit_time DATETIME NOT NULL,
    duration INT DEFAULT 0,
    ip_address VARCHAR(45) NULL,
    machine_name VARCHAR(100) NULL,
    blocked TINYINT(1) DEFAULT 0,
    block_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_visit_time (visit_time),
    INDEX idx_url (url(255)),
    INDEX idx_blocked (blocked)
) ENGINE=InnoDB;

-- Login Attempts Table (for security monitoring)
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50) NULL,
    ip_address VARCHAR(45) NOT NULL,
    machine_name VARCHAR(100) NULL,
    attempt_time DATETIME NOT NULL,
    success TINYINT(1) DEFAULT 0,
    failure_reason VARCHAR(255) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ip (ip_address),
    INDEX idx_attempt_time (attempt_time)
) ENGINE=InnoDB;

-- Active Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL,
    machine_name VARCHAR(100) NULL,
    browser_info TEXT NULL,
    login_time DATETIME NOT NULL,
    last_activity DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- System Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NULL,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255) NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id INT NULL,
    old_values TEXT NULL,
    new_values TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Default Admin User (password: Admin@123)
INSERT INTO admins (username, password, email, full_name, role, status) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', 'System Administrator', 'super_admin', 'active');

-- Default System Settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('session_timeout', '30', 'integer', 'Session timeout in minutes'),
('max_login_attempts', '5', 'integer', 'Maximum login attempts before lockout'),
('lockout_duration', '15', 'integer', 'Account lockout duration in minutes'),
('password_min_length', '8', 'integer', 'Minimum password length'),
('require_special_char', 'true', 'boolean', 'Require special character in password'),
('notification_check_interval', '30', 'integer', 'Notification check interval in seconds'),
('browsing_history_retention', '90', 'integer', 'Days to retain browsing history'),
('company_name', 'Browser Access Management System', 'string', 'Company/Organization name'),
('support_phone', '+1-3237397719', 'string', 'Support phone number'),
('support_email', 'support@example.com', 'string', 'Support email address');
