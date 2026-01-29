<?php
/**
 * User Management Class
 * Handles Windows app user operations
 */
class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all users with pagination
     */
    public function getAll($page = 1, $limit = 20, $search = '', $status = '') {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = "1=1";

        if ($search) {
            $where .= " AND (username LIKE ? OR full_name LIKE ? OR email LIKE ? OR user_id LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }

        if ($status) {
            $where .= " AND status = ?";
            $params[] = $status;
        }

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM users WHERE $where";
        $total = $this->db->fetch($countSql, $params)['total'];

        // Get users
        $sql = "SELECT u.*, a.username as created_by_name
                FROM users u
                LEFT JOIN admins a ON u.created_by = a.id
                WHERE $where
                ORDER BY u.created_at DESC
                LIMIT $limit OFFSET $offset";
        $users = $this->db->fetchAll($sql, $params);

        return [
            'users' => $users,
            'total' => $total,
            'pages' => ceil($total / $limit),
            'current_page' => $page
        ];
    }

    /**
     * Get user by ID
     */
    public function getById($id) {
        return $this->db->fetch("SELECT * FROM users WHERE id = ?", [$id]);
    }

    /**
     * Get user by username
     */
    public function getByUsername($username) {
        return $this->db->fetch("SELECT * FROM users WHERE username = ?", [$username]);
    }

    /**
     * Get user by user_id
     */
    public function getByUserId($userId) {
        return $this->db->fetch("SELECT * FROM users WHERE user_id = ?", [$userId]);
    }

    /**
     * Create new user
     */
    public function create($data, $adminId) {
        // Validate required fields
        $required = ['username', 'password', 'email', 'full_name'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'message' => "Field '$field' is required"];
            }
        }

        // Check if username exists
        if ($this->getByUsername($data['username'])) {
            return ['success' => false, 'message' => 'Username already exists'];
        }

        // Generate unique user_id
        $userId = $this->generateUserId();

        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        $insertData = [
            'user_id' => $userId,
            'username' => $data['username'],
            'password' => $hashedPassword,
            'email' => $data['email'],
            'full_name' => $data['full_name'],
            'phone' => $data['phone'] ?? null,
            'department' => $data['department'] ?? null,
            'status' => $data['status'] ?? 'active',
            'created_by' => $adminId
        ];

        $id = $this->db->insert('users', $insertData);

        return ['success' => true, 'message' => 'User created successfully', 'user_id' => $userId, 'id' => $id];
    }

    /**
     * Update user
     */
    public function update($id, $data) {
        $user = $this->getById($id);
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }

        // Check if username is taken by another user
        if (isset($data['username']) && $data['username'] !== $user['username']) {
            $existing = $this->getByUsername($data['username']);
            if ($existing && $existing['id'] != $id) {
                return ['success' => false, 'message' => 'Username already exists'];
            }
        }

        $updateData = [];
        $allowedFields = ['username', 'email', 'full_name', 'phone', 'department', 'status'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        // Handle password update separately
        if (!empty($data['password'])) {
            $updateData['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No data to update'];
        }

        $this->db->update('users', $updateData, 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => 'User updated successfully'];
    }

    /**
     * Delete user
     */
    public function delete($id) {
        $user = $this->getById($id);
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }

        $this->db->delete('users', 'id = ?', [$id]);

        return ['success' => true, 'message' => 'User deleted successfully'];
    }

    /**
     * Toggle user status
     */
    public function toggleStatus($id) {
        $user = $this->getById($id);
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }

        $newStatus = $user['status'] === 'active' ? 'inactive' : 'active';
        $this->db->update('users', ['status' => $newStatus], 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => "User status changed to $newStatus"];
    }

    /**
     * Block user
     */
    public function block($id, $reason = '') {
        $this->db->update('users', ['status' => 'blocked'], 'id = :id', ['id' => $id]);
        return ['success' => true, 'message' => 'User blocked successfully'];
    }

    /**
     * Generate unique user ID
     */
    private function generateUserId() {
        do {
            $userId = 'USR' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
        } while ($this->getByUserId($userId));
        return $userId;
    }

    /**
     * Get user statistics
     */
    public function getStatistics() {
        $stats = [];

        $stats['total'] = $this->db->fetch("SELECT COUNT(*) as count FROM users")['count'];
        $stats['active'] = $this->db->fetch("SELECT COUNT(*) as count FROM users WHERE status = 'active'")['count'];
        $stats['inactive'] = $this->db->fetch("SELECT COUNT(*) as count FROM users WHERE status = 'inactive'")['count'];
        $stats['blocked'] = $this->db->fetch("SELECT COUNT(*) as count FROM users WHERE status = 'blocked'")['count'];
        $stats['online'] = $this->db->fetch(
            "SELECT COUNT(*) as count FROM user_sessions WHERE status = 'active' AND last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
        )['count'];

        return $stats;
    }

    /**
     * Get all departments
     */
    public function getDepartments() {
        return $this->db->fetchAll(
            "SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != '' ORDER BY department"
        );
    }

    /**
     * Get users by department
     */
    public function getByDepartment($department) {
        return $this->db->fetchAll(
            "SELECT id, user_id, username, full_name, email FROM users WHERE department = ? AND status = 'active'",
            [$department]
        );
    }

    /**
     * Search users for autocomplete
     */
    public function search($term, $limit = 10) {
        $searchTerm = "%$term%";
        return $this->db->fetchAll(
            "SELECT id, user_id, username, full_name, email
             FROM users
             WHERE (username LIKE ? OR full_name LIKE ? OR user_id LIKE ?)
             AND status = 'active'
             LIMIT ?",
            [$searchTerm, $searchTerm, $searchTerm, $limit]
        );
    }
}
