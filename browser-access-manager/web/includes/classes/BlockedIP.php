<?php
/**
 * Blocked IP Management Class
 * Handles blocked IP address operations
 */
class BlockedIP {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all blocked IPs with pagination
     */
    public function getAll($page = 1, $limit = 20, $search = '', $status = '') {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = "1=1";

        if ($search) {
            $where .= " AND (ip_address LIKE ? OR reason LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm]);
        }

        if ($status) {
            $where .= " AND status = ?";
            $params[] = $status;
        }

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM blocked_ips WHERE $where";
        $total = $this->db->fetch($countSql, $params)['total'];

        // Get IPs
        $sql = "SELECT b.*, a.username as added_by_name
                FROM blocked_ips b
                LEFT JOIN admins a ON b.added_by = a.id
                WHERE $where
                ORDER BY b.created_at DESC
                LIMIT $limit OFFSET $offset";
        $ips = $this->db->fetchAll($sql, $params);

        return [
            'ips' => $ips,
            'total' => $total,
            'pages' => ceil($total / $limit),
            'current_page' => $page
        ];
    }

    /**
     * Get IP by ID
     */
    public function getById($id) {
        return $this->db->fetch("SELECT * FROM blocked_ips WHERE id = ?", [$id]);
    }

    /**
     * Get IP by address
     */
    public function getByAddress($ipAddress) {
        return $this->db->fetch("SELECT * FROM blocked_ips WHERE ip_address = ?", [$ipAddress]);
    }

    /**
     * Add new blocked IP
     */
    public function add($data, $adminId) {
        if (empty($data['ip_address'])) {
            return ['success' => false, 'message' => 'IP address is required'];
        }

        $ipAddress = trim($data['ip_address']);

        // Validate IP format
        if (!$this->isValidIP($ipAddress)) {
            return ['success' => false, 'message' => 'Invalid IP address format'];
        }

        // Check if already exists
        if ($this->getByAddress($ipAddress)) {
            return ['success' => false, 'message' => 'This IP is already blocked'];
        }

        // Determine IP type
        $ipType = $this->determineIPType($ipAddress);

        $insertData = [
            'ip_address' => $ipAddress,
            'ip_type' => $ipType,
            'reason' => $data['reason'] ?? null,
            'status' => $data['status'] ?? 'active',
            'added_by' => $adminId
        ];

        $id = $this->db->insert('blocked_ips', $insertData);

        return ['success' => true, 'message' => 'IP address blocked successfully', 'id' => $id];
    }

