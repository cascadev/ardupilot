/**
 * Browser Access Management System - Main JavaScript
 */

$(document).ready(function() {
    // Sidebar Toggle
    $('#sidebarToggle').on('click', function() {
        $('#sidebar').toggleClass('collapsed');
        $('#main-content').toggleClass('expanded');
        localStorage.setItem('sidebarCollapsed', $('#sidebar').hasClass('collapsed'));
    });

    // Restore sidebar state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        $('#sidebar').addClass('collapsed');
        $('#main-content').addClass('expanded');
    }

    // Mobile sidebar
    if ($(window).width() < 992) {
        $('#sidebarToggle').on('click', function() {
            $('#sidebar').toggleClass('show');
        });

        // Close sidebar on click outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#sidebar, #sidebarToggle').length) {
                $('#sidebar').removeClass('show');
            }
        });
    }

    // Initialize DataTables
    if ($.fn.DataTable && $('.data-table').length) {
        $('.data-table').DataTable({
            responsive: true,
            pageLength: 20,
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                paginate: {
                    first: '<i class="bi bi-chevron-double-left"></i>',
                    last: '<i class="bi bi-chevron-double-right"></i>',
                    next: '<i class="bi bi-chevron-right"></i>',
                    previous: '<i class="bi bi-chevron-left"></i>'
                }
            },
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip'
        });
    }

    // Delete confirmation
    $(document).on('click', '.btn-delete', function(e) {
        e.preventDefault();
        var url = $(this).attr('href') || $(this).data('url');
        var itemName = $(this).data('name') || 'this item';

        Swal.fire({
            title: 'Are you sure?',
            text: 'You are about to delete ' + itemName + '. This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = url;
            }
        });
    });

    // Toggle status
    $(document).on('click', '.btn-toggle-status', function(e) {
        e.preventDefault();
        var url = $(this).data('url');
        var currentStatus = $(this).data('status');
        var newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        Swal.fire({
            title: 'Change Status?',
            text: 'Change status to ' + newStatus + '?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#17a2b8',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, change it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = url;
            }
        });
    });

    // Form validation
    $('form.needs-validation').on('submit', function(e) {
        if (!this.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
        $(this).addClass('was-validated');
    });

    // Password strength indicator
    $('#password, #new_password').on('input', function() {
        var password = $(this).val();
        var strength = 0;
        var indicator = $('#password-strength');

        if (password.length >= 8) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[$@#&!]+/)) strength++;

        var strengthText = '';
        var strengthClass = '';

        switch(strength) {
            case 0:
            case 1:
                strengthText = 'Weak';
                strengthClass = 'text-danger';
                break;
            case 2:
            case 3:
                strengthText = 'Medium';
                strengthClass = 'text-warning';
                break;
            case 4:
            case 5:
                strengthText = 'Strong';
                strengthClass = 'text-success';
                break;
        }

        if (indicator.length) {
            indicator.removeClass('text-danger text-warning text-success')
                    .addClass(strengthClass)
                    .text(strengthText);
        }
    });

    // Confirm password validation
    $('#confirm_password').on('input', function() {
        var password = $('#password, #new_password').val();
        var confirmPassword = $(this).val();

        if (password !== confirmPassword) {
            this.setCustomValidity('Passwords do not match');
        } else {
            this.setCustomValidity('');
        }
    });

    // Auto-hide alerts
    setTimeout(function() {
        $('.alert-dismissible').fadeOut('slow', function() {
            $(this).remove();
        });
    }, 5000);

    // Select all checkbox
    $('#selectAll').on('change', function() {
        $('.row-checkbox').prop('checked', $(this).prop('checked'));
        updateBulkActions();
    });

    $('.row-checkbox').on('change', function() {
        updateBulkActions();
    });

    function updateBulkActions() {
        var checkedCount = $('.row-checkbox:checked').length;
        if (checkedCount > 0) {
            $('#bulkActionsContainer').show();
            $('#selectedCount').text(checkedCount);
        } else {
            $('#bulkActionsContainer').hide();
        }
    }

    // URL validation for DNV websites
    $('#url').on('input', function() {
        var url = $(this).val();
        var urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

        if (url && !urlPattern.test(url)) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    // IP address validation
    $('#ip_address').on('input', function() {
        var ip = $(this).val();
        var ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        var ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

        if (ip && !ipv4Pattern.test(ip) && !ipv6Pattern.test(ip)) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    // User search autocomplete
    if ($('#userSearch').length) {
        var searchTimeout;
        $('#userSearch').on('input', function() {
            clearTimeout(searchTimeout);
            var query = $(this).val();

            if (query.length < 2) {
                $('#userSearchResults').hide();
                return;
            }

            searchTimeout = setTimeout(function() {
                $.ajax({
                    url: 'ajax/search-users.php',
                    data: { q: query },
                    success: function(response) {
                        var results = JSON.parse(response);
                        var html = '';
                        results.forEach(function(user) {
                            html += '<div class="search-result-item" data-id="' + user.id + '">';
                            html += '<strong>' + user.username + '</strong> - ' + user.full_name;
                            html += '</div>';
                        });
                        $('#userSearchResults').html(html).show();
                    }
                });
            }, 300);
        });

        $(document).on('click', '.search-result-item', function() {
            var userId = $(this).data('id');
            var userName = $(this).find('strong').text();
            addSelectedUser(userId, userName);
            $('#userSearch').val('');
            $('#userSearchResults').hide();
        });
    }

    // Selected users management
    var selectedUsers = [];

    function addSelectedUser(id, name) {
        if (selectedUsers.indexOf(id) === -1) {
            selectedUsers.push(id);
            var badge = '<span class="badge bg-primary me-1 selected-user" data-id="' + id + '">';
            badge += name + ' <i class="bi bi-x" style="cursor:pointer"></i></span>';
            $('#selectedUsers').append(badge);
            updateSelectedUsersInput();
        }
    }

    $(document).on('click', '.selected-user i', function() {
        var badge = $(this).parent();
        var id = badge.data('id');
        selectedUsers = selectedUsers.filter(function(item) {
            return item != id;
        });
        badge.remove();
        updateSelectedUsersInput();
    });

    function updateSelectedUsersInput() {
        $('#target_users').val(JSON.stringify(selectedUsers));
    }

    // Notification type icon preview
    $('#notification_type').on('change', function() {
        var type = $(this).val();
        var icon = '';
        switch(type) {
            case 'info': icon = '<i class="bi bi-info-circle text-info"></i>'; break;
            case 'warning': icon = '<i class="bi bi-exclamation-triangle text-warning"></i>'; break;
            case 'alert': icon = '<i class="bi bi-bell text-danger"></i>'; break;
            case 'critical': icon = '<i class="bi bi-exclamation-octagon text-danger"></i>'; break;
        }
        $('#typeIconPreview').html(icon);
    });

    // Date range picker initialization
    if ($('.date-picker').length) {
        $('.date-picker').attr('type', 'date');
    }

    // Export functionality
    $('#exportBtn').on('click', function() {
        var format = $(this).data('format') || 'csv';
        var url = window.location.href;
        url += (url.indexOf('?') > -1 ? '&' : '?') + 'export=' + format;
        window.location.href = url;
    });

    // Print functionality
    $('#printBtn').on('click', function() {
        window.print();
    });

    // Tooltips initialization
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Utility Functions
function showAlert(type, message) {
    Swal.fire({
        icon: type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        text: message,
        timer: 3000,
        showConfirmButton: false
    });
}

function formatDate(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showAlert('success', 'Copied to clipboard!');
    });
}
