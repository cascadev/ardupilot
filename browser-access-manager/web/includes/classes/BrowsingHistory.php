<?php
/**
 * Browsing History Management Class
 * Handles user browsing history tracking and management
 */
class BrowsingHistory {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get browsing history with pagination
     */
    public function getAll($page = 1, $limit = 50, $filters = []) {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = "1=1";

        // Filter by user
        if (!empty($filters['user_id'])) {
            $where .= " AND bh.user_id = ?";
            $params[] = $filters['user_id'];
        }

        // Filter by URL search
        if (!empty($filters['search'])) {
            $where .= " AND (bh.url LIKE ? OR bh.title LIKE ?)";
            $searchTerm = "%" . $filters['search'] . "%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        // Filter by date range
        if (!empty($filters['date_from'])) {
            $where .= " AND bh.visit_time >= ?";
            $params[] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where .= " AND bh.visit_time <= ?";
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        // Filter by blocked status
        if (isset($filters['blocked']) && $filters['blocked'] !== '') {
            $where .= " AND bh.blocked = ?";
            $params[] = (int)$filters['blocked'];
        }

        // Filter by browser
        if (!empty($filters['browser'])) {
            $where .= " AND bh.browser = ?";
            $params[] = $filters['browser'];
        }

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM browsing_history bh WHERE $where";
        $total = $this->db->fetch($countSql, $params)['total'];

        // Get history
        $sql = "SELECT bh.*, u.username, u.full_name, u.user_id as user_code
                FROM browsing_history bh
                JOIN users u ON bh.user_id = u.id
                WHERE $where
                ORDER BY bh.visit_time DESC
                LIMIT $limit OFFSET $offset";
        $history = $this->db->fetchAll($sql, $params);

        return [
            'history' => $history,
            'total' => $total,
            'pages' => ceil($total / $limit),
            'current_page' => $page
        ];
    }

    /**
     * Get history for specific user
     */
    public function getByUser($userId, $page = 1, $limit = 50) {
        return $this->getAll($page, $limit, ['user_id' => $userId]);
    }

    /**
     * Record a new browsing entry (from API)
     */
    public function record($data) {
        if (empty($data['user_id']) || empty($data['url'])) {
            return ['success' => false, 'message' => 'User ID and URL are required'];
        }

        $insertData = [
            'user_id' => $data['user_id'],
            'url' => $data['url'],
            'title' => $data['title'] ?? null,
            'browser' => $data['browser'] ?? null,
            'visit_time' => $data['visit_time'] ?? date('Y-m-d H:i:s'),
            'duration' => $data['duration'] ?? 0,
            'ip_address' => $data['ip_address'] ?? null,
            'machine_name' => $data['machine_name'] ?? null,
            'blocked' => $data['blocked'] ?? 0,
            'block_reason' => $data['block_reason'] ?? null
        ];

        $id = $this->db->insert('browsing_history', $insertData);

        return ['success' => true, 'id' => $id];
    }

    /**
     * Delete history entry
     */
    public function delete($id) {
        $this->db->delete('browsing_history', 'id = ?', [$id]);
        return ['success' => true, 'message' => 'History entry deleted'];
    }

    /**
     * Delete all history for a user
     */
    public function deleteByUser($userId) {
        $this->db->delete('browsing_history', 'user_id = ?', [$userId]);
        return ['success' => true, 'message' => 'User history deleted'];
    }

    /**
     * Delete history older than specified days
     */
    public function cleanOldHistory($days = 90) {
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-$days days"));
        $result = $this->db->query(
            "DELETE FROM browsing_history WHERE visit_time < ?",
            [$cutoffDate]
        );
        return ['success' => true, 'deleted' => $result->rowCount()];
    }

    /**
     * Delete history by date range
     */
    public function deleteByDateRange($dateFrom, $dateTo, $userId = null) {
        $where = "visit_time >= ? AND visit_time <= ?";
        $params = [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'];

        if ($userId) {
            $where .= " AND user_id = ?";
            $params[] = $userId;
        }

        $result = $this->db->query("DELETE FROM browsing_history WHERE $where", $params);

        return ['success' => true, 'deleted' => $result->rowCount()];
    }

    /**
     * Get browsing statistics
     */
    public function getStatistics($userId = null) {
        $stats = [];
        $userFilter = $userId ? "AND user_id = $userId" : "";

        // Total visits
        $stats['total_visits'] = $this->db->fetch(
            "SELECT COUNT(*) as count FROM browsing_history WHERE 1=1 $userFilter"
        )['count'];

        // Blocked attempts
        $stats['blocked_attempts'] = $this->db->fetch(
            "SELECT COUNT(*) as count FROM browsing_history WHERE blocked = 1 $userFilter"
        )['count'];

        // Today's visits
        $today = date('Y-m-d');
        $stats['today_visits'] = $this->db->fetch(
            "SELECT COUNT(*) as count FROM browsing_history WHERE DATE(visit_time) = ? $userFilter",
            [$today]
        )['count'];

        // Unique domains visited
        $stats['unique_domains'] = $this->db->fetch(
            "SELECT COUNT(DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '//', -1)) as count
             FROM browsing_history WHERE 1=1 $userFilter"
        )['count'];

        return $stats;
    }

    /**
     * Get most visited sites
     */
    public function getMostVisited($limit = 10, $userId = null, $days = 30) {
        $dateLimit = date('Y-m-d H:i:s', strtotime("-$days days"));
        $userFilter = $userId ? "AND user_id = ?" : "";
        $params = [$dateLimit];
        if ($userId) {
            $params[] = $userId;
        }

        return $this->db->fetchAll(
            "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '//', -1) as domain,
                    COUNT(*) as visit_count
             FROM browsing_history
             WHERE visit_time >= ? $userFilter
             GROUP BY domain
             ORDER BY visit_count DESC
             LIMIT ?",
            array_merge($params, [$limit])
        );
    }

    /**
     * Get blocked site attempts
     */
    public function getBlockedAttempts($limit = 50, $userId = null) {
        $userFilter = $userId ? "AND bh.user_id = ?" : "";
        $params = $userId ? [$userId] : [];

        return $this->db->fetchAll(
            "SELECT bh.*, u.username, u.full_name
             FROM browsing_history bh
             JOIN users u ON bh.user_id = u.id
             WHERE bh.blocked = 1 $userFilter
             ORDER BY bh.visit_time DESC
             LIMIT ?",
            array_merge($params, [$limit])
        );
    }

    /**
     * Get available browsers in history
     */
    public function getBrowsers() {
        return $this->db->fetchAll(
            "SELECT DISTINCT browser FROM browsing_history WHERE browser IS NOT NULL AND browser != ''"
        );
    }

    /**
     * Get daily visit count for chart
     */
    public function getDailyVisits($days = 30, $userId = null) {
        $userFilter = $userId ? "AND user_id = ?" : "";
        $params = [$days];
        if ($userId) {
            $params[] = $userId;
        }

        return $this->db->fetchAll(
            "SELECT DATE(visit_time) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN blocked = 1 THEN 1 ELSE 0 END) as blocked
             FROM browsing_history
             WHERE visit_time >= DATE_SUB(NOW(), INTERVAL ? DAY) $userFilter
             GROUP BY DATE(visit_time)
             ORDER BY date ASC",
            $params
        );
    }

    /**
     * Export history to CSV
     */
    public function exportToCSV($filters = []) {
        $data = $this->getAll(1, 10000, $filters);

        $csv = "Date/Time,User,URL,Title,Browser,IP Address,Machine,Blocked,Block Reason\n";

        foreach ($data['history'] as $row) {
            $csv .= sprintf(
                '"%s","%s","%s","%s","%s","%s","%s","%s","%s"' . "\n",
                $row['visit_time'],
                $row['username'],
                str_replace('"', '""', $row['url']),
                str_replace('"', '""', $row['title'] ?? ''),
                $row['browser'] ?? '',
                $row['ip_address'] ?? '',
                $row['machine_name'] ?? '',
                $row['blocked'] ? 'Yes' : 'No',
                str_replace('"', '""', $row['block_reason'] ?? '')
            );
        }

        return $csv;
    }
}
