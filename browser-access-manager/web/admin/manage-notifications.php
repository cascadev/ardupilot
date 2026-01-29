<?php
/**
 * Manage Notifications Page
 */
$pageTitle = 'Manage Notifications';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$notificationModel = new Notification();

$message = '';
$messageType = '';

// Handle actions
if (isset($_GET['action']) && isset($_GET['id'])) {
    $action = $_GET['action'];
    $id = (int)$_GET['id'];

    switch ($action) {
        case 'delete':
            $result = $notificationModel->delete($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            break;

        case 'send':
            $result = $notificationModel->send($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            break;
    }
}

// Get data
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';
$type = $_GET['type'] ?? '';

$data = $notificationModel->getAll($page, 20, $search, $status, $type);
$notifications = $data['notifications'];
$totalPages = $data['pages'];
$total = $data['total'];

$stats = $notificationModel->getStatistics();

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-bell-fill me-2"></i>Manage Notifications</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item active">Manage Notifications</li>
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
        <div class="stat-card bg-info">
            <div class="stat-value"><?php echo $stats['total']; ?></div>
            <div class="stat-label">Total Notifications</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card bg-warning">
            <div class="stat-value"><?php echo $stats['draft']; ?></div>
            <div class="stat-label">Drafts</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card bg-success">
            <div class="stat-value"><?php echo $stats['sent']; ?></div>
            <div class="stat-label">Sent</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card bg-primary">
            <div class="stat-value"><?php echo $stats['delivered']; ?></div>
            <div class="stat-label">Delivered</div>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
        <span>Notifications (<?php echo $total; ?>)</span>
        <a href="send-notification.php" class="btn btn-primary btn-sm">
            <i class="bi bi-plus-circle me-1"></i>New Notification
        </a>
    </div>
    <div class="card-body">
        <!-- Filters -->
        <form method="GET" class="row g-3 mb-4">
            <div class="col-md-3">
                <input type="text" class="form-control" name="search" placeholder="Search..."
                       value="<?php echo htmlspecialchars($search); ?>">
            </div>
            <div class="col-md-2">
                <select class="form-select" name="status">
                    <option value="">All Status</option>
                    <option value="draft" <?php echo $status === 'draft' ? 'selected' : ''; ?>>Draft</option>
                    <option value="sent" <?php echo $status === 'sent' ? 'selected' : ''; ?>>Sent</option>
                    <option value="scheduled" <?php echo $status === 'scheduled' ? 'selected' : ''; ?>>Scheduled</option>
                </select>
            </div>
            <div class="col-md-2">
                <select class="form-select" name="type">
                    <option value="">All Types</option>
                    <option value="info" <?php echo $type === 'info' ? 'selected' : ''; ?>>Info</option>
                    <option value="warning" <?php echo $type === 'warning' ? 'selected' : ''; ?>>Warning</option>
                    <option value="alert" <?php echo $type === 'alert' ? 'selected' : ''; ?>>Alert</option>
                    <option value="critical" <?php echo $type === 'critical' ? 'selected' : ''; ?>>Critical</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-primary w-100">Filter</button>
            </div>
            <div class="col-md-2">
                <a href="manage-notifications.php" class="btn btn-outline-secondary w-100">Reset</a>
            </div>
        </form>

        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Target</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($notifications)): ?>
                    <tr>
                        <td colspan="6" class="text-center py-4 text-muted">No notifications found</td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($notifications as $notification): ?>
                    <tr>
                        <td>
                            <strong><?php echo htmlspecialchars($notification['title']); ?></strong>
                            <br><small class="text-muted"><?php echo htmlspecialchars(substr($notification['message'], 0, 50)); ?>...</small>
                        </td>
                        <td><span class="notification-type <?php echo $notification['type']; ?>"><?php echo strtoupper($notification['type']); ?></span></td>
                        <td><?php echo ucfirst($notification['target_type']); ?></td>
                        <td>
                            <span class="badge bg-<?php echo $notification['status'] === 'sent' ? 'success' : ($notification['status'] === 'draft' ? 'secondary' : 'warning'); ?>">
                                <?php echo ucfirst($notification['status']); ?>
                            </span>
                        </td>
                        <td><small><?php echo date('M d, Y H:i', strtotime($notification['created_at'])); ?></small></td>
                        <td>
                            <?php if ($notification['status'] === 'draft'): ?>
                            <a href="?action=send&id=<?php echo $notification['id']; ?>" class="btn btn-action btn-success" title="Send">
                                <i class="bi bi-send"></i>
                            </a>
                            <?php endif; ?>
                            <a href="?action=delete&id=<?php echo $notification['id']; ?>"
                               class="btn btn-action btn-delete" data-name="this notification">
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
                <?php for ($i = 1; $i <= min($totalPages, 10); $i++): ?>
                <li class="page-item <?php echo $i === $page ? 'active' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $i; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($status); ?>&type=<?php echo urlencode($type); ?>"><?php echo $i; ?></a>
                </li>
                <?php endfor; ?>
            </ul>
        </nav>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
