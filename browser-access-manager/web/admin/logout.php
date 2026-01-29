<?php
/**
 * Logout Handler
 */
require_once __DIR__ . '/../config/config.php';

$auth = new Auth();
$auth->logout();

header('Location: login.php');
exit;
