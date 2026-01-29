<?php
/**
 * Manage DNV Websites Page
 */
$pageTitle = 'Manage DNV Websites';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$dnvModel = new DNVWebsite();

$message = '';
$messageType = '';

// Handle actions
if (isset($_GET['action']) && isset($_GET['id'])) {
    $action = $_GET['action'];
    $id = (int)$_GET['id'];

    switch ($action) {
        case 'delete':
            $result = $dnvModel->delete($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            $auth->logAction($_SESSION['admin_id'], 'dnv_delete', 'dnv_websites', $id);
            break;

        case 'toggle':
            $result = $dnvModel->toggleStatus($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            $auth->logAction($_SESSION['admin_id'], 'dnv_toggle_status', 'dnv_websites', $id);
            break;
    }
}

// Get filters
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';

// Get websites
$websiteData = $dnvModel->getAll($page, 20, $search, $status);
$websites = $websiteData['websites'];
$totalPages = $websiteData['pages'];
$total = $websiteData['total'];

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-slash-circle me-2"></i>Manage DNV Websites</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item active">Manage DNV Websites</li>
        </ol>
    </nav>
</div>

<?php if ($message): ?>
<div class="alert alert-<?php echo $messageType; ?> alert-dismissible fade show" role="alert">
    <i class="bi bi-<?php echo $messageType === 'success' ? 'check-circle' : 'exclamation-circle'; ?> me-2"></i>
    <?php echo htmlspecialchars($message); ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>
<?php endif; ?>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
        <span><i class="bi bi-list me-2"></i>DNV Websites List (<?php echo $total; ?> total)</span>
        <a href="add-dnv-website.php" class="btn btn-danger btn-sm">
            <i class="bi bi-plus-circle me-1"></i>Add DNV Website
        </a>
    </div>
    <div class="card-body">
        <!-- Filters -->
        <form method="GET" class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" name="search" placeholder="Search URLs..."
                           value="<?php echo htmlspecialchars($search); ?>">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" name="status">
                    <option value="">All Status</option>
                    <option value="active" <?php echo $status === 'active' ? 'selected' : ''; ?>>Active (Blocked)</option>
                    <option value="inactive" <?php echo $status === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-primary w-100">Filter</button>
            </div>
            <div class="col-md-2">
                <a href="manage-dnv-websites.php" class="btn btn-outline-secondary w-100">Reset</a>
            </div>
        </form>

        <!-- Websites Table -->
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Added</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($websites)): ?>
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <div class="empty-state">
                                <i class="bi bi-slash-circle"></i>
                                <h4>No DNV Websites Found</h4>
                                <p class="text-muted">No blocked websites match your criteria</p>
                            </div>
                        </td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($websites as $website): ?>
                    <tr>
                        <td class="url-cell">
                            <a href="<?php echo htmlspecialchars($website['url']); ?>" target="_blank" rel="noopener">
                                <?php echo htmlspecialchars($website['url']); ?>
                            </a>
                        </td>
                        <td><?php echo htmlspecialchars($website['reason'] ?? '-'); ?></td>
                        <td>
                            <span class="badge-status badge-<?php echo $website['status'] === 'active' ? 'prohibited' : 'inactive'; ?>">
                                <i class="bi bi-<?php echo $website['status'] === 'active' ? 'slash-circle' : 'circle'; ?> me-1"></i>
                                <?php echo $website['status'] === 'active' ? 'Prohibited' : 'Inactive'; ?>
                            </span>
                        </td>
                        <td>
                            <small>
                                <?php echo date('Y-m-d', strtotime($website['created_at'])); ?><br>
                                <?php echo date('H:i:s', strtotime($website['created_at'])); ?>
                            </small>
                        </td>
                        <td>
                            <div class="toggle-switch-container">
                                <a href="?action=toggle&id=<?php echo $website['id']; ?>"
                                   class="btn-toggle-status"
                                   data-status="<?php echo $website['status']; ?>"
                                   title="Toggle Status">
                                    <i class="bi bi-<?php echo $website['status'] === 'active' ? 'slash-circle text-danger' : 'circle text-secondary'; ?> toggle-icon fs-5"></i>
                                </a>
                                <i class="bi bi-grip-vertical text-muted"></i>
                                <a href="?action=toggle&id=<?php echo $website['id']; ?>"
                                   title="Toggle Active">
                                    <i class="bi bi-<?php echo $website['status'] === 'active' ? 'check-circle-fill text-success' : 'x-circle text-secondary'; ?> fs-5"></i>
                                </a>
                            </div>
                            <a href="edit-dnv-website.php?id=<?php echo $website['id']; ?>" class="btn btn-action btn-edit" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </a>
                            <a href="?action=delete&id=<?php echo $website['id']; ?>"
                               class="btn btn-action btn-delete"
                               data-name="<?php echo htmlspecialchars($website['url']); ?>"
                               title="Delete">
                                <i class="bi bi-trash"></i>
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <?php if ($totalPages > 1): ?>
        <nav aria-label="Page navigation" class="mt-4">
            <ul class="pagination justify-content-center">
                <li class="page-item <?php echo $page <= 1 ? 'disabled' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $page - 1; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($status); ?>">Previous</a>
                </li>
                <?php for ($i = max(1, $page - 2); $i <= min($totalPages, $page + 2); $i++): ?>
                <li class="page-item <?php echo $i === $page ? 'active' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $i; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($status); ?>"><?php echo $i; ?></a>
                </li>
                <?php endfor; ?>
                <li class="page-item <?php echo $page >= $totalPages ? 'disabled' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $page + 1; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($status); ?>">Next</a>
                </li>
            </ul>
        </nav>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
