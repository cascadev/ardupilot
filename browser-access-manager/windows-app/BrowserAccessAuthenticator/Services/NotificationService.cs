using System;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using BrowserAccessAuthenticator.Models;
using BrowserAccessAuthenticator.Views;

namespace BrowserAccessAuthenticator.Services
{
    public class NotificationService
    {
        private CancellationTokenSource? _cancellationTokenSource;
        private Task? _pollingTask;

        public event EventHandler<Notification>? NotificationReceived;

        public bool IsRunning => _pollingTask != null && !_pollingTask.IsCompleted;

        public void Start()
        {
            if (IsRunning) return;

            _cancellationTokenSource = new CancellationTokenSource();
            _pollingTask = Task.Run(() => PollNotifications(_cancellationTokenSource.Token));
        }

        public void Stop()
        {
            _cancellationTokenSource?.Cancel();
            _pollingTask = null;
        }

        private async Task PollNotifications(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    var response = await App.ApiService.GetPendingNotificationsAsync();

                    if (response?.Success == true && response.Data?.Notifications != null)
                    {
                        foreach (var notification in response.Data.Notifications)
                        {
                            // Mark as delivered
                            await App.ApiService.AcknowledgeNotificationAsync(notification.UserNotificationId);

                            // Show notification
                            Application.Current.Dispatcher.Invoke(() =>
                            {
                                ShowNotificationPopup(notification);
                                NotificationReceived?.Invoke(this, notification);
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Notification poll error: {ex.Message}");
                }

                // Wait before next poll
                await Task.Delay(TimeSpan.FromSeconds(App.ConfigService.NotificationCheckInterval), cancellationToken);
            }
        }

        private void ShowNotificationPopup(Notification notification)
        {
            var popup = new NotificationPopup(notification);
            popup.Show();

            // Also show system tray notification
            var icon = notification.Type switch
            {
                "warning" => System.Windows.Forms.ToolTipIcon.Warning,
                "alert" => System.Windows.Forms.ToolTipIcon.Warning,
                "critical" => System.Windows.Forms.ToolTipIcon.Error,
                _ => System.Windows.Forms.ToolTipIcon.Info
            };

            ((App)Application.Current).ShowNotification(notification.Title, notification.Message, icon);
        }
    }
}
