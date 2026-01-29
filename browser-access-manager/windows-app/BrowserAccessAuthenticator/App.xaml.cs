using System;
using System.Threading;
using System.Windows;
using BrowserAccessAuthenticator.Services;
using BrowserAccessAuthenticator.Views;

namespace BrowserAccessAuthenticator
{
    public partial class App : Application
    {
        private static Mutex? _mutex;
        private System.Windows.Forms.NotifyIcon? _notifyIcon;

        public static ApiService ApiService { get; private set; } = null!;
        public static ConfigService ConfigService { get; private set; } = null!;
        public static BrowserMonitorService BrowserMonitor { get; private set; } = null!;
        public static NotificationService NotificationService { get; private set; } = null!;

        public static string? AuthToken { get; set; }
        public static Models.User? CurrentUser { get; set; }

        protected override void OnStartup(StartupEventArgs e)
        {
            // Ensure single instance
            const string appName = "BrowserAccessAuthenticator";
            _mutex = new Mutex(true, appName, out bool createdNew);

            if (!createdNew)
            {
                MessageBox.Show("Browser Access Authenticator is already running.",
                    "Already Running", MessageBoxButton.OK, MessageBoxImage.Information);
                Shutdown();
                return;
            }

            base.OnStartup(e);

            // Initialize services
            ConfigService = new ConfigService();
            ApiService = new ApiService(ConfigService.ApiBaseUrl);
            BrowserMonitor = new BrowserMonitorService();
            NotificationService = new NotificationService();

            // Setup system tray icon
            SetupNotifyIcon();
        }

        private void SetupNotifyIcon()
        {
            _notifyIcon = new System.Windows.Forms.NotifyIcon
            {
                Icon = System.Drawing.SystemIcons.Shield,
                Visible = true,
                Text = "Browser Access Authenticator"
            };

            var contextMenu = new System.Windows.Forms.ContextMenuStrip();
            contextMenu.Items.Add("Show", null, (s, e) => ShowMainWindow());
            contextMenu.Items.Add("-");
            contextMenu.Items.Add("Logout", null, (s, e) => Logout());
            contextMenu.Items.Add("Exit", null, (s, e) => ExitApplication());

            _notifyIcon.ContextMenuStrip = contextMenu;
            _notifyIcon.DoubleClick += (s, e) => ShowMainWindow();
        }

        public void ShowMainWindow()
        {
            if (CurrentUser != null)
            {
                var mainWindow = Windows.OfType<MainWindow>().FirstOrDefault();
                if (mainWindow == null)
                {
                    mainWindow = new MainWindow();
                    mainWindow.Show();
                }
                else
                {
                    mainWindow.Activate();
                }
            }
        }

        public void ShowNotification(string title, string message, System.Windows.Forms.ToolTipIcon icon = System.Windows.Forms.ToolTipIcon.Info)
        {
            _notifyIcon?.ShowBalloonTip(5000, title, message, icon);
        }

        public static async void Logout()
        {
            try
            {
                if (!string.IsNullOrEmpty(AuthToken))
                {
                    await ApiService.LogoutAsync(AuthToken);
                }
            }
            catch { }

            AuthToken = null;
            CurrentUser = null;
            BrowserMonitor.Stop();
            NotificationService.Stop();

            // Close all windows and show login
            foreach (Window window in Current.Windows)
            {
                if (window is not LoginWindow)
                {
                    window.Close();
                }
            }

            var loginWindow = new LoginWindow();
            loginWindow.Show();
        }

        public void ExitApplication()
        {
            if (MessageBox.Show("Are you sure you want to exit Browser Access Authenticator?\n\nNote: You will need to login again to access browsers.",
                "Exit Confirmation", MessageBoxButton.YesNo, MessageBoxImage.Question) == MessageBoxResult.Yes)
            {
                Logout();
                _notifyIcon?.Dispose();
                Shutdown();
            }
        }

        protected override void OnExit(ExitEventArgs e)
        {
            _notifyIcon?.Dispose();
            _mutex?.ReleaseMutex();
            _mutex?.Dispose();
            base.OnExit(e);
        }
    }
}
