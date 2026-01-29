using System;
using System.IO;
using Newtonsoft.Json;

namespace BrowserAccessAuthenticator.Services
{
    public class ConfigService
    {
        private readonly string _configPath;
        private AppConfig _config;

        public string ApiBaseUrl => _config.ApiBaseUrl;
        public int NotificationCheckInterval => _config.NotificationCheckInterval;
        public int BlocklistRefreshInterval => _config.BlocklistRefreshInterval;
        public bool StartWithWindows => _config.StartWithWindows;
        public bool MinimizeToTray => _config.MinimizeToTray;

        public ConfigService()
        {
            var appDataPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "BrowserAccessAuthenticator"
            );

            if (!Directory.Exists(appDataPath))
            {
                Directory.CreateDirectory(appDataPath);
            }

            _configPath = Path.Combine(appDataPath, "config.json");
            LoadConfig();
        }

        private void LoadConfig()
        {
            if (File.Exists(_configPath))
            {
                try
                {
                    var json = File.ReadAllText(_configPath);
                    _config = JsonConvert.DeserializeObject<AppConfig>(json) ?? new AppConfig();
                }
                catch
                {
                    _config = new AppConfig();
                }
            }
            else
            {
                _config = new AppConfig();
                SaveConfig();
            }
        }

        public void SaveConfig()
        {
            var json = JsonConvert.SerializeObject(_config, Formatting.Indented);
            File.WriteAllText(_configPath, json);
        }

        public void SetApiBaseUrl(string url)
        {
            _config.ApiBaseUrl = url.TrimEnd('/');
            SaveConfig();
        }

        public void SetStartWithWindows(bool value)
        {
            _config.StartWithWindows = value;
            SaveConfig();
            UpdateStartupRegistry(value);
        }

        public void SetMinimizeToTray(bool value)
        {
            _config.MinimizeToTray = value;
            SaveConfig();
        }

        private void UpdateStartupRegistry(bool enable)
        {
            try
            {
                using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", true);

                if (key != null)
                {
                    if (enable)
                    {
                        var exePath = System.Reflection.Assembly.GetExecutingAssembly().Location
                            .Replace(".dll", ".exe");
                        key.SetValue("BrowserAccessAuthenticator", exePath);
                    }
                    else
                    {
                        key.DeleteValue("BrowserAccessAuthenticator", false);
                    }
                }
            }
            catch { }
        }

        private class AppConfig
        {
            public string ApiBaseUrl { get; set; } = "http://localhost/browser-access-manager/web/api";
            public int NotificationCheckInterval { get; set; } = 30; // seconds
            public int BlocklistRefreshInterval { get; set; } = 300; // 5 minutes
            public bool StartWithWindows { get; set; } = true;
            public bool MinimizeToTray { get; set; } = true;
        }
    }
}
