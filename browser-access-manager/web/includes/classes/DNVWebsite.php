<?php
/**
 * DNV (Do Not View) Website Management Class
 * Handles blocked website operations
 */
class DNVWebsite {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all DNV websites with pagination
     */
    public function getAll($page = 1, $limit = 20, $search = '', $status = '') {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = "1=1";

        if ($search) {
            $where .= " AND (url LIKE ? OR reason LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm]);
        }

        if ($status) {
            $where .= " AND status = ?";
            $params[] = $status;
        }

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM dnv_websites WHERE $where";
        $total = $this->db->fetch($countSql, $params)['total'];

        // Get websites
        $sql = "SELECT d.*, a.username as added_by_name
                FROM dnv_websites d
                LEFT JOIN admins a ON d.added_by = a.id
                WHERE $where
                ORDER BY d.created_at DESC
                LIMIT $limit OFFSET $offset";
        $websites = $this->db->fetchAll($sql, $params);

        return [
            'websites' => $websites,
            'total' => $total,
            'pages' => ceil($total / $limit),
            'current_page' => $page
        ];
    }

    /**
     * Get website by ID
     */
    public function getById($id) {
        return $this->db->fetch("SELECT * FROM dnv_websites WHERE id = ?", [$id]);
    }

    /**
     * Get website by URL
     */
    public function getByUrl($url) {
        return $this->db->fetch("SELECT * FROM dnv_websites WHERE url = ?", [$url]);
    }

    /**
     * Add new DNV website
     */
    public function add($data, $adminId) {
        if (empty($data['url'])) {
            return ['success' => false, 'message' => 'URL is required'];
        }

        // Normalize URL
        $url = $this->normalizeUrl($data['url']);

        // Check if already exists
        if ($this->getByUrl($url)) {
            return ['success' => false, 'message' => 'This website is already in the DNV list'];
        }

        $insertData = [
            'url' => $url,
            'reason' => $data['reason'] ?? null,
            'status' => $data['status'] ?? 'active',
            'added_by' => $adminId
        ];

        $id = $this->db->insert('dnv_websites', $insertData);

        return ['success' => true, 'message' => 'Website added to DNV list', 'id' => $id];
    }

    /**
     * Update DNV website
     */
    public function update($id, $data) {
        $website = $this->getById($id);
        if (!$website) {
            return ['success' => false, 'message' => 'Website not found'];
        }

        $updateData = [];

        if (isset($data['url'])) {
            $url = $this->normalizeUrl($data['url']);
            // Check if new URL already exists for different record
            $existing = $this->getByUrl($url);
            if ($existing && $existing['id'] != $id) {
                return ['success' => false, 'message' => 'This URL already exists in DNV list'];
            }
            $updateData['url'] = $url;
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

        $this->db->update('dnv_websites', $updateData, 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => 'Website updated successfully'];
    }

    /**
     * Delete DNV website
     */
    public function delete($id) {
        $website = $this->getById($id);
        if (!$website) {
            return ['success' => false, 'message' => 'Website not found'];
        }

        $this->db->delete('dnv_websites', 'id = ?', [$id]);

        return ['success' => true, 'message' => 'Website removed from DNV list'];
    }

    /**
     * Toggle website status
     */
    public function toggleStatus($id) {
        $website = $this->getById($id);
        if (!$website) {
            return ['success' => false, 'message' => 'Website not found'];
        }

        $newStatus = $website['status'] === 'active' ? 'inactive' : 'active';
        $this->db->update('dnv_websites', ['status' => $newStatus], 'id = :id', ['id' => $id]);

        return ['success' => true, 'message' => "Website status changed to $newStatus"];
    }

    /**
     * Get all active blocked URLs (for API)
     */
    public function getActiveBlockedUrls() {
        return $this->db->fetchAll(
            "SELECT url FROM dnv_websites WHERE status = 'active'"
        );
    }

    /**
     * Check if URL is blocked
     */
    public function isBlocked($url) {
        $normalizedUrl = $this->normalizeUrl($url);
        $domain = $this->extractDomain($url);

        // Check exact URL match
        $result = $this->db->fetch(
            "SELECT id FROM dnv_websites WHERE url = ? AND status = 'active'",
            [$normalizedUrl]
        );

        if ($result) {
            return true;
        }

        // Check domain match
        $blockedUrls = $this->getActiveBlockedUrls();
        foreach ($blockedUrls as $blocked) {
            $blockedDomain = $this->extractDomain($blocked['url']);
            if ($domain === $blockedDomain || strpos($url, $blocked['url']) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalize URL
     */
    private function normalizeUrl($url) {
        // Add https if no protocol specified
        if (!preg_match('#^https?://#', $url)) {
            $url = 'https://' . $url;
        }

        // Remove trailing slash
        $url = rtrim($url, '/');

        return strtolower($url);
    }

    /**
     * Extract domain from URL
     */
    private function extractDomain($url) {
        $parsed = parse_url($url);
        return $parsed['host'] ?? $url;
    }

    /**
     * Get statistics
     */
    public function getStatistics() {
        $stats = [];
        $stats['total'] = $this->db->fetch("SELECT COUNT(*) as count FROM dnv_websites")['count'];
        $stats['active'] = $this->db->fetch("SELECT COUNT(*) as count FROM dnv_websites WHERE status = 'active'")['count'];
        $stats['inactive'] = $this->db->fetch("SELECT COUNT(*) as count FROM dnv_websites WHERE status = 'inactive'")['count'];
        return $stats;
    }

    /**
     * Bulk add websites
     */
    public function bulkAdd($urls, $reason, $adminId) {
        $added = 0;
        $skipped = 0;
        $errors = [];

        foreach ($urls as $url) {
            $url = trim($url);
            if (empty($url)) continue;

            $result = $this->add(['url' => $url, 'reason' => $reason], $adminId);
            if ($result['success']) {
                $added++;
            } else {
                $skipped++;
                $errors[] = "$url: {$result['message']}";
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
