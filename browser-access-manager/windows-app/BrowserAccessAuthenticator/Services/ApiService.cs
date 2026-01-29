using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using BrowserAccessAuthenticator.Models;

namespace BrowserAccessAuthenticator.Services
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;
        private string _baseUrl;

        public ApiService(string baseUrl)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(30)
            };
        }

        public void SetBaseUrl(string url)
        {
            _baseUrl = url.TrimEnd('/');
        }

        public void SetAuthToken(string token)
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
        }

        public async Task<LoginResponse> LoginAsync(string username, string password, string machineName)
        {
            var content = new StringContent(
                JsonConvert.SerializeObject(new
                {
                    username,
                    password,
                    machine_name = machineName
                }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{_baseUrl}/auth/login", content);
            var json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<LoginResponse>(json)
                ?? new LoginResponse { Success = false, Message = "Failed to parse response" };
        }

        public async Task<bool> LogoutAsync(string token)
        {
            try
            {
                var content = new StringContent(
                    JsonConvert.SerializeObject(new { token }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_baseUrl}/auth/logout", content);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<ApiResponse<object>?> ValidateTokenAsync(string token)
        {
            var content = new StringContent(
                JsonConvert.SerializeObject(new { token }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{_baseUrl}/auth/validate", content);
            var json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<ApiResponse<object>>(json);
        }

        public async Task<ApiResponse<BlocklistData>?> GetBlocklistAsync()
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/check/blocklist");
            var json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<ApiResponse<BlocklistData>>(json);
        }

        public async Task<ApiResponse<UrlCheckResult>?> CheckUrlAsync(string url)
        {
            var content = new StringContent(
                JsonConvert.SerializeObject(new { url }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{_baseUrl}/check/url", content);
            var json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<ApiResponse<UrlCheckResult>>(json);
        }

        public async Task<ApiResponse<NotificationsData>?> GetPendingNotificationsAsync()
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/notifications/pending");
            var json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<ApiResponse<NotificationsData>>(json);
        }

        public async Task AcknowledgeNotificationAsync(int userNotificationId)
        {
            var content = new StringContent(
                JsonConvert.SerializeObject(new { user_notification_id = userNotificationId }),
                Encoding.UTF8,
                "application/json"
            );

            await _httpClient.PostAsync($"{_baseUrl}/notifications/acknowledge", content);
        }

        public async Task RecordHistoryAsync(string url, string? title, string browser, bool blocked = false, string? blockReason = null)
        {
            var content = new StringContent(
                JsonConvert.SerializeObject(new
                {
                    url,
                    title,
                    browser,
                    machine_name = Environment.MachineName,
                    blocked = blocked ? 1 : 0,
                    block_reason = blockReason
                }),
                Encoding.UTF8,
                "application/json"
            );

            await _httpClient.PostAsync($"{_baseUrl}/history/record", content);
        }

        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/status");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }
}
