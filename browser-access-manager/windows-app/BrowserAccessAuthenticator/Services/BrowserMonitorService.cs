using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace BrowserAccessAuthenticator.Services
{
    public class BrowserMonitorService
    {
        private CancellationTokenSource? _cancellationTokenSource;
        private Task? _monitorTask;
        private HashSet<string> _blockedUrls = new();
        private HashSet<string> _blockedIps = new();
        private DateTime _lastBlocklistUpdate = DateTime.MinValue;

        // Known browser process names
        private readonly string[] _browserProcesses = new[]
        {
            "chrome", "firefox", "msedge", "opera", "brave", "iexplore",
            "vivaldi", "waterfox", "chromium", "seamonkey"
        };

        public event EventHandler<BrowserAccessEventArgs>? BrowserAccessBlocked;
        public event EventHandler<BrowserAccessEventArgs>? BrowserAccessAllowed;

        public bool IsRunning => _monitorTask != null && !_monitorTask.IsCompleted;

        public void Start()
        {
            if (IsRunning) return;

            _cancellationTokenSource = new CancellationTokenSource();
            _monitorTask = Task.Run(() => MonitorLoop(_cancellationTokenSource.Token));

            // Initial blocklist load
            _ = RefreshBlocklistAsync();
        }

        public void Stop()
        {
            _cancellationTokenSource?.Cancel();
            _monitorTask = null;
        }

        public async Task RefreshBlocklistAsync()
        {
            try
            {
                var response = await App.ApiService.GetBlocklistAsync();
                if (response?.Success == true && response.Data != null)
                {
                    _blockedUrls = new HashSet<string>(
                        response.Data.Urls.Select(u => ExtractDomain(u).ToLower()),
                        StringComparer.OrdinalIgnoreCase
                    );
                    _blockedIps = new HashSet<string>(
                        response.Data.Ips,
                        StringComparer.OrdinalIgnoreCase
                    );
                    _lastBlocklistUpdate = DateTime.Now;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to refresh blocklist: {ex.Message}");
            }
        }

        private async Task MonitorLoop(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    // Refresh blocklist periodically
                    if ((DateTime.Now - _lastBlocklistUpdate).TotalMinutes >= 5)
                    {
                        await RefreshBlocklistAsync();
                    }

                    // Check running browsers
                    foreach (var browserName in _browserProcesses)
                    {
                        var processes = Process.GetProcessesByName(browserName);
                        foreach (var process in processes)
                        {
                            try
                            {
                                var url = GetBrowserUrl(process);
                                if (!string.IsNullOrEmpty(url))
                                {
                                    await CheckAndHandleUrl(url, browserName, process);
                                }
                            }
                            catch { }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Monitor error: {ex.Message}");
                }

                await Task.Delay(1000, cancellationToken);
            }
        }

        private async Task CheckAndHandleUrl(string url, string browser, Process process)
        {
            var domain = ExtractDomain(url).ToLower();

            // Check if blocked
            bool isBlocked = _blockedUrls.Any(blocked =>
                domain.Contains(blocked) || blocked.Contains(domain));

            if (isBlocked)
            {
                // Kill the process or navigate away
                try
                {
                    // Record blocked attempt
                    _ = App.ApiService.RecordHistoryAsync(url, null, browser, true, "URL in DNV list");

                    // Show notification
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        BrowserAccessBlocked?.Invoke(this, new BrowserAccessEventArgs
                        {
                            Url = url,
                            Browser = browser,
                            Reason = "This website is blocked by administrator"
                        });

                        // Show message box
                        MessageBox.Show(
                            $"Access to {domain} has been blocked.\n\nDue to security reasons admin of the website has restricted you to browse this website.\n\nPlease contact our support +1-3237397719.",
                            "Access Denied - Browser Access Management",
                            MessageBoxButton.OK,
                            MessageBoxImage.Warning
                        );
                    });

                    // Try to close the tab or kill process
                    // Note: This is a simplified approach - full implementation would use browser extensions
                }
                catch { }
            }
            else
            {
                // Record allowed access
                _ = App.ApiService.RecordHistoryAsync(url, null, browser, false, null);

                BrowserAccessAllowed?.Invoke(this, new BrowserAccessEventArgs
                {
                    Url = url,
                    Browser = browser
                });
            }
        }

        private string GetBrowserUrl(Process process)
        {
            // This is a simplified implementation
            // For full functionality, browser extensions would be needed
            try
            {
                var handle = process.MainWindowHandle;
                if (handle == IntPtr.Zero) return string.Empty;

                // Get window title which often contains the URL or page title
                var title = process.MainWindowTitle;

                // For Chrome/Edge, the URL might be in the window title
                // This is a basic approach - real implementation would use accessibility APIs
                return title;
            }
            catch
            {
                return string.Empty;
            }
        }

        private string ExtractDomain(string url)
        {
            try
            {
                if (!url.StartsWith("http://") && !url.StartsWith("https://"))
                {
                    url = "https://" + url;
                }

                var uri = new Uri(url);
                return uri.Host;
            }
            catch
            {
                return url;
            }
        }

        public bool IsUrlBlocked(string url)
        {
            var domain = ExtractDomain(url).ToLower();
            return _blockedUrls.Any(blocked =>
                domain.Contains(blocked) || blocked.Contains(domain));
        }
    }

    public class BrowserAccessEventArgs : EventArgs
    {
        public string Url { get; set; } = string.Empty;
        public string Browser { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
}
