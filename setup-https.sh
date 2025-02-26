#!/bin/bash
# 确保脚本在出错时停止执行
set -e

echo "开始配置HTTPS..."

# 安装Nginx（如果未安装）
if ! command -v nginx &> /dev/null; then
  echo "安装Nginx..."
  if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    sudo apt-get update
    sudo apt-get install -y nginx
  elif command -v yum &> /dev/null; then
    # CentOS
    sudo yum install -y nginx
  else
    echo "无法识别的包管理器，请手动安装Nginx"
    exit 1
  fi
fi

# 安装Certbot（用于获取Let's Encrypt证书）
echo "安装Certbot..."
if command -v apt-get &> /dev/null; then
  # Ubuntu/Debian
  sudo apt-get install -y certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
  # CentOS
  sudo yum install -y certbot python3-certbot-nginx
else
  echo "无法识别的包管理器，请手动安装Certbot"
  exit 1
fi

# 创建自签名证书（如果无法使用Let's Encrypt）
echo "创建自签名证书..."
mkdir -p ~/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ~/ssl/private.key -out ~/ssl/certificate.crt -subj "/CN=212.192.221.50"

# 配置Nginx
echo "配置Nginx..."
sudo tee /etc/nginx/conf.d/gomoku.conf > /dev/null << EOL
server {
    listen 80;
    server_name 212.192.221.50;
    
    # 将HTTP请求重定向到HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name 212.192.221.50;
    
    ssl_certificate /home/$(whoami)/ssl/certificate.crt;
    ssl_certificate_key /home/$(whoami)/ssl/private.key;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # 反向代理到Node.js应用
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

# 测试Nginx配置
echo "测试Nginx配置..."
sudo nginx -t

# 重启Nginx
echo "重启Nginx..."
sudo systemctl restart nginx

# 配置防火墙
echo "配置防火墙..."
if command -v ufw &> /dev/null; then
  # Ubuntu
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw reload
elif command -v firewall-cmd &> /dev/null; then
  # CentOS
  sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
  sudo firewall-cmd --zone=public --add-port=443/tcp --permanent
  sudo firewall-cmd --reload
fi

echo "HTTPS配置完成！"
echo "现在你可以通过 https://212.192.221.50 访问你的应用"
echo ""
echo "注意：这是使用自签名证书配置的HTTPS，浏览器会显示不安全警告"
echo "如果需要使用Let's Encrypt获取受信任的证书，请确保你有一个域名" 