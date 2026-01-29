using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace BrowserAccessAuthenticator.Views
{
    public partial class MainWindow : Window
    {
        private readonly DispatcherTimer _sessionTimer;
        private DateTime _sessionStart;
        private int _blockedCount = 0;

        public MainWindow()
        {
            InitializeComponent();

            // Initialize user info
            if (App.CurrentUser != null)
            {
                UserNameText.Text = App.CurrentUser.FullName;
                UserIdText.Text = $"ID: {App.CurrentUser.UserId}";
            }

            // Start session timer
            _sessionStart = DateTime.Now;
            _sessionTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1)
            };
            _sessionTimer.Tick += SessionTimer_Tick;
            _sessionTimer.Start();

            // Subscribe to browser events
            App.BrowserMonitor.BrowserAccessBlocked += OnBrowserAccessBlocked;
        }

        private void SessionTimer_Tick(object? sender, EventArgs e)
        {
            var elapsed = DateTime.Now - _sessionStart;
            SessionTimeText.Text = elapsed.ToString(@"hh\:mm\:ss");
        }

        private void OnBrowserAccessBlocked(object? sender, Services.BrowserAccessEventArgs e)
        {
            Dispatcher.Invoke(() =>
            {
                _blockedCount++;
                BlockedCountText.Text = _blockedCount.ToString();
            });
        }

        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            DragMove();
        }

        private void MinimizeButton_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;

            if (App.ConfigService.MinimizeToTray)
            {
                Hide();
                ((App)Application.Current).ShowNotification(
                    "Browser Access Authenticator",
                    "Application minimized to system tray. Double-click to restore.",
                    System.Windows.Forms.ToolTipIcon.Info
                );
            }
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            if (App.ConfigService.MinimizeToTray)
            {
                Hide();
                ((App)Application.Current).ShowNotification(
                    "Browser Access Authenticator",
                    "Application minimized to system tray. Double-click to restore.",
                    System.Windows.Forms.ToolTipIcon.Info
                );
            }
            else
            {
                Close();
            }
        }

        private void LogoutButton_Click(object sender, RoutedEventArgs e)
        {
            if (MessageBox.Show(
                "Are you sure you want to logout?\n\nYou will need to login again to access browsers.",
                "Logout Confirmation",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question) == MessageBoxResult.Yes)
            {
                _sessionTimer.Stop();
                App.BrowserMonitor.BrowserAccessBlocked -= OnBrowserAccessBlocked;
                App.Logout();
                Close();
            }
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            if (App.ConfigService.MinimizeToTray && App.CurrentUser != null)
            {
                e.Cancel = true;
                Hide();
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            _sessionTimer.Stop();
            App.BrowserMonitor.BrowserAccessBlocked -= OnBrowserAccessBlocked;
            base.OnClosed(e);
        }
    }
}
