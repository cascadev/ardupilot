<?php
/**
 * Edit DNV Website Page
 */
$pageTitle = 'Edit DNV Website';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$dnvModel = new DNVWebsite();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$id) {
    header('Location: manage-dnv-websites.php');
    exit;
}

$website = $dnvModel->getById($id);
if (!$website) {
    header('Location: manage-dnv-websites.php?error=Website not found');
    exit;
}

$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$auth->validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $message = 'Invalid security token.';
        $messageType = 'danger';
    } else {
        $updateData = [
            'url' => trim($_POST['url'] ?? ''),
            'reason' => trim($_POST['reason'] ?? ''),
            'status' => $_POST['status'] ?? 'active'
        ];

        $result = $dnvModel->update($id, $updateData);
        $message = $result['message'];
        $messageType = $result['success'] ? 'success' : 'danger';

        if ($result['success']) {
            $auth->logAction($_SESSION['admin_id'], 'dnv_update', 'dnv_websites', $id);
            $website = $dnvModel->getById($id);
        }
    }
}

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-pencil me-2"></i>Edit DNV Website</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item"><a href="manage-dnv-websites.php">Manage DNV Websites</a></li>
            <li class="breadcrumb-item active">Edit</li>
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
                <i class="bi bi-slash-circle me-2"></i>Edit Website
            </div>
            <div class="card-body">
                <form method="POST" action="" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo $auth->generateCSRFToken(); ?>">

                    <div class="mb-3">
                        <label for="url" class="form-label">Website URL <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="url" name="url"
                               value="<?php echo htmlspecialchars($website['url']); ?>" required>
                    </div>

                    <div class="mb-3">
                        <label for="reason" class="form-label">Reason</label>
                        <textarea class="form-control" id="reason" name="reason" rows="3"><?php echo htmlspecialchars($website['reason'] ?? ''); ?></textarea>
                    </div>

                    <div class="mb-4">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="active" <?php echo $website['status'] === 'active' ? 'selected' : ''; ?>>Active (Blocked)</option>
                            <option value="inactive" <?php echo $website['status'] === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                        </select>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-check-circle me-2"></i>Update
                        </button>
                        <a href="manage-dnv-websites.php" class="btn btn-outline-secondary">Cancel</a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">Details</div>
            <div class="card-body">
                <table class="table table-sm">
                    <tr><th>Added:</th><td><?php echo date('M d, Y H:i', strtotime($website['created_at'])); ?></td></tr>
                    <tr><th>Added By:</th><td><?php echo htmlspecialchars($website['added_by_name'] ?? 'System'); ?></td></tr>
                    <tr><th>Updated:</th><td><?php echo date('M d, Y H:i', strtotime($website['updated_at'])); ?></td></tr>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
