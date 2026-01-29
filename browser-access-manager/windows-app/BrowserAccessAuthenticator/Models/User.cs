using System;
using Newtonsoft.Json;

namespace BrowserAccessAuthenticator.Models
{
    public class User
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("user_id")]
        public string UserId { get; set; } = string.Empty;

        [JsonProperty("username")]
        public string Username { get; set; } = string.Empty;

        [JsonProperty("full_name")]
        public string FullName { get; set; } = string.Empty;

        [JsonProperty("email")]
        public string Email { get; set; } = string.Empty;

        [JsonProperty("department")]
        public string? Department { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; } = "active";
    }

    public class LoginResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; } = string.Empty;

        [JsonProperty("data")]
        public LoginData? Data { get; set; }
    }

    public class LoginData
    {
        [JsonProperty("token")]
        public string Token { get; set; } = string.Empty;

        [JsonProperty("expires_at")]
        public string ExpiresAt { get; set; } = string.Empty;

        [JsonProperty("user")]
        public User? User { get; set; }
    }

    public class Notification
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; } = string.Empty;

        [JsonProperty("message")]
        public string Message { get; set; } = string.Empty;

        [JsonProperty("type")]
        public string Type { get; set; } = "info";

        [JsonProperty("priority")]
        public int Priority { get; set; }

        [JsonProperty("user_notification_id")]
        public int UserNotificationId { get; set; }
    }

    public class ApiResponse<T>
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; } = string.Empty;

        [JsonProperty("data")]
        public T? Data { get; set; }

        [JsonProperty("timestamp")]
        public string Timestamp { get; set; } = string.Empty;
    }

    public class BlocklistData
    {
        [JsonProperty("urls")]
        public string[] Urls { get; set; } = Array.Empty<string>();

        [JsonProperty("ips")]
        public string[] Ips { get; set; } = Array.Empty<string>();

        [JsonProperty("last_updated")]
        public string LastUpdated { get; set; } = string.Empty;
    }

    public class UrlCheckResult
    {
        [JsonProperty("url")]
        public string Url { get; set; } = string.Empty;

        [JsonProperty("blocked")]
        public bool Blocked { get; set; }

        [JsonProperty("reason")]
        public string? Reason { get; set; }
    }

    public class NotificationsData
    {
        [JsonProperty("notifications")]
        public Notification[] Notifications { get; set; } = Array.Empty<Notification>();

        [JsonProperty("count")]
        public int Count { get; set; }
    }
}
