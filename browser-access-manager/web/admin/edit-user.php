<?php
/**
 * Edit User Page
 */
$pageTitle = 'Edit User';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$userModel = new User();

// Get user ID
$userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$userId) {
    header('Location: manage-users.php');
    exit;
}

// Get user data
$user = $userModel->getById($userId);
if (!$user) {
    header('Location: manage-users.php?error=User not found');
    exit;
}

$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$auth->validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $message = 'Invalid security token. Please try again.';
        $messageType = 'danger';
    } else {
        $updateData = [
            'username' => trim($_POST['username'] ?? ''),
            'email' => trim($_POST['email'] ?? ''),
            'full_name' => trim($_POST['full_name'] ?? ''),
            'phone' => trim($_POST['phone'] ?? ''),
            'department' => trim($_POST['department'] ?? ''),
            'status' => $_POST['status'] ?? 'active'
        ];

        // Only include password if provided
        if (!empty($_POST['password'])) {
            $updateData['password'] = $_POST['password'];
        }

        $oldData = $user;
        $result = $userModel->update($userId, $updateData);
        $message = $result['message'];
        $messageType = $result['success'] ? 'success' : 'danger';

        if ($result['success']) {
            $auth->logAction($_SESSION['admin_id'], 'user_update', 'users', $userId, $oldData, $updateData);
            // Refresh user data
            $user = $userModel->getById($userId);
        }
    }
}

// Get existing departments for autocomplete
$departments = $userModel->getDepartments();

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-person-gear me-2"></i>Edit User</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item"><a href="manage-users.php">Manage Users</a></li>
            <li class="breadcrumb-item active">Edit User</li>
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

<div class="row">
    <div class="col-lg-8">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-person me-2"></i>Edit User: <?php echo htmlspecialchars($user['username']); ?>
            </div>
            <div class="card-body">
                <form method="POST" action="" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo $auth->generateCSRFToken(); ?>">

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="user_id" class="form-label">User ID</label>
                            <input type="text" class="form-control" id="user_id"
                                   value="<?php echo htmlspecialchars($user['user_id']); ?>" readonly>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="username" name="username"
                                   value="<?php echo htmlspecialchars($user['username']); ?>"
                                   pattern="[a-zA-Z0-9_]+" required>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="full_name" class="form-label">Full Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="full_name" name="full_name"
                                   value="<?php echo htmlspecialchars($user['full_name']); ?>" required>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                            <input type="email" class="form-control" id="email" name="email"
                                   value="<?php echo htmlspecialchars($user['email']); ?>" required>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="phone" class="form-label">Phone Number</label>
                            <input type="tel" class="form-control" id="phone" name="phone"
                                   value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="department" class="form-label">Department</label>
                            <input type="text" class="form-control" id="department" name="department"
                                   list="departmentList"
                                   value="<?php echo htmlspecialchars($user['department'] ?? ''); ?>">
                            <datalist id="departmentList">
                                <?php foreach ($departments as $dept): ?>
                                <option value="<?php echo htmlspecialchars($dept['department']); ?>">
                                <?php endforeach; ?>
                            </datalist>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="password" class="form-label">New Password</label>
                            <input type="password" class="form-control" id="password" name="password"
                                   minlength="<?php echo PASSWORD_MIN_LENGTH; ?>">
                            <div class="form-text">Leave blank to keep current password</div>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="status" class="form-label">Status</label>
                            <select class="form-select" id="status" name="status">
                                <option value="active" <?php echo $user['status'] === 'active' ? 'selected' : ''; ?>>Active</option>
                                <option value="inactive" <?php echo $user['status'] === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                                <option value="blocked" <?php echo $user['status'] === 'blocked' ? 'selected' : ''; ?>>Blocked</option>
                            </select>
                        </div>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-check-circle me-2"></i>Update User
                        </button>
                        <a href="manage-users.php" class="btn btn-outline-secondary">
                            <i class="bi bi-x-circle me-2"></i>Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-info-circle me-2"></i>User Details
            </div>
            <div class="card-body">
                <table class="table table-sm">
                    <tr>
                        <th>Created:</th>
                        <td><?php echo date('M d, Y H:i', strtotime($user['created_at'])); ?></td>
                    </tr>
                    <tr>
                        <th>Last Login:</th>
                        <td>
                            <?php if ($user['last_login']): ?>
                                <?php echo date('M d, Y H:i', strtotime($user['last_login'])); ?>
                            <?php else: ?>
                                <span class="text-muted">Never</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th>Last IP:</th>
                        <td><?php echo htmlspecialchars($user['last_ip'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <th>Machine:</th>
                        <td><?php echo htmlspecialchars($user['machine_name'] ?? 'N/A'); ?></td>
                    </tr>
                </table>

                <div class="mt-3">
                    <a href="manage-browsing-history.php?user_id=<?php echo $userId; ?>" class="btn btn-outline-info btn-sm w-100 mb-2">
                        <i class="bi bi-clock-history me-1"></i>View Browsing History
                    </a>
                    <a href="?id=<?php echo $userId; ?>&action=delete" class="btn btn-outline-danger btn-sm w-100 btn-delete"
                       data-name="<?php echo htmlspecialchars($user['username']); ?>">
                        <i class="bi bi-trash me-1"></i>Delete User
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
