# Browser Access Management System - Installation Guide

## System Requirements

### Web Server (Admin Panel & API)
- PHP 7.4 or higher (PHP 8.x recommended)
- MySQL 5.7+ or MariaDB 10.2+
- Apache or Nginx web server
- Required PHP Extensions:
  - PDO
  - PDO_MySQL
  - JSON
  - OpenSSL
  - mbstring

### Windows Desktop Application
- Windows 10/11 (64-bit)
- .NET 6.0 Runtime
- Internet connection

---

## Installation Steps

### Step 1: Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE browser_access_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import the database schema:
```bash
mysql -u root -p browser_access_manager < database/schema.sql
```

3. Default admin credentials:
   - Username: `admin`
   - Password: `password` (change immediately after first login)

### Step 2: Web Server Configuration

#### For GoDaddy (cPanel)

1. Upload the `web` folder contents to your `public_html` directory
2. Create a MySQL database via cPanel
3. Update `config/config.php` with your database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');

define('APP_URL', 'https://yourdomain.com');
define('API_URL', 'https://yourdomain.com/api');
```

4. Set folder permissions:
```bash
chmod 755 -R web/
chmod 777 web/uploads/  # If uploads folder exists
```

#### For Apache (.htaccess)

Create `.htaccess` in the web root:
```apache
RewriteEngine On
RewriteBase /

# Redirect to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]
```

#### For Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    root /var/www/browser-access-manager/web;
    index index.php;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /api {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### Step 3: Windows Application Setup

#### Building from Source

1. Install Visual Studio 2022 with .NET desktop development workload
2. Open `windows-app/BrowserAccessAuthenticator/BrowserAccessAuthenticator.sln`
3. Update the API URL in `Services/ConfigService.cs`:
```csharp
public string ApiBaseUrl { get; set; } = "https://yourdomain.com/api";
```
4. Build the solution (Release mode)
5. Publish as self-contained or framework-dependent

#### Distributing to Users

1. Create an installer using Inno Setup or similar
2. Include the .NET 6.0 runtime or make it framework-dependent
3. Configure auto-start with Windows (optional)

---

## Configuration

### Admin Panel Settings

Access the admin panel at: `https://yourdomain.com/admin/`

1. **Change Default Password**: First thing after login
2. **System Settings**: Configure via database `settings` table
3. **Support Contact**: Update in settings table

### API Configuration

The API is accessible at: `https://yourdomain.com/api/`

Test API status:
```bash
curl https://yourdomain.com/api/status
```

---

## Features Overview

### Admin Panel Features
- Admin login/logout with session management
- Change admin password
- User management (add/edit/delete/block)
- DNV (Do Not View) website management
- IP address blocking
- Push notifications to users
- Browsing history monitoring

### Windows Application Features
- User authentication
- Browser access control
- Real-time URL monitoring
- Push notification display
- Browsing history logging
- System tray integration

---

## Security Recommendations

1. **Always use HTTPS** for production
2. **Change default admin password** immediately
3. **Configure firewall** to allow only necessary ports
4. **Regular backups** of the database
5. **Keep PHP and MySQL updated**
6. **Use strong passwords** for all accounts

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify database credentials in config.php
- Check if MySQL service is running
- Ensure database user has proper privileges

**API Not Responding**
- Check PHP error logs
- Verify .htaccess or nginx configuration
- Test API status endpoint

**Windows App Login Failed**
- Verify API URL is correct
- Check network connectivity
- Verify user account is active

### Support

For technical support, contact:
- Email: support@example.com
- Phone: +1-3237397719

---

## License

Copyright 2024 Casca E-Connect Private Limited. All rights reserved.
