using System;
using System.Windows;
using System.Windows.Input;

namespace BrowserAccessAuthenticator.Views
{
    public partial class LoginWindow : Window
    {
        public LoginWindow()
        {
            InitializeComponent();
            UsernameTextBox.Focus();
        }

        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            DragMove();
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            if (MessageBox.Show(
                "You need to login to access the internet.\nAre you sure you want to exit?",
                "Exit Confirmation",
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning) == MessageBoxResult.Yes)
            {
                Application.Current.Shutdown();
            }
        }

        private void Input_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                LoginButton_Click(sender, e);
            }
        }

        private async void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            var username = UsernameTextBox.Text.Trim();
            var password = PasswordBox.Password;

            // Validate input
            if (string.IsNullOrEmpty(username))
            {
                ShowError("Please enter your username");
                UsernameTextBox.Focus();
                return;
            }

            if (string.IsNullOrEmpty(password))
            {
                ShowError("Please enter your password");
                PasswordBox.Focus();
                return;
            }

            // Show loading
            SetLoading(true);
            HideError();

            try
            {
                var machineName = Environment.MachineName;
                var response = await App.ApiService.LoginAsync(username, password, machineName);

                if (response.Success && response.Data != null)
                {
                    // Store token and user info
                    App.AuthToken = response.Data.Token;
                    App.CurrentUser = response.Data.User;

                    // Configure API service with token
                    App.ApiService.SetAuthToken(response.Data.Token);

                    // Start services
                    App.BrowserMonitor.Start();
                    App.NotificationService.Start();

                    // Show main window
                    var mainWindow = new MainWindow();
                    mainWindow.Show();

                    // Close login window
                    Close();
                }
                else
                {
                    ShowError(response.Message ?? "Login failed. Please try again.");
                    PasswordBox.Clear();
                    PasswordBox.Focus();
                }
            }
            catch (Exception ex)
            {
                ShowError($"Connection error: {ex.Message}\nPlease check your network connection.");
            }
            finally
            {
                SetLoading(false);
            }
        }

        private void ShowError(string message)
        {
            ErrorMessage.Text = message;
            ErrorMessage.Visibility = Visibility.Visible;
        }

        private void HideError()
        {
            ErrorMessage.Visibility = Visibility.Collapsed;
        }

        private void SetLoading(bool isLoading)
        {
            LoadingOverlay.Visibility = isLoading ? Visibility.Visible : Visibility.Collapsed;
            LoginButton.IsEnabled = !isLoading;
            UsernameTextBox.IsEnabled = !isLoading;
            PasswordBox.IsEnabled = !isLoading;
        }
    }
}
