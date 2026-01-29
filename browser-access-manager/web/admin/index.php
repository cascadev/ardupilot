<?php
/**
 * Admin Dashboard
 */
$pageTitle = 'Dashboard';
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->requireLogin();

// Get statistics
$userModel = new User();
$dnvModel = new DNVWebsite();
$ipModel = new BlockedIP();
$notificationModel = new Notification();
$historyModel = new BrowsingHistory();

$userStats = $userModel->getStatistics();
$dnvStats = $dnvModel->getStatistics();
$ipStats = $ipModel->getStatistics();
$notificationStats = $notificationModel->getStatistics();
$browsingStats = $historyModel->getStatistics();

// Get recent activity
$db = Database::getInstance();
$recentUsers = $db->fetchAll("SELECT * FROM users ORDER BY created_at DESC LIMIT 5");
$recentHistory = $db->fetchAll(
    "SELECT bh.*, u.username FROM browsing_history bh
     JOIN users u ON bh.user_id = u.id
     ORDER BY bh.visit_time DESC LIMIT 10"
);

require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1><i class="bi bi-speedometer2 me-2"></i>Dashboard</h1>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item active">Dashboard</li>
        </ol>
    </nav>
</div>

<!-- Statistics Cards -->
<div class="row mb-4">
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-primary">
            <div class="stat-value"><?php echo $userStats['total']; ?></div>
            <div class="stat-label">Total Users</div>
            <i class="bi bi-people stat-icon"></i>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-success">
            <div class="stat-value"><?php echo $userStats['active']; ?></div>
            <div class="stat-label">Active Users</div>
            <i class="bi bi-person-check stat-icon"></i>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-warning">
            <div class="stat-value"><?php echo $userStats['online']; ?></div>
            <div class="stat-label">Online Now</div>
            <i class="bi bi-broadcast stat-icon"></i>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-danger">
            <div class="stat-value"><?php echo $userStats['blocked']; ?></div>
            <div class="stat-label">Blocked Users</div>
            <i class="bi bi-person-x stat-icon"></i>
        </div>
    </div>
</div>

<div class="row mb-4">
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-info">
            <div class="stat-value"><?php echo $dnvStats['active']; ?></div>
            <div class="stat-label">Blocked Websites</div>
            <i class="bi bi-slash-circle stat-icon"></i>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-danger">
            <div class="stat-value"><?php echo $ipStats['active']; ?></div>
            <div class="stat-label">Blocked IPs</div>
            <i class="bi bi-hdd-network stat-icon"></i>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-primary">
            <div class="stat-value"><?php echo $notificationStats['sent']; ?></div>
            <div class="stat-label">Notifications Sent</div>
            <i class="bi bi-bell stat-icon"></i>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-3">
        <div class="stat-card bg-success">
            <div class="stat-value"><?php echo $browsingStats['today_visits']; ?></div>
            <div class="stat-label">Today's Visits</div>
            <i class="bi bi-globe stat-icon"></i>
        </div>
    </div>
</div>

<div class="row">
    <!-- Recent Users -->
    <div class="col-xl-6 mb-4">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span><i class="bi bi-people me-2"></i>Recent Users</span>
                <a href="manage-users.php" class="btn btn-sm btn-primary">View All</a>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($recentUsers)): ?>
                            <tr>
                                <td colspan="4" class="text-center py-4 text-muted">No users found</td>
                            </tr>
                            <?php else: ?>
                            <?php foreach ($recentUsers as $user): ?>
                            <tr>
                                <td><code><?php echo htmlspecialchars($user['user_id']); ?></code></td>
                                <td><?php echo htmlspecialchars($user['username']); ?></td>
                                <td><?php echo htmlspecialchars($user['full_name']); ?></td>
                                <td>
                                    <span class="badge-status badge-<?php echo $user['status']; ?>">
                                        <?php echo ucfirst($user['status']); ?>
                                    </span>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Browsing Activity -->
    <div class="col-xl-6 mb-4">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span><i class="bi bi-clock-history me-2"></i>Recent Activity</span>
                <a href="manage-browsing-history.php" class="btn btn-sm btn-primary">View All</a>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>URL</th>
                                <th>Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($recentHistory)): ?>
                            <tr>
                                <td colspan="4" class="text-center py-4 text-muted">No activity found</td>
                            </tr>
                            <?php else: ?>
                            <?php foreach ($recentHistory as $history): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($history['username']); ?></td>
                                <td class="url-cell" title="<?php echo htmlspecialchars($history['url']); ?>">
                                    <?php echo htmlspecialchars(substr($history['url'], 0, 40)); ?>...
                                </td>
                                <td><small><?php echo date('M d, H:i', strtotime($history['visit_time'])); ?></small></td>
                                <td>
                                    <?php if ($history['blocked']): ?>
                                    <span class="badge bg-danger">Blocked</span>
                                    <?php else: ?>
                                    <span class="badge bg-success">Allowed</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <i class="bi bi-lightning me-2"></i>Quick Actions
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 col-sm-6 mb-3">
                        <a href="add-user.php" class="btn btn-outline-primary w-100 py-3">
                            <i class="bi bi-person-plus d-block mb-2" style="font-size: 24px;"></i>
                            Add New User
                        </a>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <a href="add-dnv-website.php" class="btn btn-outline-danger w-100 py-3">
                            <i class="bi bi-slash-circle d-block mb-2" style="font-size: 24px;"></i>
                            Block Website
                        </a>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <a href="send-notification.php" class="btn btn-outline-warning w-100 py-3">
                            <i class="bi bi-bell d-block mb-2" style="font-size: 24px;"></i>
                            Send Notification
                        </a>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <a href="manage-browsing-history.php" class="btn btn-outline-info w-100 py-3">
                            <i class="bi bi-clock-history d-block mb-2" style="font-size: 24px;"></i>
                            View History
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
