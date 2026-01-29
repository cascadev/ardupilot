<?php
/**
 * Manage Browsing History Page
 */
$pageTitle = 'Manage Browsing History';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$historyModel = new BrowsingHistory();
$userModel = new User();

$message = '';
$messageType = '';

// Handle actions
if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'delete':
            if (isset($_GET['id'])) {
                $result = $historyModel->delete((int)$_GET['id']);
                $message = $result['message'];
                $messageType = $result['success'] ? 'success' : 'danger';
            }
            break;

        case 'clear_user':
            if (isset($_GET['user_id'])) {
                $result = $historyModel->deleteByUser((int)$_GET['user_id']);
                $message = $result['message'];
                $messageType = $result['success'] ? 'success' : 'danger';
            }
            break;

        case 'export':
            $filters = [
                'user_id' => $_GET['user_id'] ?? null,
                'search' => $_GET['search'] ?? '',
                'date_from' => $_GET['date_from'] ?? '',
                'date_to' => $_GET['date_to'] ?? '',
                'blocked' => $_GET['blocked'] ?? ''
            ];
            $csv = $historyModel->exportToCSV($filters);
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="browsing_history_' . date('Y-m-d') . '.csv"');
            echo $csv;
            exit;
    }
}

// Get filters
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$filters = [
    'user_id' => $_GET['user_id'] ?? null,
    'search' => $_GET['search'] ?? '',
    'date_from' => $_GET['date_from'] ?? '',
    'date_to' => $_GET['date_to'] ?? '',
    'blocked' => $_GET['blocked'] ?? '',
    'browser' => $_GET['browser'] ?? ''
];

$data = $historyModel->getAll($page, 50, $filters);
$history = $data['history'];
$totalPages = $data['pages'];
$total = $data['total'];

$stats = $historyModel->getStatistics();
$users = $userModel->getAll(1, 100)['users'];
$browsers = $historyModel->getBrowsers();

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-clock-history me-2"></i>Manage Browsing History</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item active">Browsing History</li>
        </ol>
    </nav>
</div>

<?php if ($message): ?>
<div class="alert alert-<?php echo $messageType; ?> alert-dismissible fade show" role="alert">
    <?php echo htmlspecialchars($message); ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>
<?php endif; ?>

<!-- Stats -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="stat-card bg-primary">
            <div class="stat-value"><?php echo number_format($stats['total_visits']); ?></div>
            <div class="stat-label">Total Visits</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card bg-success">
            <div class="stat-value"><?php echo number_format($stats['today_visits']); ?></div>
            <div class="stat-label">Today's Visits</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card bg-danger">
            <div class="stat-value"><?php echo number_format($stats['blocked_attempts']); ?></div>
            <div class="stat-label">Blocked Attempts</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card bg-info">
            <div class="stat-value"><?php echo number_format($stats['unique_domains']); ?></div>
            <div class="stat-label">Unique Domains</div>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span>Browsing History (<?php echo number_format($total); ?> records)</span>
        <div>
            <a href="?action=export&<?php echo http_build_query($filters); ?>" class="btn btn-success btn-sm">
                <i class="bi bi-download me-1"></i>Export CSV
            </a>
        </div>
    </div>
    <div class="card-body">
        <!-- Filters -->
        <form method="GET" class="row g-3 mb-4">
            <div class="col-md-2">
                <select class="form-select" name="user_id">
                    <option value="">All Users</option>
                    <?php foreach ($users as $user): ?>
                    <option value="<?php echo $user['id']; ?>" <?php echo ($filters['user_id'] ?? '') == $user['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($user['username']); ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-2">
                <input type="text" class="form-control" name="search" placeholder="Search URL..."
                       value="<?php echo htmlspecialchars($filters['search']); ?>">
            </div>
            <div class="col-md-2">
                <input type="date" class="form-control" name="date_from" placeholder="From"
                       value="<?php echo htmlspecialchars($filters['date_from']); ?>">
            </div>
            <div class="col-md-2">
                <input type="date" class="form-control" name="date_to" placeholder="To"
                       value="<?php echo htmlspecialchars($filters['date_to']); ?>">
            </div>
            <div class="col-md-2">
                <select class="form-select" name="blocked">
                    <option value="">All Status</option>
                    <option value="0" <?php echo $filters['blocked'] === '0' ? 'selected' : ''; ?>>Allowed</option>
                    <option value="1" <?php echo $filters['blocked'] === '1' ? 'selected' : ''; ?>>Blocked</option>
                </select>
            </div>
            <div class="col-md-1">
                <button type="submit" class="btn btn-primary w-100">Filter</button>
            </div>
            <div class="col-md-1">
                <a href="manage-browsing-history.php" class="btn btn-outline-secondary w-100">Reset</a>
            </div>
        </form>

        <div class="table-responsive">
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>URL</th>
                        <th>Title</th>
                        <th>Browser</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($history)): ?>
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">No browsing history found</td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($history as $entry): ?>
                    <tr>
                        <td>
                            <strong><?php echo htmlspecialchars($entry['username']); ?></strong>
                            <br><small class="text-muted"><?php echo htmlspecialchars($entry['user_code']); ?></small>
                        </td>
                        <td class="url-cell" style="max-width:250px;">
                            <a href="<?php echo htmlspecialchars($entry['url']); ?>" target="_blank" rel="noopener"
                               title="<?php echo htmlspecialchars($entry['url']); ?>">
                                <?php echo htmlspecialchars(strlen($entry['url']) > 50 ? substr($entry['url'], 0, 50) . '...' : $entry['url']); ?>
                            </a>
                        </td>
                        <td style="max-width:150px;">
                            <small><?php echo htmlspecialchars($entry['title'] ?? '-'); ?></small>
                        </td>
                        <td><small><?php echo htmlspecialchars($entry['browser'] ?? '-'); ?></small></td>
                        <td><small><?php echo date('M d, H:i:s', strtotime($entry['visit_time'])); ?></small></td>
                        <td>
                            <?php if ($entry['blocked']): ?>
                            <span class="badge bg-danger">Blocked</span>
                            <?php else: ?>
                            <span class="badge bg-success">Allowed</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <a href="?action=delete&id=<?php echo $entry['id']; ?>&<?php echo http_build_query($filters); ?>"
                               class="btn btn-action btn-delete btn-sm" data-name="this entry">
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
                <li class="page-item <?php echo $page <= 1 ? 'disabled' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $page - 1; ?>&<?php echo http_build_query($filters); ?>">Prev</a>
                </li>
                <?php for ($i = max(1, $page - 2); $i <= min($totalPages, $page + 2); $i++): ?>
                <li class="page-item <?php echo $i === $page ? 'active' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $i; ?>&<?php echo http_build_query($filters); ?>"><?php echo $i; ?></a>
                </li>
                <?php endfor; ?>
                <li class="page-item <?php echo $page >= $totalPages ? 'disabled' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $page + 1; ?>&<?php echo http_build_query($filters); ?>">Next</a>
                </li>
            </ul>
        </nav>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
