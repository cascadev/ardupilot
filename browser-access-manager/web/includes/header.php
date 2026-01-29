<?php
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$currentAdmin = $auth->getCurrentAdmin();

// Generate CSRF token
$csrfToken = $auth->generateCSRFToken();

// Get current page for menu highlighting
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? $pageTitle . ' - ' : ''; ?><?php echo APP_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/1.13.4/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <?php if ($auth->isLoggedIn()): ?>
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="admin-avatar">
                <i class="bi bi-person-circle"></i>
            </div>
            <div class="admin-info">
                <h6 class="mb-0"><?php echo htmlspecialchars($currentAdmin['name']); ?></h6>
                <small class="text-muted"><?php echo ucfirst($currentAdmin['role']); ?></small>
            </div>
        </div>

        <nav class="sidebar-nav">
            <ul class="nav flex-column">
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'index' ? 'active' : ''; ?>" href="index.php">
                        <i class="bi bi-speedometer2"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'change-password' ? 'active' : ''; ?>" href="change-password.php">
                        <i class="bi bi-key"></i>
                        <span>Change Admin Password</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'manage-users' ? 'active' : ''; ?>" href="manage-users.php">
                        <i class="bi bi-people"></i>
                        <span>Manage Users</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'add-user' ? 'active' : ''; ?>" href="add-user.php">
                        <i class="bi bi-person-plus"></i>
                        <span>Add User</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'send-notification' ? 'active' : ''; ?>" href="send-notification.php">
                        <i class="bi bi-bell"></i>
                        <span>Send Notification</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'manage-notifications' ? 'active' : ''; ?>" href="manage-notifications.php">
                        <i class="bi bi-bell-fill"></i>
                        <span>Manage Notifications</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'manage-ips' ? 'active' : ''; ?>" href="manage-ips.php">
                        <i class="bi bi-hdd-network"></i>
                        <span>Manage IP Addresses</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'manage-browsing-history' ? 'active' : ''; ?>" href="manage-browsing-history.php">
                        <i class="bi bi-clock-history"></i>
                        <span>Manage Browsing History</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'add-dnv-website' ? 'active' : ''; ?>" href="add-dnv-website.php">
                        <i class="bi bi-globe-americas"></i>
                        <span>Add DNV Website</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'manage-dnv-websites' ? 'active' : ''; ?>" href="manage-dnv-websites.php">
                        <i class="bi bi-slash-circle"></i>
                        <span>Manage DNV Websites</span>
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content" id="main-content">
        <!-- Top Navbar -->
        <nav class="navbar navbar-expand-lg navbar-light bg-primary top-navbar">
            <div class="container-fluid">
                <button class="btn btn-link text-white sidebar-toggle" id="sidebarToggle">
                    <i class="bi bi-list fs-4"></i>
                </button>
                <span class="navbar-brand text-white fw-bold"><?php echo APP_NAME; ?></span>
                <div class="ms-auto">
                    <a href="logout.php" class="btn btn-outline-light btn-sm">
                        <i class="bi bi-box-arrow-right"></i> Logout
                    </a>
                </div>
            </div>
        </nav>
        <?php endif; ?>

        <!-- Page Content -->
        <div class="content-wrapper <?php echo !$auth->isLoggedIn() ? 'no-sidebar' : ''; ?>">
