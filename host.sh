#!/bin/bash

# --- CONFIGURATION ---
DOMAIN="onboard.unqspaces.com"
EMAIL="admin@unqspaces.com"
PORT=3000 
# Automatically get the current folder path
APP_DIR=$(pwd)

echo "🚀 Starting Deployment for $DOMAIN in $APP_DIR..."

# 1. Update & Install Essentials
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx

# 2. Install PM2 Globally
sudo npm install -g pm2

# 3. Install Project Dependencies
echo "📥 Installing dependencies..."
npm install

# 4. FIX PERMISSIONS FOR SQLITE
# This ensures the Node process can write to the DB file and the folder
echo "🔑 Setting write permissions for Database and Uploads..."
sudo chown -R $USER:$USER $APP_DIR
chmod -R 755 $APP_DIR
# If your DB file is named 'database.sqlite', make sure it's writable
touch database.sqlite 2>/dev/null || true
chmod 666 *.sqlite 2>/dev/null || true

# 5. Setup PM2 Process
echo "⚙️ Starting Node.js app..."
pm2 delete onboard-api 2>/dev/null || true
pm2 start server.js --name "onboard-api"
pm2 save

# 6. Configure Nginx
echo "🌐 Configuring Nginx..."
cat <<EOF | sudo tee /etc/nginx/sites-available/$DOMAIN
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase upload size for Payment Screenshots
        client_max_body_size 10M;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo nginx -t && sudo systemctl restart nginx

# 7. Setup SSL
echo "🔒 Requesting SSL Certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "✅ Done! Visit https://$DOMAIN"