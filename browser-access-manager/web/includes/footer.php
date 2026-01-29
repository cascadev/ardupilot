        </div>
        <!-- End Page Content -->

        <?php if (isset($auth) && $auth->isLoggedIn()): ?>
        <!-- Footer -->
        <footer class="footer">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-6">
                        <span class="text-muted">Copyright &copy; <?php echo date('Y'); ?>. Powered by Casca E-Connect Private Limited</span>
                    </div>
                    <div class="col-md-6 text-md-end">
                        <span class="text-muted">Version <?php echo APP_VERSION; ?></span>
                    </div>
                </div>
            </div>
        </footer>
    </div>
    <?php endif; ?>

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Bootstrap Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- DataTables -->
    <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.4/js/dataTables.bootstrap5.min.js"></script>
    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- Custom JS -->
    <script src="assets/js/main.js"></script>

    <?php if (isset($pageScripts)): ?>
    <?php echo $pageScripts; ?>
    <?php endif; ?>
</body>
</html>
