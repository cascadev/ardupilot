<?php
/**
 * Notification Management Class
 * Handles push notifications to users
 */
class Notification {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all notifications with pagination
     */
    public function getAll($page = 1, $limit = 20, $search = '', $status = '', $type = '') {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = "1=1";

        if ($search) {
            $where .= " AND (title LIKE ? OR message LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm]);
        }

        if ($status) {
            $where .= " AND status = ?";
            $params[] = $status;
        }

        if ($type) {
            $where .= " AND type = ?";
            $params[] = $type;
        }

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM notifications WHERE $where";
        $total = $this->db->fetch($countSql, $params)['total'];

        // Get notifications
        $sql = "SELECT n.*, a.username as created_by_name
                FROM notifications n
                LEFT JOIN admins a ON n.created_by = a.id
                WHERE $where
                ORDER BY n.created_at DESC
                LIMIT $limit OFFSET $offset";
        $notifications = $this->db->fetchAll($sql, $params);

        return [
            'notifications' => $notifications,
            'total' => $total,
            'pages' => ceil($total / $limit),
            'current_page' => $page
        ];
    }

    /**
     * Get notification by ID
     */
    public function getById($id) {
        return $this->db->fetch("SELECT * FROM notifications WHERE id = ?", [$id]);
    }

    /**
     * Create new notification
     */
    public function create($data, $adminId) {
        if (empty($data['title']) || empty($data['message'])) {
            return ['success' => false, 'message' => 'Title and message are required'];
        }

        $insertData = [
            'title' => $data['title'],
            'message' => $data['message'],
            'type' => $data['type'] ?? 'info',
            'priority' => $data['priority'] ?? 1,
            'target_type' => $data['target_type'] ?? 'all',
            'target_users' => isset($data['target_users']) ? json_encode($data['target_users']) : null,
            'target_department' => $data['target_department'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
            'created_by' => $adminId
        ];

        $id = $this->db->insert('notifications', $insertData);

        return ['success' => true, 'message' => 'Notification created successfully', 'id' => $id];
    }

    /**
     * Update notification
     */
    public function update($id, $data) {
        $notification = $this->getById($id);
        if (!$notification) {
            return ['success' => false, 'message' => 'Notification not found'];
        }

        // Cannot update sent notifications
        if ($notification['status'] === 'sent') {
            return ['success' => false, 'message' => 'Cannot update sent notifications'];
        }

        $updateData = [];
        $allowedFields = ['title', 'message', 'type', 'priority', 'target_type', 'target_department', 'status', 'scheduled_at', 'expires_at'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (isset($data['target_users'])) {
            $updateData['target_users'] = json_encode($data['target_users']);
        }

        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No data to update'];
        }

        $this->db->update('notifications', $updateData, 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => 'Notification updated successfully'];
    }

    /**
     * Delete notification
     */
    public function delete($id) {
        $notification = $this->getById($id);
        if (!$notification) {
            return ['success' => false, 'message' => 'Notification not found'];
        }

        // Delete related user notifications first
        $this->db->delete('user_notifications', 'notification_id = ?', [$id]);
        $this->db->delete('notifications', 'id = ?', [$id]);

        return ['success' => true, 'message' => 'Notification deleted successfully'];
    }

    /**
     * Send notification
     */
    public function send($id) {
        $notification = $this->getById($id);
        if (!$notification) {
            return ['success' => false, 'message' => 'Notification not found'];
        }

        if ($notification['status'] === 'sent') {
            return ['success' => false, 'message' => 'Notification already sent'];
        }

        // Get target users
        $users = $this->getTargetUsers($notification);

        if (empty($users)) {
            return ['success' => false, 'message' => 'No users to send notification to'];
        }

        // Create user notification records
        foreach ($users as $user) {
            $this->db->insert('user_notifications', [
                'notification_id' => $id,
                'user_id' => $user['id'],
                'status' => 'pending'
            ]);
        }

        // Update notification status
        $this->db->update('notifications', [
            'status' => 'sent',
            'sent_at' => date('Y-m-d H:i:s')
        ], 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => 'Notification sent to ' . count($users) . ' users'];
    }

    /**
     * Get target users based on notification settings
     */
    private function getTargetUsers($notification) {
        switch ($notification['target_type']) {
            case 'all':
                return $this->db->fetchAll("SELECT id, user_id FROM users WHERE status = 'active'");

            case 'specific':
                $targetUsers = json_decode($notification['target_users'], true);
                if (empty($targetUsers)) {
                    return [];
                }
                $placeholders = str_repeat('?,', count($targetUsers) - 1) . '?';
                return $this->db->fetchAll(
                    "SELECT id, user_id FROM users WHERE id IN ($placeholders) AND status = 'active'",
                    $targetUsers
                );

            case 'department':
                return $this->db->fetchAll(
                    "SELECT id, user_id FROM users WHERE department = ? AND status = 'active'",
                    [$notification['target_department']]
                );

            default:
                return [];
        }
    }

    /**
     * Get pending notifications for a user (API)
     */
    public function getPendingForUser($userId) {
        return $this->db->fetchAll(
            "SELECT n.id, n.title, n.message, n.type, n.priority, un.id as user_notification_id
             FROM notifications n
             JOIN user_notifications un ON n.id = un.notification_id
             WHERE un.user_id = ? AND un.status = 'pending'
             AND (n.expires_at IS NULL OR n.expires_at > NOW())
             ORDER BY n.priority DESC, n.created_at DESC",
            [$userId]
        );
    }

    /**
     * Mark notification as delivered
     */
    public function markDelivered($userNotificationId) {
        $this->db->update('user_notifications', [
            'status' => 'delivered',
            'delivered_at' => date('Y-m-d H:i:s')
        ], 'id = :id', ['id' => $userNotificationId]);
    }

    /**
     * Mark notification as read
     */
    public function markRead($userNotificationId) {
        $this->db->update('user_notifications', [
            'status' => 'read',
            'read_at' => date('Y-m-d H:i:s')
        ], 'id = :id', ['id' => $userNotificationId]);
    }

    /**
     * Mark notification as acknowledged
     */
    public function acknowledge($userNotificationId) {
        $this->db->update('user_notifications', [
            'status' => 'acknowledged',
            'acknowledged_at' => date('Y-m-d H:i:s')
        ], 'id = :id', ['id' => $userNotificationId]);
    }

    /**
     * Get notification statistics
     */
    public function getStatistics() {
        $stats = [];
        $stats['total'] = $this->db->fetch("SELECT COUNT(*) as count FROM notifications")['count'];
        $stats['draft'] = $this->db->fetch("SELECT COUNT(*) as count FROM notifications WHERE status = 'draft'")['count'];
        $stats['sent'] = $this->db->fetch("SELECT COUNT(*) as count FROM notifications WHERE status = 'sent'")['count'];
        $stats['scheduled'] = $this->db->fetch("SELECT COUNT(*) as count FROM notifications WHERE status = 'scheduled'")['count'];

        // Delivery stats
        $stats['pending_delivery'] = $this->db->fetch("SELECT COUNT(*) as count FROM user_notifications WHERE status = 'pending'")['count'];
        $stats['delivered'] = $this->db->fetch("SELECT COUNT(*) as count FROM user_notifications WHERE status = 'delivered'")['count'];
        $stats['read'] = $this->db->fetch("SELECT COUNT(*) as count FROM user_notifications WHERE status = 'read'")['count'];
        $stats['acknowledged'] = $this->db->fetch("SELECT COUNT(*) as count FROM user_notifications WHERE status = 'acknowledged'")['count'];

        return $stats;
    }

    /**
     * Get delivery status for a notification
     */
    public function getDeliveryStatus($notificationId) {
        return $this->db->fetchAll(
            "SELECT un.*, u.username, u.full_name
             FROM user_notifications un
             JOIN users u ON un.user_id = u.id
             WHERE un.notification_id = ?
             ORDER BY un.created_at DESC",
            [$notificationId]
        );
    }

    /**
     * Send notification to specific user
     */
    public function sendToUser($title, $message, $userId, $type = 'info', $adminId = null) {
        // Create notification
        $notificationId = $this->db->insert('notifications', [
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'target_type' => 'specific',
            'target_users' => json_encode([$userId]),
            'status' => 'sent',
            'sent_at' => date('Y-m-d H:i:s'),
            'created_by' => $adminId
        ]);

        // Create user notification record
        $this->db->insert('user_notifications', [
            'notification_id' => $notificationId,
            'user_id' => $userId,
            'status' => 'pending'
        ]);

        return ['success' => true, 'message' => 'Notification sent', 'notification_id' => $notificationId];
    }
}
