<?php
/**
 * Manage IP Addresses Page
 */
$pageTitle = 'Manage IP Addresses';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$ipModel = new BlockedIP();

$message = '';
$messageType = '';

// Handle actions
if (isset($_GET['action']) && isset($_GET['id'])) {
    $action = $_GET['action'];
    $id = (int)$_GET['id'];

    switch ($action) {
        case 'delete':
            $result = $ipModel->delete($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            break;

        case 'toggle':
            $result = $ipModel->toggleStatus($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            break;
    }
}

// Handle add
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$auth->validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $message = 'Invalid security token.';
        $messageType = 'danger';
    } else {
        $data = [
            'ip_address' => trim($_POST['ip_address'] ?? ''),
            'reason' => trim($_POST['reason'] ?? ''),
            'status' => $_POST['status'] ?? 'active'
        ];

        $result = $ipModel->add($data, $_SESSION['admin_id']);
        $message = $result['message'];
        $messageType = $result['success'] ? 'success' : 'danger';
    }
}

// Get data
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';

$ipData = $ipModel->getAll($page, 20, $search, $status);
$ips = $ipData['ips'];
$totalPages = $ipData['pages'];
$total = $ipData['total'];

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-hdd-network me-2"></i>Manage IP Addresses</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item active">Manage IP Addresses</li>
        </ol>
    </nav>
</div>

<?php if ($message): ?>
<div class="alert alert-<?php echo $messageType; ?> alert-dismissible fade show" role="alert">
    <?php echo htmlspecialchars($message); ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>
<?php endif; ?>

<div class="row">
    <div class="col-lg-4 mb-4">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-plus-circle me-2"></i>Add Blocked IP
            </div>
            <div class="card-body">
                <form method="POST" action="">
                    <input type="hidden" name="csrf_token" value="<?php echo $auth->generateCSRFToken(); ?>">

                    <div class="mb-3">
                        <label for="ip_address" class="form-label">IP Address <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="ip_address" name="ip_address"
                               placeholder="192.168.1.1 or 192.168.1.0/24" required>
                        <div class="form-text">IPv4, IPv6 or CIDR notation</div>
                    </div>

                    <div class="mb-3">
                        <label for="reason" class="form-label">Reason</label>
                        <input type="text" class="form-control" id="reason" name="reason"
                               placeholder="Reason for blocking...">
                    </div>

                    <div class="mb-3">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="active">Active (Blocked)</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-danger w-100">
                        <i class="bi bi-shield-x me-2"></i>Block IP
                    </button>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-8">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span>Blocked IP Addresses (<?php echo $total; ?>)</span>
            </div>
            <div class="card-body">
                <!-- Filters -->
                <form method="GET" class="row g-3 mb-4">
                    <div class="col-md-5">
                        <input type="text" class="form-control" name="search" placeholder="Search IP..."
                               value="<?php echo htmlspecialchars($search); ?>">
                    </div>
                    <div class="col-md-4">
                        <select class="form-select" name="status">
                            <option value="">All Status</option>
                            <option value="active" <?php echo $status === 'active' ? 'selected' : ''; ?>>Active</option>
                            <option value="inactive" <?php echo $status === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button type="submit" class="btn btn-primary w-100">Filter</button>
                    </div>
                </form>

                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>IP Address</th>
                                <th>Type</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($ips)): ?>
                            <tr>
                                <td colspan="5" class="text-center py-4 text-muted">No blocked IPs found</td>
                            </tr>
                            <?php else: ?>
                            <?php foreach ($ips as $ip): ?>
                            <tr>
                                <td><code><?php echo htmlspecialchars($ip['ip_address']); ?></code></td>
                                <td><span class="badge bg-secondary"><?php echo strtoupper($ip['ip_type']); ?></span></td>
                                <td><?php echo htmlspecialchars($ip['reason'] ?? '-'); ?></td>
                                <td>
                                    <span class="badge-status badge-<?php echo $ip['status'] === 'active' ? 'prohibited' : 'inactive'; ?>">
                                        <?php echo ucfirst($ip['status']); ?>
                                    </span>
                                </td>
                                <td>
                                    <a href="?action=toggle&id=<?php echo $ip['id']; ?>" class="btn btn-action btn-toggle" title="Toggle">
                                        <i class="bi bi-toggle-<?php echo $ip['status'] === 'active' ? 'on' : 'off'; ?>"></i>
                                    </a>
                                    <a href="?action=delete&id=<?php echo $ip['id']; ?>"
                                       class="btn btn-action btn-delete" data-name="<?php echo htmlspecialchars($ip['ip_address']); ?>">
                                        <i class="bi bi-trash"></i>
                                    </a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <?php if ($totalPages > 1): ?>
                <nav class="mt-4">
                    <ul class="pagination justify-content-center">
                        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                        <li class="page-item <?php echo $i === $page ? 'active' : ''; ?>">
                            <a class="page-link" href="?page=<?php echo $i; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($status); ?>"><?php echo $i; ?></a>
                        </li>
                        <?php endfor; ?>
                    </ul>
                </nav>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
