<?php
/**
 * Manage Users Page
 */
$pageTitle = 'Manage Users';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$userModel = new User();

// Handle actions
$message = '';
$messageType = '';

if (isset($_GET['action']) && isset($_GET['id'])) {
    $action = $_GET['action'];
    $id = (int)$_GET['id'];

    switch ($action) {
        case 'delete':
            $result = $userModel->delete($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            $auth->logAction($_SESSION['admin_id'], 'user_delete', 'users', $id);
            break;

        case 'toggle':
            $result = $userModel->toggleStatus($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            $auth->logAction($_SESSION['admin_id'], 'user_toggle_status', 'users', $id);
            break;

        case 'block':
            $result = $userModel->block($id);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';
            $auth->logAction($_SESSION['admin_id'], 'user_block', 'users', $id);
            break;
    }
}

// Get filters
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';

// Get users
$userData = $userModel->getAll($page, 20, $search, $status);
$users = $userData['users'];
$totalPages = $userData['pages'];
$total = $userData['total'];

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-people me-2"></i>Manage Users</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item active">Manage Users</li>
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
        <span><i class="bi bi-list me-2"></i>Users List (<?php echo $total; ?> total)</span>
        <a href="add-user.php" class="btn btn-primary btn-sm">
            <i class="bi bi-person-plus me-1"></i>Add New User
        </a>
    </div>
    <div class="card-body">
        <!-- Filters -->
        <form method="GET" class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" name="search" placeholder="Search users..."
                           value="<?php echo htmlspecialchars($search); ?>">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" name="status">
                    <option value="">All Status</option>
                    <option value="active" <?php echo $status === 'active' ? 'selected' : ''; ?>>Active</option>
                    <option value="inactive" <?php echo $status === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                    <option value="blocked" <?php echo $status === 'blocked' ? 'selected' : ''; ?>>Blocked</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-primary w-100">Filter</button>
            </div>
            <div class="col-md-2">
                <a href="manage-users.php" class="btn btn-outline-secondary w-100">Reset</a>
            </div>
        </form>

        <!-- Users Table -->
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($users)): ?>
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <div class="empty-state">
                                <i class="bi bi-people"></i>
                                <h4>No Users Found</h4>
                                <p class="text-muted">No users match your search criteria</p>
                            </div>
                        </td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($users as $user): ?>
                    <tr>
                        <td><code><?php echo htmlspecialchars($user['user_id']); ?></code></td>
                        <td><strong><?php echo htmlspecialchars($user['username']); ?></strong></td>
                        <td><?php echo htmlspecialchars($user['full_name']); ?></td>
                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                        <td><?php echo htmlspecialchars($user['department'] ?? '-'); ?></td>
                        <td>
                            <span class="badge-status badge-<?php echo $user['status']; ?>">
                                <?php echo ucfirst($user['status']); ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($user['last_login']): ?>
                                <small><?php echo date('M d, Y H:i', strtotime($user['last_login'])); ?></small>
                            <?php else: ?>
                                <small class="text-muted">Never</small>
                            <?php endif; ?>
                        </td>
                        <td>
                            <div class="toggle-switch-container">
                                <a href="?action=toggle&id=<?php echo $user['id']; ?>"
                                   class="btn-toggle-status"
                                   data-status="<?php echo $user['status']; ?>"
                                   title="Toggle Status">
                                    <i class="bi bi-<?php echo $user['status'] === 'active' ? 'toggle-on text-success' : 'toggle-off text-secondary'; ?> toggle-icon fs-4"></i>
                                </a>
                            </div>
                            <a href="edit-user.php?id=<?php echo $user['id']; ?>" class="btn btn-action btn-edit" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </a>
                            <a href="?action=delete&id=<?php echo $user['id']; ?>"
                               class="btn btn-action btn-delete"
                               data-name="<?php echo htmlspecialchars($user['username']); ?>"
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
