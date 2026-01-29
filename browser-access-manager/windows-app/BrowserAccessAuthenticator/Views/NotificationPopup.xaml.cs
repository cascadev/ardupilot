using System;
using System.Windows;
using System.Windows.Media;
using System.Windows.Threading;
using BrowserAccessAuthenticator.Models;

namespace BrowserAccessAuthenticator.Views
{
    public partial class NotificationPopup : Window
    {
        private readonly DispatcherTimer _autoCloseTimer;

        public NotificationPopup(Notification notification)
        {
            InitializeComponent();

            // Set content
            TitleText.Text = notification.Title;
            MessageText.Text = notification.Message;

            // Set style based on type
            SetNotificationStyle(notification.Type);

            // Position in bottom-right corner
            var workArea = SystemParameters.WorkArea;
            Left = workArea.Right - Width - 20;
            Top = workArea.Bottom - Height - 20;

            // Auto-close timer (30 seconds)
            _autoCloseTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(30)
            };
            _autoCloseTimer.Tick += (s, e) =>
            {
                _autoCloseTimer.Stop();
                Close();
            };
            _autoCloseTimer.Start();

            // Play notification sound
            System.Media.SystemSounds.Asterisk.Play();
        }

        private void SetNotificationStyle(string type)
        {
            Color headerColor;
            string icon;

            switch (type.ToLower())
            {
                case "warning":
                    headerColor = Color.FromRgb(255, 152, 0); // Orange
                    icon = "⚠";
                    break;
                case "alert":
                    headerColor = Color.FromRgb(255, 193, 7); // Yellow
                    icon = "🔔";
                    break;
                case "critical":
                    headerColor = Color.FromRgb(244, 67, 54); // Red
                    icon = "🚨";
                    break;
                default: // info
                    headerColor = Color.FromRgb(33, 150, 243); // Blue
                    icon = "ℹ";
                    break;
            }

            HeaderBorder.Background = new SolidColorBrush(headerColor);
            TitleText.Foreground = Brushes.White;
            TypeIcon.Text = icon;
            TypeIcon.Foreground = Brushes.White;
            MainBorder.BorderBrush = new SolidColorBrush(headerColor);
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            _autoCloseTimer.Stop();
            Close();
        }

        private void OkButton_Click(object sender, RoutedEventArgs e)
        {
            _autoCloseTimer.Stop();
            Close();
        }
    }
}
