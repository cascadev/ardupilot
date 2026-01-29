<?php
/**
 * Add DNV Website Page
 */
$pageTitle = 'Add DNV Website';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

$dnvModel = new DNVWebsite();

$message = '';
$messageType = '';
$formData = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$auth->validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $message = 'Invalid security token. Please try again.';
        $messageType = 'danger';
    } else {
        // Check if bulk add
        if (!empty($_POST['bulk_urls'])) {
            $urls = preg_split('/[\r\n]+/', trim($_POST['bulk_urls']));
            $result = $dnvModel->bulkAdd($urls, $_POST['reason'] ?? '', $_SESSION['admin_id']);
            $message = "Added: {$result['added']}, Skipped: {$result['skipped']}";
            if (!empty($result['errors'])) {
                $message .= ". Errors: " . implode('; ', array_slice($result['errors'], 0, 3));
            }
            $messageType = $result['added'] > 0 ? 'success' : 'warning';
            $auth->logAction($_SESSION['admin_id'], 'dnv_bulk_add', 'dnv_websites', null, null, ['added' => $result['added']]);
        } else {
            $formData = [
                'url' => trim($_POST['url'] ?? ''),
                'reason' => trim($_POST['reason'] ?? ''),
                'status' => $_POST['status'] ?? 'active'
            ];

            $result = $dnvModel->add($formData, $_SESSION['admin_id']);
            $message = $result['message'];
            $messageType = $result['success'] ? 'success' : 'danger';

            if ($result['success']) {
                $auth->logAction($_SESSION['admin_id'], 'dnv_add', 'dnv_websites', $result['id']);
                $formData = [];
            }
        }
    }
}

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-globe-americas me-2"></i>Add DNV Website</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Dashboard</a></li>
            <li class="breadcrumb-item"><a href="manage-dnv-websites.php">Manage DNV Websites</a></li>
            <li class="breadcrumb-item active">Add DNV Website</li>
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
    <div class="col-lg-6 mb-4">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-slash-circle me-2"></i>Add Single Website
            </div>
            <div class="card-body">
                <form method="POST" action="" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo $auth->generateCSRFToken(); ?>">

                    <div class="mb-3">
                        <label for="url" class="form-label">Website URL <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
                            <input type="text" class="form-control" id="url" name="url"
                                   placeholder="https://example.com"
                                   value="<?php echo htmlspecialchars($formData['url'] ?? ''); ?>" required>
                        </div>
                        <div class="form-text">Enter the full URL or domain to block</div>
                    </div>

                    <div class="mb-3">
                        <label for="reason" class="form-label">Reason for Blocking</label>
                        <textarea class="form-control" id="reason" name="reason" rows="3"
                                  placeholder="Enter reason for blocking this website..."><?php echo htmlspecialchars($formData['reason'] ?? ''); ?></textarea>
                    </div>

                    <div class="mb-4">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="active" <?php echo ($formData['status'] ?? 'active') === 'active' ? 'selected' : ''; ?>>Active (Blocked)</option>
                            <option value="inactive" <?php echo ($formData['status'] ?? '') === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                        </select>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-danger">
                            <i class="bi bi-slash-circle me-2"></i>Block Website
                        </button>
                        <a href="manage-dnv-websites.php" class="btn btn-outline-secondary">
                            <i class="bi bi-x-circle me-2"></i>Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-6 mb-4">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-list-ul me-2"></i>Bulk Add Websites
            </div>
            <div class="card-body">
                <form method="POST" action="">
                    <input type="hidden" name="csrf_token" value="<?php echo $auth->generateCSRFToken(); ?>">

                    <div class="mb-3">
                        <label for="bulk_urls" class="form-label">Website URLs (One per line)</label>
                        <textarea class="form-control" id="bulk_urls" name="bulk_urls" rows="8"
                                  placeholder="https://example1.com&#10;https://example2.com&#10;example3.com"></textarea>
                    </div>

                    <div class="mb-4">
                        <label for="bulk_reason" class="form-label">Common Reason</label>
                        <input type="text" class="form-control" id="bulk_reason" name="reason"
                               placeholder="Reason for blocking these websites...">
                    </div>

                    <button type="submit" class="btn btn-warning">
                        <i class="bi bi-list-check me-2"></i>Block All Websites
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <i class="bi bi-info-circle me-2"></i>Information
    </div>
    <div class="card-body">
        <div class="row">
            <div class="col-md-6">
                <h6>What is DNV (Do Not View)?</h6>
                <p class="text-muted">
                    DNV websites are blocked from being accessed by users on the Windows desktop application.
                    When a user tries to access a DNV website, they will be blocked and the attempt will be logged.
                </p>
            </div>
            <div class="col-md-6">
                <h6>URL Format</h6>
                <ul class="text-muted small">
                    <li>You can enter full URLs: <code>https://example.com/page</code></li>
                    <li>Or just domains: <code>example.com</code></li>
                    <li>Both HTTP and HTTPS versions will be blocked</li>
                    <li>Subdomains are blocked if the main domain is blocked</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