    /**
     * Update blocked IP
     */
    public function update($id, $data) {
        $ip = $this->getById($id);
        if (!$ip) {
            return ['success' => false, 'message' => 'IP not found'];
        }

        $updateData = [];

        if (isset($data['ip_address'])) {
            $ipAddress = trim($data['ip_address']);
            if (!$this->isValidIP($ipAddress)) {
                return ['success' => false, 'message' => 'Invalid IP address format'];
            }
            // Check if new IP already exists for different record
            $existing = $this->getByAddress($ipAddress);
            if ($existing && $existing['id'] != $id) {
                return ['success' => false, 'message' => 'This IP is already blocked'];
            }
            $updateData['ip_address'] = $ipAddress;
            $updateData['ip_type'] = $this->determineIPType($ipAddress);
        }

        if (isset($data['reason'])) {
            $updateData['reason'] = $data['reason'];
        }

        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
        }

        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No data to update'];
        }

        $this->db->update('blocked_ips', $updateData, 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => 'IP updated successfully'];
    }

    /**
     * Delete blocked IP
     */
    public function delete($id) {
        $ip = $this->getById($id);
        if (!$ip) {
            return ['success' => false, 'message' => 'IP not found'];
        }

        $this->db->delete('blocked_ips', 'id = ?', [$id]);

        return ['success' => true, 'message' => 'IP unblocked successfully'];
    }

    /**
     * Toggle IP status
     */
    public function toggleStatus($id) {
        $ip = $this->getById($id);
        if (!$ip) {
            return ['success' => false, 'message' => 'IP not found'];
        }

        $newStatus = $ip['status'] === 'active' ? 'inactive' : 'active';
        $this->db->update('blocked_ips', ['status' => $newStatus], 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => "IP status changed to $newStatus"];
    }

    /**
     * Get all active blocked IPs (for API)
     */
    public function getActiveBlockedIPs() {
        return $this->db->fetchAll(
            "SELECT ip_address, ip_type FROM blocked_ips WHERE status = 'active'"
        );
    }

    /**
     * Check if IP is blocked
     */
    public function isBlocked($ip) {
        // Direct match
        $result = $this->db->fetch(
            "SELECT id FROM blocked_ips WHERE ip_address = ? AND status = 'active'",
            [$ip]
        );

        if ($result) {
            return true;
        }

        // Check IP ranges
        $ranges = $this->db->fetchAll(
            "SELECT ip_address FROM blocked_ips WHERE ip_type = 'range' AND status = 'active'"
        );

        foreach ($ranges as $range) {
            if ($this->ipInRange($ip, $range['ip_address'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validate IP address format
     */
    private function isValidIP($ip) {
        // Check for CIDR notation (range)
        if (strpos($ip, '/') !== false) {
            list($ipPart, $cidr) = explode('/', $ip);
            if (!filter_var($ipPart, FILTER_VALIDATE_IP)) {
                return false;
            }
            $cidr = (int)$cidr;
            if (filter_var($ipPart, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                return $cidr >= 0 && $cidr <= 32;
            } else {
                return $cidr >= 0 && $cidr <= 128;
            }
        }

        return filter_var($ip, FILTER_VALIDATE_IP) !== false;
    }

    /**
     * Determine IP type
     */
    private function determineIPType($ip) {
        if (strpos($ip, '/') !== false) {
            return 'range';
        }
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return 'ipv6';
        }
        return 'ipv4';
    }

    /**
     * Check if IP is in CIDR range
     */
    private function ipInRange($ip, $range) {
        if (strpos($range, '/') === false) {
            return $ip === $range;
        }

        list($subnet, $mask) = explode('/', $range);

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $ip = ip2long($ip);
            $subnet = ip2long($subnet);
            $mask = -1 << (32 - $mask);
            return ($ip & $mask) === ($subnet & $mask);
        }

        return false;
    }

    /**
     * Get statistics
     */
    public function getStatistics() {
        $stats = [];
        $stats['total'] = $this->db->fetch("SELECT COUNT(*) as count FROM blocked_ips")['count'];
        $stats['active'] = $this->db->fetch("SELECT COUNT(*) as count FROM blocked_ips WHERE status = 'active'")['count'];
        $stats['inactive'] = $this->db->fetch("SELECT COUNT(*) as count FROM blocked_ips WHERE status = 'inactive'")['count'];
        $stats['ipv4'] = $this->db->fetch("SELECT COUNT(*) as count FROM blocked_ips WHERE ip_type = 'ipv4'")['count'];
        $stats['ipv6'] = $this->db->fetch("SELECT COUNT(*) as count FROM blocked_ips WHERE ip_type = 'ipv6'")['count'];
        $stats['ranges'] = $this->db->fetch("SELECT COUNT(*) as count FROM blocked_ips WHERE ip_type = 'range'")['count'];
        return $stats;
    }

    /**
     * Bulk add IPs
     */
    public function bulkAdd($ips, $reason, $adminId) {
        $added = 0;
        $skipped = 0;
        $errors = [];

        foreach ($ips as $ip) {
            $ip = trim($ip);
            if (empty($ip)) continue;

            $result = $this->add(['ip_address' => $ip, 'reason' => $reason], $adminId);
            if ($result['success']) {
                $added++;
            } else {
                $skipped++;
                $errors[] = "$ip: {$result['message']}";
            }
        }

        return [
            'success' => true,
            'added' => $added,
            'skipped' => $skipped,
            'errors' => $errors
        ];
    }
}
