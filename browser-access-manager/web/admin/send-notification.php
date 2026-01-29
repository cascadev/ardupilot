<?php
/**
 * Send Notification Page
 */
$pageTitle = 'Send Notification';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$notificationModel = new Notification();
$userModel = new User();

$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$auth->validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $message = 'Invalid security token.';
        $messageType = 'danger';
    } else {
        $data = [
            'title' => trim($_POST['title'] ?? ''),
            'message' => trim($_POST['message'] ?? ''),
            'type' => $_POST['type'] ?? 'info',
            'priority' => (int)($_POST['priority'] ?? 1),
            'target_type' => $_POST['target_type'] ?? 'all',
            'target_users' => !empty($_POST['target_users']) ? json_decode($_POST['target_users'], true) : null,
            'target_department' => $_POST['target_department'] ?? null,
            'expires_at' => !empty($_POST['expires_at']) ? $_POST['expires_at'] : null
        ];

        // Create and send
        $result = $notificationModel->create($data, $_SESSION['admin_id']);
        if ($result['success']) {
            $sendResult = $notificationModel->send($result['id']);
            $message = $sendResult['message'];
            $messageType = $sendResult['success'] ? 'success' : 'danger';
        } else {
            $message = $result['message'];
            $messageType = 'danger';
        }
    }
}

$departments = $userModel->getDepartments();
$users = $userModel->getAll(1, 100)['users'];

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-bell me-2"></i>Send Notification</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item active">Send Notification</li>
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
    <div class="col-lg-8">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-send me-2"></i>Compose Notification
            </div>
            <div class="card-body">
                <form method="POST" action="" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo $auth->generateCSRFToken(); ?>">
                    <input type="hidden" name="target_users" id="target_users" value="">

                    <div class="row">
                        <div class="col-md-8 mb-3">
                            <label for="title" class="form-label">Title <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="title" name="title"
                                   placeholder="Notification title..." required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label for="type" class="form-label">Type</label>
                            <select class="form-select" id="type" name="type">
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="alert">Alert</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="message" class="form-label">Message <span class="text-danger">*</span></label>
                        <textarea class="form-control" id="message" name="message" rows="5"
                                  placeholder="Enter notification message..." required></textarea>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="target_type" class="form-label">Send To</label>
                            <select class="form-select" id="target_type" name="target_type" onchange="toggleTargetOptions()">
                                <option value="all">All Users</option>
                                <option value="specific">Specific Users</option>
                                <option value="department">Department</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="priority" class="form-label">Priority</label>
                            <select class="form-select" id="priority" name="priority">
                                <option value="1">Normal</option>
                                <option value="2">High</option>
                                <option value="3">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <!-- Department Select (hidden by default) -->
                    <div id="departmentSelect" class="mb-3" style="display:none;">
                        <label for="target_department" class="form-label">Select Department</label>
                        <select class="form-select" id="target_department" name="target_department">
                            <option value="">-- Select Department --</option>
                            <?php foreach ($departments as $dept): ?>
                            <option value="<?php echo htmlspecialchars($dept['department']); ?>">
                                <?php echo htmlspecialchars($dept['department']); ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <!-- User Select (hidden by default) -->
                    <div id="userSelect" class="mb-3" style="display:none;">
                        <label class="form-label">Select Users</label>
                        <input type="text" class="form-control mb-2" id="userSearch" placeholder="Search users...">
                        <div id="selectedUsers" class="mb-2"></div>
                        <div id="userSearchResults" class="list-group" style="display:none; max-height:200px; overflow-y:auto;"></div>
                        <div class="form-text">Search and click to add users</div>
                    </div>

                    <div class="mb-4">
                        <label for="expires_at" class="form-label">Expires At (Optional)</label>
                        <input type="datetime-local" class="form-control" id="expires_at" name="expires_at">
                        <div class="form-text">Leave empty for no expiration</div>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-send me-2"></i>Send Notification
                        </button>
                        <a href="manage-notifications.php" class="btn btn-outline-secondary">Cancel</a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-eye me-2"></i>Preview
            </div>
            <div class="card-body">
                <div id="notificationPreview" class="alert alert-info">
                    <h6 id="previewTitle">Notification Title</h6>
                    <p id="previewMessage" class="mb-0 small">Notification message will appear here...</p>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header">Notification Types</div>
            <div class="card-body">
                <ul class="list-unstyled mb-0">
                    <li class="mb-2"><span class="notification-type info">INFO</span> General information</li>
                    <li class="mb-2"><span class="notification-type warning">WARNING</span> Important warnings</li>
                    <li class="mb-2"><span class="notification-type alert">ALERT</span> Alerts requiring attention</li>
                    <li class="mb-0"><span class="notification-type critical">CRITICAL</span> Critical/urgent messages</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php
$pageScripts = <<<'JS'
<script>
function toggleTargetOptions() {
    var type = document.getElementById('target_type').value;
    document.getElementById('departmentSelect').style.display = type === 'department' ? 'block' : 'none';
    document.getElementById('userSelect').style.display = type === 'specific' ? 'block' : 'none';
}

// Live preview
document.getElementById('title').addEventListener('input', function() {
    document.getElementById('previewTitle').textContent = this.value || 'Notification Title';
});
document.getElementById('message').addEventListener('input', function() {
    document.getElementById('previewMessage').textContent = this.value || 'Notification message will appear here...';
});
document.getElementById('type').addEventListener('change', function() {
    var preview = document.getElementById('notificationPreview');
    preview.className = 'alert alert-' + (this.value === 'critical' ? 'danger' : this.value === 'warning' ? 'warning' : this.value === 'alert' ? 'warning' : 'info');
});
</script>
JS;

require_once __DIR__ . '/../includes/footer.php';
?>
