<?php
/**
 * Add New User Page
 */
$pageTitle = 'Add User';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$userModel = new User();

$message = '';
$messageType = '';
$formData = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$auth->validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $message = 'Invalid security token. Please try again.';
        $messageType = 'danger';
    } else {
        $formData = [
            'username' => trim($_POST['username'] ?? ''),
            'password' => $_POST['password'] ?? '',
            'email' => trim($_POST['email'] ?? ''),
            'full_name' => trim($_POST['full_name'] ?? ''),
            'phone' => trim($_POST['phone'] ?? ''),
            'department' => trim($_POST['department'] ?? ''),
            'status' => $_POST['status'] ?? 'active'
        ];

        $result = $userModel->create($formData, $_SESSION['admin_id']);
        $message = $result['message'];
        $messageType = $result['success'] ? 'success' : 'danger';

        if ($result['success']) {
            $auth->logAction($_SESSION['admin_id'], 'user_create', 'users', $result['id']);
            $formData = []; // Clear form on success

            // Show generated user ID
            $message .= ' User ID: ' . $result['user_id'];
        }
    }
}

// Get existing departments for autocomplete
$departments = $userModel->getDepartments();

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-person-plus me-2"></i>Add New User</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item"><a href="manage-users.php">Manage Users</a></li>
            <li class="breadcrumb-item active">Add User</li>
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
                <i class="bi bi-person-plus me-2"></i>User Information
            </div>
            <div class="card-body">
                <form method="POST" action="" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo $auth->generateCSRFToken(); ?>">

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="username" name="username"
                                   value="<?php echo htmlspecialchars($formData['username'] ?? ''); ?>"
                                   pattern="[a-zA-Z0-9_]+" required>
                            <div class="form-text">Only letters, numbers and underscores</div>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="password" class="form-label">Password <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="password" name="password"
                                       minlength="<?php echo PASSWORD_MIN_LENGTH; ?>" required>
                                <button class="btn btn-outline-secondary" type="button" onclick="generatePassword()">
                                    <i class="bi bi-magic"></i>
                                </button>
                            </div>
                            <div class="form-text">
                                Strength: <span id="password-strength">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="full_name" class="form-label">Full Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="full_name" name="full_name"
                                   value="<?php echo htmlspecialchars($formData['full_name'] ?? ''); ?>" required>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                            <input type="email" class="form-control" id="email" name="email"
                                   value="<?php echo htmlspecialchars($formData['email'] ?? ''); ?>" required>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="phone" class="form-label">Phone Number</label>
                            <input type="tel" class="form-control" id="phone" name="phone"
                                   value="<?php echo htmlspecialchars($formData['phone'] ?? ''); ?>">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="department" class="form-label">Department</label>
                            <input type="text" class="form-control" id="department" name="department"
                                   list="departmentList"
                                   value="<?php echo htmlspecialchars($formData['department'] ?? ''); ?>">
                            <datalist id="departmentList">
                                <?php foreach ($departments as $dept): ?>
                                <option value="<?php echo htmlspecialchars($dept['department']); ?>">
                                <?php endforeach; ?>
                            </datalist>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="active" <?php echo ($formData['status'] ?? 'active') === 'active' ? 'selected' : ''; ?>>Active</option>
                            <option value="inactive" <?php echo ($formData['status'] ?? '') === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                        </select>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-check-circle me-2"></i>Create User
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
                <i class="bi bi-info-circle me-2"></i>Information
            </div>
            <div class="card-body">
                <p class="text-muted">
                    Create a new user account for the Browser Access Management System.
                    Users will use these credentials to authenticate on the Windows desktop application.
                </p>

                <h6 class="mt-4">User ID</h6>
                <p class="text-muted small">
                    A unique User ID will be automatically generated upon creation.
                </p>

                <h6 class="mt-4">Password Requirements</h6>
                <ul class="small text-muted">
                    <li>Minimum <?php echo PASSWORD_MIN_LENGTH; ?> characters</li>
                    <li>Mix of letters, numbers recommended</li>
                    <li>Special characters allowed</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php
$pageScripts = <<<JS
<script>
function generatePassword() {
    var length = 12;
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#\$%^&*";
    var password = "";
    for (var i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    document.getElementById('password').value = password;
    document.getElementById('password').type = 'text';
    $('#password').trigger('input');

    setTimeout(function() {
        document.getElementById('password').type = 'password';
    }, 5000);
}
</script>
JS;

require_once __DIR__ . '/../includes/footer.php';
?>
